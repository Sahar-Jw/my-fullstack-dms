'use client';

import { useApp } from '../../context/AppContext';

export default function Toast() {
  const { toast } = useApp();

  return (
    <div
      className={`fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#e3ddc9] bg-[#fffdf8] px-4 py-2 text-sm text-[#1c2b39] shadow-lg transition ${toast.show ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
      <span>{toast.message || 'Saved successfully'}</span>
    </div>
  );
}
