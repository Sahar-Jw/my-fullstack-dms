'use client';

import { useState } from 'react';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { EditIcon, PlusIcon, TrashIcon } from '../../../components/icons';
import { useApp } from '../../../context/AppContext';
import DepartmentModal from '../../../components/modals/DepartmentModal';
import { DEPTS } from '../../../lib/mockData';

export default function DepartmentsPage() {
  const { showToast } = useApp();
  const [modalDept, setModalDept] = useState(undefined);
  const [confirmTarget, setConfirmTarget] = useState(null);

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-[#e3ddc9] bg-white/70 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)] md:flex-row md:items-center">
        <h2 className="text-[17px]">Departments</h2>
        <div className="hidden flex-1 md:block" />
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]"
          onClick={() => setModalDept(null)}
        >
          <PlusIcon />
          Add department
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th>Department name</th>
              <th>Description</th>
              <th>Users count</th>
              <th>Documents count</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {DEPTS.map((d) => (
              <tr key={d.id}>
                <td style={{ fontWeight: 600 }}>{d.name}</td>
                <td style={{ color: 'var(--ink-soft)' }}>{d.desc}</td>
                <td className="font-mono">{d.users}</td>
                <td className="font-mono">{d.docs}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]"
                      title="Edit"
                      onClick={() => setModalDept(d)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7c4ba] bg-[#fffdf8] text-[#a63d2f] transition hover:bg-[#fbede9]"
                      title="Delete"
                      onClick={() => setConfirmTarget(d.name)}
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

      <DepartmentModal
        open={modalDept !== undefined}
        department={modalDept ?? null}
        onClose={() => setModalDept(undefined)}
        onSave={() => {
          showToast('Department saved');
          setModalDept(undefined);
        }}
      />
      <ConfirmModal
        open={confirmTarget !== null}
        text={`Cannot delete department '${confirmTarget}' because users or documents are linked to it.`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => setConfirmTarget(null)}
      />
    </>
  );
}
