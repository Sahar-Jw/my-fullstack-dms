'use client';

import { useRef, useState, DragEvent } from 'react';
import { formatBytes } from '@/lib/format';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel.sheet.macroEnabled.12',
  'text/csv',
  'text/plain',
];

const ALLOWED_EXTENSIONS = [
  'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp',
  'doc', 'docx',
  'xls', 'xlsx', 'xlsm', 'csv',
  'txt',
];

function validateFile(file: File): boolean {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  return ALLOWED_MIME_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(ext);
}

export default function FileDrop({
  files,
  onChange,
  accept,
  multiple = false,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const acceptedTypes =
    accept || '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv';

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length === 0) return;

    const picked = multiple ? dropped : [dropped[0]];
    const valid = picked.filter(validateFile);

    if (valid.length !== picked.length) {
      alert('Some files were skipped. Allowed: PDF, JPEG, PNG, Word, Excel, or CSV files.');
    }
    if (valid.length > 0) onChange(valid);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const valid = selected.filter(validateFile);

    if (valid.length !== selected.length) {
      alert('Some files were skipped. Allowed: PDF, JPEG, PNG, Word, Excel, or CSV files.');
    }
    if (valid.length > 0) {
      onChange(valid);
    } else {
      e.target.value = '';
    }
  };

  return (
    <div
      className={`dropzone${dragOver ? ' dragover' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={acceptedTypes}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      {files.length > 0 ? (
        <>
          <div>
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </div>
          <ul className="dropzone-file" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                {f.name} · {formatBytes(f.size)}
              </li>
            ))}
          </ul>
          <div className="dropzone-file">click to replace</div>
        </>
      ) : (
        <>
          <div>Drop {multiple ? 'files' : 'a file'} here, or click to browse</div>
          <div className="dropzone-file">
            PDF, JPEG, PNG, Word (.doc, .docx), Excel (.xls, .xlsx), CSV · max 10MB{multiple ? ' each' : ''}
          </div>
        </>
      )}
    </div>
  );
}
