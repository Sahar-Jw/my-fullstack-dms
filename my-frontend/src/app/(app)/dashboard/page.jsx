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
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="mb-3 flex items-center justify-between">
              <Stamp size="sm">D</Stamp>
            </div>
          <div className="text-3xl font-semibold text-[#1c2b39] font-mono">{total}</div>
            <div className="text-sm text-[#5b6b75]">Total documents</div>
        </div>
        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <Stamp size="sm" color="olive">
              +
            </Stamp>
          </div>
          <div className="text-3xl font-semibold text-[#1c2b39] font-mono">{newThisWeek}</div>
          <div className="text-sm text-[#5b6b75]">Documents added this week</div>
        </div>
        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="mb-3 flex items-center justify-between">
            <Stamp size="sm" color="ink">
              C
            </Stamp>
          </div>
          <div className="text-3xl font-semibold text-[#1c2b39] font-mono">{usedCats}</div>
          <div className="text-sm text-[#5b6b75]">Used categories</div>
        </div>
        {role === 'admin' && (
          <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
              <div className="mb-3 flex items-center justify-between">
              <Stamp size="sm" color="gold">
                U
              </Stamp>
            </div>
            <div className="text-3xl font-semibold text-[#1c2b39] font-mono">{USERS.length}</div>
            <div className="text-sm text-[#5b6b75]">
              Total users <span className="text-[10px] text-[#b08b2e]">Admin only</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
            <h2>Latest documents</h2>
            <Link className="rounded-lg bg-transparent p-2 text-sm text-[#5b6b75] transition hover:text-[#1c2b39]" href="/documents">
              View all ←
            </Link>
          </div>
          <div className="p-0">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Department</th>
                  <th>Uploaded</th>
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
                    <td className="font-mono">{d.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
            <h2>Distribution by category</h2>
          </div>
          <div className="flex flex-col gap-3.5 p-5">
            {Object.entries(byCat).map(([c, n]) => {
              const pct = Math.round((n / total) * 100);
              return (
                <div key={c}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span>{c}</span>
                    <span className="font-mono text-[#5b6b75]">
                      {n} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-[#ede8db]">
                    <div className="h-full" style={{ width: `${pct}%`, background: CAT_COLORS[c] }} />
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
