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
    showToast('تم الحذف بنجاح');
    setConfirmTarget(null);
  }

  return (
    <>
      <div className="toolbar">
        <div className="search-box">
          <input placeholder="ابحث بعنوان الوثيقة…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <SearchIcon />
        </div>
        <select className="filter-select" value={filterCat} onChange={(e) => setFilterCat(e.target.value)}>
          <option value="">كل التصنيفات</option>
          {CAT_NAMES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select className="filter-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
          <option value="">كل الأقسام</option>
          {DEPT_NAMES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <div className="spacer" />
        <Link className="btn btn-primary" href="/documents/new">
          <PlusIcon />
          إضافة وثيقة
        </Link>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>العنوان</th>
              <th>التصنيف</th>
              <th>القسم</th>
              <th>أنشأها</th>
              <th>تاريخ الرفع</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
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
                <td>{d.by}</td>
                <td className="mono">{d.date}</td>
                <td>
                  <div className="row-actions">
                    <button className="icon-btn" title="عرض" onClick={() => router.push(`/documents/${d.id}`)}>
                      <ViewIcon />
                    </button>
                    <button className="icon-btn" title="تعديل" onClick={() => router.push(`/documents/${d.id}/edit`)}>
                      <EditIcon />
                    </button>
                    {role === 'admin' && (
                      <button className="icon-btn danger" title="حذف" onClick={() => setConfirmTarget(d.title)}>
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
          <div className="empty">
            <Stamp>؟</Stamp>
            <h3>لا توجد نتائج</h3>
            <p>لم يتم العثور على وثائق مطابقة لمعايير البحث الحالية. جرّب تعديل الفلاتر.</p>
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirmTarget !== null}
        text={`هل تريد حذف '${confirmTarget}'؟ سيتم حذف مرفقاتها أيضاً.`}
        onClose={() => setConfirmTarget(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
