'use client';

import Modal from "../ui/Modal";



export default function CategoryModal({ open, category, onClose, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'تعديل تصنيف' : 'إضافة تصنيف جديد'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            إلغاء
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            حفظ
          </button>
        </>
      }
    >
      <div className="field">
        <label>اسم التصنيف</label>
        <input placeholder="مثال: Legal" defaultValue={category?.name} />
      </div>
      <div className="field">
        <label>الوصف</label>
        <textarea rows={3} placeholder="وصف مختصر لهذا التصنيف" defaultValue={category?.desc} />
      </div>
    </Modal>
  );
}
