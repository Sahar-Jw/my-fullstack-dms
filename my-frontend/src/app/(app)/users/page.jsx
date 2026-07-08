'use client';

import { useState } from 'react';
import { useApp } from '../../../context/AppContext';
import { DeptBadge, RoleBadge, StatusBadge } from '../../../components/ui/Badge';
import UserModal from '../../../components/modals/UserModal';
import { EditIcon, PlusIcon, SearchIcon, TrashIcon } from '../../../components/icons';
import { USERS } from '../../../lib/mockData';
import ConfirmModal from '../../../components/modals/ConfirmModal';

export default function UsersPage() {
  const { showToast } = useApp();
  const [users] = useState(USERS);
  const [query, setQuery] = useState('');
  const [modalUser, setModalUser] = useState(undefined);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const filtered = users.filter(
    (u) => u.name.includes(query) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-[#e3ddc9] bg-white/70 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            className="pr-10"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6b75]" />
        </div>
        <div className="hidden flex-1 md:block" />
        <button
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]"
          onClick={() => setModalUser(null)}
        >
          <PlusIcon />
          Add user
        </button>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td className="font-mono">{u.email}</td>
                <td>
                  <DeptBadge>{u.dept}</DeptBadge>
                </td>
                <td>
                  <RoleBadge role={u.role} />
                </td>
                <td>
                  <StatusBadge active={u.active} />
                </td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]"
                      title="Edit"
                      onClick={() => setModalUser(u)}
                    >
                      <EditIcon />
                    </button>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7c4ba] bg-[#fffdf8] text-[#a63d2f] transition hover:bg-[#fbede9]"
                      title="Delete"
                      onClick={() => setConfirmTarget(u.name)}
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

      <UserModal
        open={modalUser !== undefined}
        user={modalUser ?? null}
        onClose={() => setModalUser(undefined)}
        onSave={() => {
          showToast('User saved');
          setModalUser(undefined);
        }}
      />
      <ConfirmModal
        open={confirmTarget !== null}
        text={`Delete user '${confirmTarget}'?`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          showToast('Deleted successfully');
          setConfirmTarget(null);
        }}
      />
    </>
  );
}
