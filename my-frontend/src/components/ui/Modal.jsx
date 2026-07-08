'use client';

import { CloseIcon } from '../icons';

export default function Modal({ open, onClose, title, danger, children, footer, maxWidth }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div
        className={`w-full max-w-lg rounded-[18px] border border-[#e3ddc9] bg-[#fffdf8] shadow-[0_20px_60px_rgba(28,43,57,0.18)] ${danger ? 'border-[#f0c3b8]' : ''}`}
        style={maxWidth ? { maxWidth } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
            <h3 className="text-lg text-[#1c2b39]">{title}</h3>
            <button
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]"
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </div>
        )}
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-[#ede8db] px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
