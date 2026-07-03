'use client';

import { useApp } from "../../context/AppContext";


export default function Toast() {
  const { toast } = useApp();
  return (
    <div id="toast" className={toast.show ? 'show' : ''}>
      <span className="dot" />
      <span>{toast.message || 'تم الحفظ بنجاح'}</span>
    </div>
  );
}
