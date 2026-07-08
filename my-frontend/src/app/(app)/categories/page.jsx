'use client';

import { useState } from 'react';
import CategoryModal from '../../../components/modals/CategoryModal';
import { EditIcon, PlusIcon, TrashIcon } from '../../../components/icons';
import { useApp } from '../../../context/AppContext';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { CATS } from '../../../lib/mockData';

export default function CategoriesPage() {
  const { showToast } = useApp();
  const [modalCat, setModalCat] = useState(undefined);
  const [confirmTarget, setConfirmTarget] = useState(null);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-[#e3ddc9] bg-white/70 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)] md:flex-row md:items-center">
        <h2 className="text-[17px]">Document Categories</h2>
        <div className="hidden flex-1 md:block" />
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]"
          onClick={() => setModalCat(null)}
        >
          <PlusIcon />
          Add category
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th>Category name</th>
              <th>Description</th>
              <th>Document count</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {CATS.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: 'var(--ink-soft)' }}>{c.desc}</td>
                <td className="font-mono">{c.docs}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]"
                      title="Edit"
                      onClick={() => setModalCat(c)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7c4ba] bg-[#fffdf8] text-[#a63d2f] transition hover:bg-[#fbede9]"
                      title="Delete"
                      onClick={() => setConfirmTarget(c.name)}
                    >
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
          showToast('Category saved');
          setModalCat(undefined);
        }}
      />
      <ConfirmModal
        open={confirmTarget !== null}
        text={`Cannot delete category '${confirmTarget}' because documents are linked to it.`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => setConfirmTarget(null)}
      />
    </>
  );
}
