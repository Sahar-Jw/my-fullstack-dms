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
  const [modalUser, setModalUser] = useState(AppUser | null | undefined)(undefined);
  const [confirmTarget, setConfirmTarget] = useState(string | null)(null);

  const filtered = USERS.filter(
    (u) => u.name.includes(query) || u.email.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <input placeholder="ابحث عن مستخدم بالاسم أو البريد…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <SearchIcon />
        </div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={() => setModalUser(null)}>
          <PlusIcon />
          إضافة مستخدم
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد الإلكتروني</th>
              <th>القسم</th>
              <th>الدور</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td className="mono">{u.email}</td>
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
                  <div className="row-actions">
                    <button className="icon-btn" title="تعديل" onClick={() => setModalUser(u)}>
                      <EditIcon />
                    </button>
                    <button className="icon-btn danger" title="حذف" onClick={() => setConfirmTarget(u.name)}>
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
          showToast('تم حفظ بيانات المستخدم');
          setModalUser(undefined);
        }}
      />
      <ConfirmModal
        open={confirmTarget !== null}
        text={`هل تريد حذف المستخدم '${confirmTarget}'؟`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={() => {
          showToast('تم الحذف بنجاح');
          setConfirmTarget(null);
        }}
      />
    </>
  );
}
