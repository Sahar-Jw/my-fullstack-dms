'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Stamp from '../../components/ui/Stamp';
import { ArrowRightIcon } from '../../components/icons';

const ROLE_CHIPS = [
  { role: 'admin', label: 'Admin' },
  { role: 'manager', label: 'Manager' },
  { role: 'employee', label: 'Employee' },
];

export default function LoginPage() {
  const { login } = useApp();
  const router = useRouter();
  const [loginRole, setLoginRole] = useState('admin');

  function handleLogin(e) {
    e.preventDefault();
    login(loginRole);
    router.push('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6f3ec] px-4 py-10">
      <div className="w-full max-w-md rounded-[24px] border border-[#e3ddc9] bg-white/80 p-6 shadow-[0_20px_60px_rgba(28,43,57,0.12)] sm:p-8">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <Stamp size="md">MD</Stamp>
            </div>
            <h1 className="text-3xl">Login</h1>
            <p className="mt-2 text-sm text-[#5b6b75]">Welcome please login to your account</p>
          </div>
          <div className="mb-4">
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" placeholder="name@organization.com" />
          </div>
          <div className="mb-4">
            <label htmlFor="loginPass">Password</label>
            <input id="loginPass" type="password" placeholder="••••••••" />
          </div>

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-[#a63d2f] px-4 py-3 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]"
            type="submit"
          >
            Login
            <ArrowRightIcon />
          </button>
        </form>
      </div>
    </div>
  );
}
