'use client';

import Modal from "../ui/Modal";


export default function DepartmentModal({ open, department, onClose, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? 'تعديل قسم' : 'إضافة قسم جديد'}
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
        <label>اسم القسم</label>
        <input placeholder="مثال: تقنية المعلومات" defaultValue={department?.name} />
      </div>
      <div className="field">
        <label>الوصف</label>
        <textarea rows={3} placeholder="وصف مختصر لمهام القسم" defaultValue={department?.desc} />
      </div>
    </Modal>
  );
}
