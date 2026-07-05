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
    <div id="page-login">

      <div className="login-form-wrap">
        <form className="login-card" onSubmit={handleLogin}>
          <div className='text-center flex'>
          <h1>Login </h1>
          <p className="sub">Welcome please login to your account</p>
          </div>
          <div className="field">
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" placeholder="name@organization.com"/>
          </div>
          <div className="field">
            <label htmlFor="loginPass">Password</label>
            <input id="loginPass" type="password" placeholder="••••••••" />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} type="submit">
            Login
            <ArrowRightIcon />
          </button>
          
        </form>
      </div>
    </div>
  );
}
