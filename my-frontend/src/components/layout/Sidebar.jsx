'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CategoriesIcon,
  DashboardIcon,
  DepartmentsIcon,
  DocumentsIcon,
  LogoutIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from '../../components/icons';
import Stamp from '../ui/Stamp';
import { useApp } from '../../context/AppContext';

const NAV_GENERAL = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: DashboardIcon },
  { href: '/documents', label: 'الوثائق', icon: DocumentsIcon },
  { href: '/search', label: 'البحث', icon: SearchIcon },
];

const NAV_ADMIN = [
  { href: '/users', label: 'المستخدمون', icon: UsersIcon },
  { href: '/departments', label: 'الأقسام', icon: DepartmentsIcon },
  { href: '/categories', label: 'التصنيفات', icon: CategoriesIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { role, roleInfo, logout } = useApp();

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="sidebar">
      <div className="brand-row" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Stamp size="sm">نظ</Stamp>
        <div className="brand-name" style={{ fontSize: 15 }}>
          نُسخة
        </div>
      </div>

      <div className="nav-group">
        <div className="nav-label">عام</div>
        {NAV_GENERAL.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item${isActive(href) ? ' active' : ''}`}>
            <Icon />
            {label}
          </Link>
        ))}
      </div>

      {role === 'admin' && (
        <div className="nav-group">
          <div className="nav-label">إدارة النظام</div>
          {NAV_ADMIN.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={`nav-item${isActive(href) ? ' active' : ''}`}>
              <Icon />
              {label}
            </Link>
          ))}
        </div>
      )}

      <div className="nav-group">
        <div className="nav-label">الحساب</div>
        <Link href="/settings" className={`nav-item${isActive('/settings') ? ' active' : ''}`}>
          <SettingsIcon />
          الإعدادات
        </Link>
        <div className="nav-item" onClick={logout}>
          <LogoutIcon />
          تسجيل الخروج
        </div>
      </div>

      <div className="sidebar-foot">
        <span className="role-badge">
          <span className="dot" /> {roleInfo.label}
        </span>
      </div>
    </aside>
  );
}
