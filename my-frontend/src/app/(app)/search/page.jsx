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
      <div className="mb-5 rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <div className="p-5">
          <h2 className="mb-4">Advanced document search</h2>
          <form onSubmit={runSearch}>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label>Document title</label>
                <input placeholder="Keyword in title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <label>Category</label>
                <select value={cat} onChange={(e) => setCat(e.target.value)}>
                  <option value="">Any category</option>
                  {CAT_NAMES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <div>
                <label>Department</label>
                <select value={dept} onChange={(e) => setDept(e.target.value)}>
                  <option value="">Any department</option>
                  {DEPT_NAMES.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>&nbsp;</label>
                <button className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]" type="submit">
                  <SearchIcon />
                  Search
                </button>
              </div>
            </div>
          </form>
          <p className="mt-1.5 text-xs text-[#5b6b75]">Results are constrained automatically by your current role permissions (FR-33).</p>
        </div>
      </div>

      <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
          <h2>Results</h2>
          <span className="text-xs text-[#5b6b75] font-mono">{results ? `${results.length} results` : '—'}</span>
        </div>
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Department</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((d) => (
              <tr key={d.id}>
                <td className="cursor-pointer font-semibold" onClick={() => router.push(`/documents/${d.id}`)}>
                  {d.title}
                </td>
                <td>
                  <CatBadge>{d.cat}</CatBadge>
                </td>
                <td>
                  <DeptBadge>{d.dept}</DeptBadge>
                </td>
                <td className="font-mono">{d.date}</td>
                <td>
                  <button className="rounded-lg bg-transparent p-2 text-sm text-[#5b6b75] transition hover:text-[#1c2b39]" onClick={() => router.push(`/documents/${d.id}`)}>
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#d8d0be] bg-[#fffdf8]/70 p-8 text-center">
            <Stamp>?</Stamp>
            <h3>No results</h3>
            <p>Adjust search terms or filters and try again.</p>
          </div>
        )}
      </div>
    </>
  );
}
