'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CAT_NAMES, DEPT_NAMES, DOCS } from '../../../lib/mockData';
import { SearchIcon } from '../../../components/icons';
import Stamp from '../../../components/ui/Stamp';
import { DeptBadge,CatBadge } from '../../../components/ui/Badge';

export default function SearchPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [cat, setCat] = useState('');
  const [dept, setDept] = useState('');
  const [results, setResults] = useState(null);

  function runSearch(e) {
    e?.preventDefault();
    setResults(DOCS.filter((d) => d.title.includes(title) && (!cat || d.cat === cat) && (!dept || d.dept === dept)));
  }

  const shown = results ?? DOCS;

  return (
    <>
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-body">
          <h2 style={{ marginBottom: 16 }}>بحث متقدم عن الوثائق</h2>
          <form onSubmit={runSearch}>
            <div className="field-row">
              <div className="field">
                <label>عنوان الوثيقة</label>
                <input placeholder="كلمة مفتاحية في العنوان" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="field">
                <label>التصنيف</label>
                <select value={cat} onChange={(e) => setCat(e.target.value)}>
                  <option value="">أي تصنيف</option>
                  {CAT_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>القسم</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)}>
                  <option value="">أي قسم</option>
                  {DEPT_NAMES.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>&nbsp;</label>
                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">
                  <SearchIcon />
                  بحث
                </button>
              </div>
            </div>
          </form>
          <p className="hint">تُقيَّد نتائج البحث تلقائياً وفق صلاحيات دورك الحالي (FR-33).</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2>النتائج</h2>
          <span className="hint mono">{results ? `${results.length} نتيجة` : '—'}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>العنوان</th>
              <th>التصنيف</th>
              <th>القسم</th>
              <th>تاريخ الرفع</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id}>
                <td onClick={() => router.push(`/documents/${d.id}`)} style={{ cursor: 'pointer', fontWeight: 600 }}>
                  {d.title}
                </td>
                <td>
                  <CatBadge>{d.cat}</CatBadge>
                </td>
                <td>
                  <DeptBadge>{d.dept}</DeptBadge>
                </td>
                <td className="mono">{d.date}</td>
                <td>
                  <button className="btn btn-text btn-sm" onClick={() => router.push(`/documents/${d.id}`)}>
                    فتح
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && (
          <div className="empty">
            <Stamp>؟</Stamp>
            <h3>لا توجد نتائج</h3>
            <p>عدّل كلمات البحث أو الفلاتر وحاول مجدداً.</p>
          </div>
        )}
      </div>
    </>
  );
}
