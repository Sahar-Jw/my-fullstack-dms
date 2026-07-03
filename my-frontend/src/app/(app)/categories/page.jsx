'use client';

import { useState } from 'react';
import CategoryModal from '../../../components/modals/CategoryModal';
import { EditIcon, PlusIcon, TrashIcon } from '../../../components/icons';
import { useApp } from '../../../context/AppContext';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { CATS } from '../../../lib/mockData';

export default function CategoriesPage() {
  const { showToast } = useApp();
  const [modalCat, setModalCat] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  return (
    <>
      <div className="toolbar">
        <h2 style={{ fontSize: 17 }}>تصنيفات الوثائق</h2>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setModalCat(null)}>
          <PlusIcon />
          إضافة تصنيف
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>اسم التصنيف</th>
              <th>الوصف</th>
              <th>عدد الوثائق</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {CATS.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: 'var(--ink-soft)' }}>{c.desc}</td>
                <td className="mono">{c.docs}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="تعديل" onClick={() => setModalCat(c)}>
                      <EditIcon />
                    </button>
                    <button className="icon-btn danger" title="حذف" onClick={() => setConfirmTarget(c.name)}>
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CategoryModal
        open={modalCat !== undefined}
        category={modalCat ?? null}
        onClose={() => setModalCat(undefined)}
        onSave={() => {
          showToast('تم حفظ التصنيف');
          setModalCat(undefined);
        }}
      />
      <ConfirmModal
        open={confirmTarget !== null}
        text={`لا يمكن حذف تصنيف '${confirmTarget}' لارتباطه بوثائق موجودة.`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => setConfirmTarget(null)}
      />
    </>
  );
}
