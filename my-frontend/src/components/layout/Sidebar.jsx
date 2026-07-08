'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CategoriesIcon,
  DashboardIcon,  CloseIcon,  DepartmentsIcon,
  DocumentsIcon,
  LogoutIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from '../../components/icons';
import Stamp from '../ui/Stamp';
import { useApp } from '../../context/AppContext';

const NAV_GENERAL = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/documents', label: 'Documents', icon: DocumentsIcon },
  { href: '/search', label: 'Search', icon: SearchIcon },
];

const NAV_ADMIN = [
  { href: '/users', label: 'Users', icon: UsersIcon },
  { href: '/departments', label: 'Departments', icon: DepartmentsIcon },
  { href: '/categories', label: 'Categories', icon: CategoriesIcon },
];

export default function Sidebar({ open = false, onClose }) {
  const pathname = usePathname();
  const { role, roleInfo, logout } = useApp();

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <div className={`fixed inset-y-0 left-0 z-50 w-full max-w-[18rem] overflow-y-auto bg-[#1c2b39] px-4 py-5 text-[#f6f3ec] transition duration-300 ease-out lg:static lg:inset-auto lg:w-64 lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <Stamp size="sm">MD</Stamp>
            <div className="text-[15px] font-semibold">MyDocs</div>
          </div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#ffffff33] bg-[#ffffff0d] text-[#f6f3ec] transition hover:bg-[#ffffff22] lg:hidden"
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

      <div className="space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea0ab]">General</div>
        {NAV_GENERAL.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => onClose && onClose()}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(href) ? 'bg-[#a63d2f] text-[#fffdf8]' : 'text-[#dfe6eb] hover:bg-white/10 hover:text-white'}`}
          >
            <Icon />
            {label}
          </Link>
        ))}
      </div>

      {role === 'admin' && (
        <div className="space-y-1.5">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea0ab]">Admin</div>
          {NAV_ADMIN.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => onClose && onClose()}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive(href) ? 'bg-[#a63d2f] text-[#fffdf8]' : 'text-[#dfe6eb] hover:bg-white/10 hover:text-white'}`}
            >
              <Icon />
              {label}
            </Link>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8ea0ab]">Account</div>
        <Link
          href="/settings"
          onClick={() => onClose && onClose()}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive('/settings') ? 'bg-[#a63d2f] text-[#fffdf8]' : 'text-[#dfe6eb] hover:bg-white/10 hover:text-white'}`}
        >
          <SettingsIcon />
          Settings
        </Link>
        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#dfe6eb] transition hover:bg-white/10 hover:text-white"
          onClick={() => {
            onClose && onClose();
            logout();
          }}
        >
          <LogoutIcon />
          Log out
        </button>
        
      </div>

      <div className="mt-auto pt-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-sm text-[#f6f3ec]">
          <span className="h-2.5 w-2.5 rounded-full bg-current" /> {roleInfo.label}
        </span>
      </div>
    </div>
    {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
  </>
);
}
