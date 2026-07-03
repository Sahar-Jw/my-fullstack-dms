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
      <div className="login-visual">
        <div className="brand-row">
          <Stamp>نظ</Stamp>
          <div className="brand-name">
            نُسخة
            <small>نظام إدارة الوثائق</small>
          </div>
        </div>
        <div className="login-quote">
          <h2 className="display">أرشيف واحد لكل وثيقة رسمية، بصلاحية واضحة لكل موظف.</h2>
          <p>
            حفظ، تصنيف، وتنزيل الوثائق الرسمية للمؤسسة من مكان واحد، مع تحكّم دقيق بالصلاحيات حسب الدور والقسم.
          </p>
        </div>
        <div className="login-meta">
          <div>
            <b>3</b>أدوار صلاحية
          </div>
          <div>
            <b>36</b>متطلب وظيفي
          </div>
          <div>
            <b>IEEE 830</b>معيار التوثيق
          </div>
        </div>
      </div>

      <div className="login-form-wrap">
        <form className="login-card" onSubmit={handleLogin}>
          <h1>تسجيل الدخول</h1>
          <p className="sub">أدخل بيانات حسابك للوصول إلى النظام</p>

          <div className="field">
            <label htmlFor="loginEmail">البريد الإلكتروني</label>
            <input id="loginEmail" type="email" placeholder="name@organization.com" defaultValue="admin@nuskha.org" />
          </div>
          <div className="field">
            <label htmlFor="loginPass">كلمة المرور</label>
            <input id="loginPass" type="password" placeholder="••••••••" defaultValue="••••••••" />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} type="submit">
            تسجيل الدخول
            <ArrowRightIcon />
          </button>

          <div className="login-foot">
            <a href="#" onClick={(e) => e.preventDefault()}>
              نسيت كلمة المرور؟
            </a>
            <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>لا يوجد تسجيل ذاتي — الحسابات عبر المدير فقط</span>
          </div>

          <div className="role-picker">
            <p>معاينة سريعة بدور مختلف (للعرض التجريبي فقط):</p>
            <div className="role-chip-row">
              {ROLE_CHIPS.map(({ role, label }) => (
                <div
                  key={role}
                  className={`role-chip${loginRole === role ? ' active' : ''}`}
                  onClick={() => setLoginRole(role)}
                >
                  {label}
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
