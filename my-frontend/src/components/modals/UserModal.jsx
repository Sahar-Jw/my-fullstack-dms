'use client';

import { DEPT_NAMES } from '../../lib/mockData';
import Modal from '../ui/Modal';


export default function UserModal({ open, user, onClose, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'تعديل بيانات مستخدم' : 'إضافة مستخدم جديد'}
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
        <label>الاسم الكامل</label>
        <input placeholder="مثال: سارة أحمد" defaultValue={user?.name} />
      </div>
      <div className="field">
        <label>البريد الإلكتروني</label>
        <input type="email" placeholder="name@organization.com" defaultValue={user?.email} />
      </div>
      <div className="field-row">
        <div className="field">
          <label>القسم</label>
          <select defaultValue={user?.dept ?? DEPT_NAMES[0]}>
            {DEPT_NAMES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>الدور</label>
          <select defaultValue={user?.role ?? 'Employee'}>
            <option>Employee</option>
            <option>Manager</option>
            <option>Admin</option>
          </select>
        </div>
      </div>
      <div className="field">
        <label>كلمة مرور مؤقتة</label>
        <input type="password" placeholder="ستُطلب من المستخدم تغييرها عند أول دخول" />
      </div>
    </Modal>
  );
}
