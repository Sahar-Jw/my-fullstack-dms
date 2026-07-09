'use client';

import { useRef, useState, DragEvent } from 'react';
import { formatBytes } from '@/lib/format';

export default function FileDrop({
  file,
  onChange,
  accept,
}: {
  file: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onChange(dropped);
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
        accept={accept}
        style={{ display: 'none' }}
        onChange={(e) => onChange(e.target.files?.[0] || null)}
      />
      {file ? (
        <>
          <div>{file.name}</div>
          <div className="dropzone-file">{formatBytes(file.size)} · click to replace</div>
        </>
      ) : (
        <>
          <div>Drop a file here, or click to browse</div>
          <div className="dropzone-file">PDF, JPEG, PNG, or Word · max 10MB</div>
        </>
      )}
    </div>
  );
}
