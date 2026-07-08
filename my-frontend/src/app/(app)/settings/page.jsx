'use client';

import { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function SettingsPage() {
  const { roleInfo, showToast } = useApp();
  const [curPassErr, setCurPassErr] = useState(false);

  function handleChangePassword(e) {
    e.preventDefault();
    setCurPassErr(false);
    showToast('Password updated successfully');
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
          <h2 className="text-[17px]">Change password</h2>
        </div>
        <form className="p-5" onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label>Current password</label>
            <input type="password" placeholder="••••••••" />
            {curPassErr && <p className="mt-1.5 text-xs text-[#a63d2f]">Current password is incorrect.</p>}
          </div>
          <div className="mb-4">
            <label>New password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <div className="mb-4">
            <label>Confirm new password</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]"
            type="submit"
          >
            Save password
          </button>
        </form>
      </div>

      <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
          <h2 className="text-[17px]">Account details</h2>
        </div>
        <div className="p-5">
          <div className="mt-1 grid gap-3 sm:grid-cols-1">
            <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Full name</div>
              <div className="mt-1 text-sm font-semibold text-[#1c2b39]">{roleInfo.name}</div>
            </div>
            <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Email</div>
              <div className="mt-1 text-sm font-semibold text-[#1c2b39] font-mono">{roleInfo.email}</div>
            </div>
            <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Role</div>
              <div className="mt-1 text-sm font-semibold text-[#1c2b39]">{roleInfo.label}</div>
            </div>
            <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Department</div>
              <div className="mt-1 text-sm font-semibold text-[#1c2b39]">{roleInfo.dept}</div>
            </div>
          </div>
          <p className="mt-4 text-xs text-[#5b6b75]">To change these details, contact the system administrator (Admin).</p>
        </div>
      </div>
    </div>
  );
}
