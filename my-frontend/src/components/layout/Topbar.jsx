'use client';

import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Stamp from '../ui/Stamp';

const PAGE_TITLES = {
  '/dashboard': ['لوحة التحكم', 'الرئيسية'],
  '/documents': ['الوثائق', 'الرئيسية / الوثائق'],
  '/documents/new': ['إضافة وثيقة', 'الرئيسية / الوثائق / نموذج'],
  '/search': ['البحث', 'الرئيسية / البحث'],
  '/users': ['إدارة المستخدمين', 'الرئيسية / إدارة النظام / المستخدمون'],
  '/departments': ['إدارة الأقسام', 'الرئيسية / إدارة النظام / الأقسام'],
  '/categories': ['إدارة التصنيفات', 'الرئيسية / إدارة النظام / التصنيفات'],
  '/settings': ['الإعدادات', 'الرئيسية / الإعدادات'],
};

function titleFor(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (/^\/documents\/[^/]+\/edit$/.test(pathname)) return ['تعديل الوثيقة', 'الرئيسية / الوثائق / نموذج'];
  if (/^\/documents\/[^/]+$/.test(pathname)) return ['تفاصيل الوثيقة', 'الرئيسية / الوثائق / تفاصيل'];
  return ['نُسخة', 'الرئيسية'];
}

export default function Topbar() {
  const pathname = usePathname();
  const { role, roleInfo, setRole } = useApp();
  const [title, path] = titleFor(pathname);

  return (
    <div className="topbar">
      <div>
        <h1>{title}</h1>
        <div className="path">{path}</div>
      </div>
      <div className="topbar-right">
        <select
          className="role-switch"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          title="تبديل الدور (للعرض التجريبي)"
        >
          <option value="admin">عرض كـ Admin</option>
          <option value="manager">عرض كـ Manager</option>
          <option value="employee">عرض كـ Employee</option>
        </select>
        <div className="user-pill">
          <Stamp size="sm" color="gold">
            {roleInfo.initials}
          </Stamp>
          <div className="who">
            <b>{roleInfo.name}</b>
            <span>
              {roleInfo.label} · {roleInfo.dept}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
