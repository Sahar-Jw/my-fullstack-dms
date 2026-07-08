'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DeptBadge,CatBadge } from '../../../components/ui/Badge';
import ConfirmModal from '../../../components/modals/ConfirmModal';
import { EditIcon, PlusIcon, SearchIcon, TrashIcon, ViewIcon } from '../../../components/icons';
import { useApp } from '../../../context/AppContext';
import Stamp from '../../../components/ui/Stamp';
import { CAT_NAMES, DEPT_NAMES, DOCS } from '../../../lib/mockData';

export default function DocumentsPage() {
  const { role, showToast } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null);

  const filtered = useMemo(
    () =>
      DOCS.filter(
        (d) => d.title.includes(query) && (!filterCat || d.cat === filterCat) && (!filterDept || d.dept === filterDept)
      ),
    [query, filterCat, filterDept]
  );

  function handleDelete() {
    showToast('Deleted successfully');
    setConfirmTarget(null);
  }

  return (
    <>
      <div className="mb-5 flex flex-col gap-3 rounded-[10px] border border-[#e3ddc9] bg-white/70 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)] md:flex-row md:items-center">
        <div className="relative flex-1">
          <input
            className="pr-10"
            placeholder="Search by title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5b6b75]" />
        </div>
        <select className="min-w-[180px]" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">All categories</option>
          {CAT_NAMES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="min-w-[180px]" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">All departments</option>
          {DEPT_NAMES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <div className="hidden flex-1 md:block" />
        <Link
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]"
          href="/documents/new"
        >
          <PlusIcon />
          Add document
        </Link>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Department</th>
              <th>Created by</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
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
                <td>{d.by}</td>
                <td className="font-mono">{d.date}</td>
                <td>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]"
                      title="View"
                      onClick={() => router.push(`/documents/${d.id}`)}
                    >
                      <ViewIcon />
                    </button>
                    <button
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]"
                      title="Edit"
                      onClick={() => router.push(`/documents/${d.id}/edit`)}
                    >
                      <EditIcon />
                    </button>
                    {role === 'admin' && (
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7c4ba] bg-[#fffdf8] text-[#a63d2f] transition hover:bg-[#fbede9]"
                        title="Delete"
                        onClick={() => setConfirmTarget(d.title)}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-[#d8d0be] bg-[#fffdf8]/70 p-8 text-center">
            <Stamp>?</Stamp>
            <h3>No results</h3>
            <p>No documents match the current filters. Try adjusting them.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmTarget !== null}
        text={`Delete '${confirmTarget}'? Attachments will also be deleted.`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
