'use client';

import { useState } from 'react';
import { useApp } from '../../../context/AppContext';

export default function SettingsPage() {
  const { roleInfo, showToast } = useApp();
  const [curPassErr, setCurPassErr] = useState(false);

  function handleChangePassword(e) {
    e.preventDefault();
    setCurPassErr(false);
    showToast('تم تحديث كلمة المرور بنجاح');
  }

  return (
    <div className="two-col">
      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: 17 }}>تغيير كلمة المرور</h2>
        </div>
        <form className="panel-body" onSubmit={handleChangePassword}>
          <div className="field">
            <label>كلمة المرور الحالية</label>
            <input type="password" placeholder="••••••••" />
            {curPassErr && <p className="error-text">كلمة المرور الحالية غير صحيحة.</p>}
          </div>
          <div className="field">
            <label>كلمة المرور الجديدة</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <div className="field">
            <label>تأكيد كلمة المرور الجديدة</label>
            <input type="password" placeholder="••••••••" />
          </div>
          <button className="btn btn-primary" type="submit">
            حفظ كلمة المرور
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2 style={{ fontSize: 17 }}>بيانات الحساب</h2>
        </div>
        <div className="panel-body">
          <div className="detail-meta-list" style={{ gridTemplateColumns: '1fr' }}>
            <div className="meta-item">
              <div className="k">الاسم الكامل</div>
              <div className="v">{roleInfo.name}</div>
            </div>
            <div className="meta-item">
              <div className="k">البريد الإلكتروني</div>
              <div className="v mono">{roleInfo.email}</div>
            </div>
            <div className="meta-item">
              <div className="k">الدور</div>
              <div className="v">{roleInfo.label}</div>
            </div>
            <div className="meta-item">
              <div className="k">القسم</div>
              <div className="v">{roleInfo.dept}</div>
            </div>
          </div>
          <p className="hint" style={{ marginTop: 16 }}>
            لتعديل هذه البيانات، تواصل مع مدير النظام (Admin).
          </p>
        </div>
      </div>
    </div>
  );
}
