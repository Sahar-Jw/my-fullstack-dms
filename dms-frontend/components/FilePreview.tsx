// components/FilePreview.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { PreviewLoadState, PreviewTarget } from '@/lib/types';
// Import ExcelJS for Excel preview
import * as XLSX from 'xlsx';

interface FilePreviewProps {
  target: PreviewTarget;
}

const PDF_TYPE = 'application/pdf';
const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
// Excel types
const XLS_TYPE = 'application/vnd.ms-excel';
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_TYPE = 'text/csv';
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
  const [excelData, setExcelData] = useState<any[]>([]);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const excelContainerRef = useRef<HTMLDivElement>(null);

  const mime = mimeType.toLowerCase();
  const isPdf = mime === PDF_TYPE;
  const isDocx = mime === DOCX_TYPE;
  const isExcel = mime === XLS_TYPE || mime === XLSX_TYPE || mime === CSV_TYPE;
  const isImageFamily = mime.startsWith('image/');
  const isUnviewableImage = isImageFamily && UNVIEWABLE_IMAGE_TYPES.has(mime);
  const isRenderableImage = isImageFamily && !isUnviewableImage;
  const isSupported = isPdf || isDocx || isRenderableImage || isExcel;

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

        if (!res.ok) {
          // Check if it's a 400 with a message
          if (res.status === 400) {
            try {
              const data = await res.json();
              if (data.message) {
                setError(data.message);
                setState('error');
                return;
              }
            } catch {
              // If response isn't JSON, continue
            }
          }
          throw new Error(`Failed to load file (HTTP ${res.status})`);
        }

        // Handle DOCX files
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

        // Handle Excel files
        if (isExcel) {
          const arrayBuffer = await res.arrayBuffer();
          if (cancelled) return;
          
          try {
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const data = XLSX.utils.sheet_to_json(firstSheet);
            
            if (data && data.length > 0) {
              setExcelColumns(Object.keys(data[0]));
              setExcelData(data);
            } else {
              setError('Excel file is empty');
              setState('error');
              return;
            }
            if (!cancelled) setState('ready');
          } catch (err) {
            setError('Failed to parse Excel file');
            setState('error');
          }
          return;
        }

        // Handle other files (PDF, images)
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
  }, [previewPath, isDocx, isExcel, isUnviewableImage]);

  const downloadUrl = `${API_URL}${previewPath}`;

  return (
    <div className="file-preview-container">
      {state === 'loading' && (
        <div className="file-preview-loading" role="status">
          <div className="spinner"></div>
          <span>Loading preview…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="file-preview-error" role="alert">
          <svg className="w-12 h-12 mx-auto mb-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">{error}</p>
          <a href={downloadUrl} download={filename} className="btn btn-primary mt-3">
            Download {filename}
          </a>
        </div>
      )}

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

      {/* Image Preview */}
      {isRenderableImage && objectUrl && state === 'ready' && (
        <img src={objectUrl} alt={filename} className="file-preview-image" />
      )}

      {/* PDF Preview */}
      {isPdf && objectUrl && state === 'ready' && (
        <object data={objectUrl} type="application/pdf" className="file-preview-pdf" aria-label={filename}>
          <iframe src={objectUrl} title={filename} className="file-preview-pdf" />
        </object>
      )}

      {/* DOCX Preview */}
      {isDocx && (
        <div
          ref={docxContainerRef}
          className="file-preview-docx"
          style={{ display: state === 'ready' ? 'block' : 'none' }}
        />
      )}

      {/* Excel Preview */}
      {isExcel && state === 'ready' && excelData.length > 0 && (
        <div className="file-preview-excel">
          <div className="excel-header">
            <h3 className="text-sm font-medium text-gray-700">
              {filename} ({excelData.length} rows)
            </h3>
            <a href={downloadUrl} download={filename} className="btn btn-secondary btn-sm">
              Download
            </a>
          </div>
          <div className="excel-table-wrapper">
            <table className="excel-table">
              <thead>
                <tr>
                  {excelColumns.map((col, idx) => (
                    <th key={idx}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {excelData.slice(0, 100).map((row, rowIdx) => (
                  <tr key={rowIdx}>
                    {excelColumns.map((col, colIdx) => (
                      <td key={colIdx}>{row[col] !== undefined ? String(row[col]) : ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {excelData.length > 100 && (
              <div className="excel-footer">
                Showing first 100 rows of {excelData.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}