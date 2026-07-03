'use client';

import { useState } from 'react';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { EditIcon, PlusIcon, TrashIcon } from '../../../components/icons';
import { useApp } from '../../../context/AppContext';
import DepartmentModal from '../../../components/modals/DepartmentModal';
import { DEPTS } from '../../../lib/mockData';

export default function DepartmentsPage() {
  const { showToast } = useApp();
  const [modalDept, setModalDept] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  return (
    <>
      <div className="toolbar">
        <h2 style={{ fontSize: 17 }}>الأقسام التنظيمية</h2>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setModalDept(null)}>
          <PlusIcon />
          إضافة قسم
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>اسم القسم</th>
              <th>الوصف</th>
              <th>عدد المستخدمين</th>
              <th>عدد الوثائق</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DEPTS.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td style={{ color: 'var(--ink-soft)' }}>{d.desc}</td>
                <td className="mono">{d.users}</td>
                <td className="mono">{d.docs}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="تعديل" onClick={() => setModalDept(d)}>
                      <EditIcon />
                    </button>
                    <button className="icon-btn danger" title="حذف" onClick={() => setConfirmTarget(d.name)}>
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DepartmentModal
        open={modalDept !== undefined}
        department={modalDept ?? null}
        onClose={() => setModalDept(undefined)}
        onSave={() => {
          showToast('تم حفظ القسم');
          setModalDept(undefined);
        }}
      />
      <ConfirmModal
        open={confirmTarget !== null}
        text={`لا يمكن حذف قسم '${confirmTarget}' لارتباطه بمستخدمين ووثائق. أزل الارتباطات أولاً.`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => setConfirmTarget(null)}
      />
    </>
  );
}
