'use client';

import Modal from "../ui/Modal";
import Stamp from "../ui/Stamp";


export default function AttachmentModal({ open, onClose, onUpload }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="إضافة مرفق"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn btn-primary" onClick={onUpload}>
            رفع
          </button>
        </>
      }
    >
      <div className="dropzone">
        <Stamp size="sm" style={{ margin: '0 auto 10px' }}>
          ↑
        </Stamp>
        <b>اسحب ملفاً واحداً أو أكثر هنا</b>
        <p style={{ marginTop: 4 }}>أو اضغط للاختيار من جهازك</p>
      </div>
    </Modal>
  );
}
