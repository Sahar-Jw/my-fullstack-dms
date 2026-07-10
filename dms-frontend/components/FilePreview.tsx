// components/FilePreview.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { PreviewLoadState, PreviewTarget } from '@/lib/types';

interface FilePreviewProps {
  target: PreviewTarget;
}

const PDF_TYPE = 'application/pdf';
const DOCX_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const UNVIEWABLE_IMAGE_TYPES = new Set(['image/tiff', 'image/heic', 'image/heif']);
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken(): string | null {
  return typeof window !== 'undefined' ? window.localStorage.getItem('dms_token') : null;
}

export default function FilePreview({ target }: FilePreviewProps) {
  const { previewPath, filename, mimeType } = target;
  const [state, setState] = useState<PreviewLoadState>('idle');
  const [error, setError] = useState('');
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);

  const mime = mimeType.toLowerCase();
  const isPdf = mime === PDF_TYPE;
  const isDocx = mime === DOCX_TYPE;
  const isImageFamily = mime.startsWith('image/');
  const isUnviewableImage = isImageFamily && UNVIEWABLE_IMAGE_TYPES.has(mime);
  const isRenderableImage = isImageFamily && !isUnviewableImage;
  const isSupported = isPdf || isDocx || isRenderableImage;

  useEffect(() => {
    let cancelled = false;
    let createdUrl: string | null = null;

    async function load() {
      setState('loading');
      setError('');

      if (isUnviewableImage) {
        setState('ready');
        return;
      }
      try {
        const token = getToken();
        const res = await fetch(`${API_URL}${previewPath}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Failed to load file (HTTP ${res.status})`);

        if (isDocx) {
          const arrayBuffer = await res.arrayBuffer();
          if (cancelled) return;
          const { renderAsync } = await import('docx-preview');
          if (docxContainerRef.current) {
            docxContainerRef.current.innerHTML = '';
            await renderAsync(arrayBuffer, docxContainerRef.current, undefined, {
              className: 'docx-preview',
              inWrapper: true,
            });
          }
          if (!cancelled) setState('ready');
          return;
        }

        const blob = await res.blob();
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
        setState('ready');
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load preview');
          setState('error');
        }
      }
    }

    load();
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [previewPath, isDocx, isUnviewableImage]);

  const downloadUrl = `${API_URL}${previewPath}`;

  return (
    <div className="file-preview-container">
      {state === 'loading' && <div className="file-preview-loading" role="status">Loading preview…</div>}
      {state === 'error' && <div className="file-preview-error" role="alert">Could not load preview: {error}</div>}

      {state === 'ready' && !isSupported && (
        <div className="file-preview-unsupported">
          <p>
            {isUnviewableImage
              ? `${mime.split('/')[1]?.toUpperCase()} images can't be previewed in the browser.`
              : 'Preview not available for this file type.'}
          </p>
          <a href={downloadUrl} download={filename} className="file-preview-download-link">
            Download {filename}
          </a>
        </div>
      )}

      {isRenderableImage && objectUrl && state === 'ready' && (
        <img src={objectUrl} alt={filename} className="file-preview-image" />
      )}

      {isPdf && objectUrl && state === 'ready' && (
        <object data={objectUrl} type="application/pdf" className="file-preview-pdf" aria-label={filename}>
          <iframe src={objectUrl} title={filename} className="file-preview-pdf" />
        </object>
      )}

      {isDocx && (
        <div
          ref={docxContainerRef}
          className="file-preview-docx"
          style={{ display: state === 'ready' ? 'block' : 'none' }}
        />
      )}
    </div>
  );
}