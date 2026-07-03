'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../context/AppContext';
import Stamp from '../../../components/ui/Stamp';
import { DeptBadge,CatBadge } from '../../../components/ui/Badge';
import { CATS ,DOCS, USERS} from '../../../lib/mockData';

const CAT_COLORS = {
  HR: 'var(--seal)',
  Finance: 'var(--gold)',
  Contracts: 'var(--olive)',
  Reports: 'var(--ink-soft)',
};

export default function DashboardPage() {
  const { role } = useApp();
  const router = useRouter();

  const recentDocs = DOCS.slice(0, 5);
  const total = DOCS.length;
  const byCat = {};
  DOCS.forEach((d) => (byCat[d.cat] = (byCat[d.cat] || 0) + 1));

  const newThisWeek = 7; // static, matches prototype
  const usedCats = CATS.length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="top-row">
            <Stamp size="sm">و</Stamp>
          </div>
          <div className="num mono">{total}</div>
          <div className="lbl">إجمالي الوثائق</div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <Stamp size="sm" color="olive">
              +
            </Stamp>
          </div>
          <div className="num mono">{newThisWeek}</div>
          <div className="lbl">وثائق أُضيفت هذا الأسبوع</div>
        </div>
        <div className="stat-card">
          <div className="top-row">
            <Stamp size="sm" color="ink">
              س
            </Stamp>
          </div>
          <div className="num mono">{usedCats}</div>
          <div className="lbl">تصنيفات مستخدَمة</div>
        </div>
        {role === 'admin' && (
          <div className="stat-card admin-only">
            <div className="top-row">
              <Stamp size="sm" color="gold">
                م
              </Stamp>
            </div>
            <div className="num mono">{USERS.length}</div>
            <div className="lbl">
              إجمالي المستخدمين <span style={{ fontSize: 10, color: 'var(--gold)' }}>Admin فقط</span>
            </div>
          </div>
        )}
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-head">
            <h2>آخر الوثائق المضافة</h2>
            <Link className="btn btn-text btn-sm" href="/documents">
              عرض الكل ←
            </Link>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>العنوان</th>
                  <th>التصنيف</th>
                  <th>القسم</th>
                  <th>تاريخ الرفع</th>
                </tr>
              </thead>
              <tbody>
                {recentDocs.map((d) => (
                  <tr key={d.id} onClick={() => router.push(`/documents/${d.id}`)} style={{ cursor: 'pointer' }}>
                    <td>{d.title}</td>
                    <td>
                      <CatBadge>{d.cat}</CatBadge>
                    </td>
                    <td>
                      <DeptBadge>{d.dept}</DeptBadge>
                    </td>
                    <td className="mono">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2>التوزيع حسب التصنيف</h2>
          </div>
          <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {Object.entries(byCat).map(([c, n]) => {
              const pct = Math.round((n / total) * 100);
              return (
                <div key={c}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                    <span>{c}</span>
                    <span className="mono" style={{ color: 'var(--ink-soft)' }}>
                      {n} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 4, background: 'var(--paper-2)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: CAT_COLORS[c] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
