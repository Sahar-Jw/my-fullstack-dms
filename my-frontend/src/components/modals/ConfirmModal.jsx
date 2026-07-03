'use client';

import Modal from '../ui/Modal';
import Stamp from '../ui/Stamp';


export default function ConfirmModal({ open, text, onClose, onConfirm }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      danger
      footer={
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, width: '100%' }}>
          <button className="btn btn-ghost" onClick={onClose}>
            تراجع
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            تأكيد الحذف
          </button>
        </div>
      }
    >
      <div style={{ textAlign: 'center', paddingTop: 8 }}>
        <Stamp style={{ margin: '0 auto' }}>!</Stamp>
        <h3 style={{ margin: '14px 0 8px' }}>تأكيد الحذف</h3>
        <p style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>{text}</p>
      </div>
    </Modal>
  );
}
