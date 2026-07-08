'use client';

import { usePathname } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { MenuIcon } from '../../components/icons';
import Stamp from '../ui/Stamp';

const PAGE_TITLES = {
  '/dashboard': ['Dashboard', 'Home'],
  '/documents': ['Documents', 'Home / Documents'],
  '/documents/new': ['Add Document', 'Home / Documents / New'],
  '/search': ['Search', 'Home / Search'],
  '/users': ['User Management', 'Home / Admin / Users'],
  '/departments': ['Departments', 'Home / Admin / Departments'],
  '/categories': ['Categories', 'Home / Admin / Categories'],
  '/settings': ['Settings', 'Home / Settings'],
};

function titleFor(pathname) {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  if (/^\/documents\/[^/]+\/edit$/.test(pathname)) return ['Edit document', 'Home / Documents / Edit'];
  if (/^\/documents\/[^/]+$/.test(pathname)) return ['Document details', 'Home / Documents / Details'];
  return ['MyDocs', 'Home'];
}

export default function Topbar({ onMenuClick }) {
  const pathname = usePathname();
  const { role, roleInfo, setRole } = useApp();
  const [title, path] = titleFor(pathname);

  return (
    <div className="flex flex-col gap-4 border-b border-[#e3ddc9] bg-white/80 px-4 py-4 backdrop-blur sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#d8d0be] bg-white text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f] lg:hidden"
          onClick={onMenuClick}
        >
          <MenuIcon />
        </button>

        <div>
          <h1 className="text-2xl sm:text-[1.7rem]">{title}</h1>
          <div className="mt-1 text-sm text-[#5b6b75]">{path}</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          className="min-w-40 rounded-xl border border-[#d8d0be] bg-[#fffdf8] px-3 py-2 text-sm text-[#1c2b39]"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          title="Switch role (preview)"
        >
          <option value="admin">View as Admin</option>
          <option value="manager">View as Manager</option>
          <option value="employee">View as Employee</option>
        </select>

        <div className="flex items-center gap-3 rounded-2xl border border-[#e3ddc9] bg-[#f6f3ec] px-3 py-2">
          <Stamp size="sm" color="gold">
            {roleInfo.initials}
          </Stamp>
          <div>
            <div className="font-semibold text-[#1c2b39]">{roleInfo.name}</div>
            <div className="block text-xs text-[#5b6b75]">
              {roleInfo.label} · {roleInfo.dept}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
