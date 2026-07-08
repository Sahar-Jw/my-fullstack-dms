'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import { UploadIcon } from '../icons';
import Stamp from '../ui/Stamp';
import { CAT_NAMES , DEPT_NAMES} from '../../lib/mockData';

export default function DocumentForm({ document }) {
  const router = useRouter();
  const { showToast } = useApp();

  function handleSubmit(e) {
    e.preventDefault();
    showToast('Document saved successfully');
    router.push('/documents');
  }

  return (
    <div className="mx-auto w-full max-w-3xl rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
      <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
        <h2>{document ? 'Edit document' : 'Add new document'}</h2>
      </div>
      <form className="p-5" onSubmit={handleSubmit}>
        <div className="mb-4">
          <label>Document title *</label>
          <input placeholder="Example: Staff leave policy 2026" defaultValue={document?.title} required />
        </div>
        <div className="mb-4">
          <label>Description</label>
          <textarea rows={4} placeholder="Short summary of the document contents" defaultValue={document?.desc} />
        </div>
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label>Category *</label>
            <select defaultValue={document?.cat ?? CAT_NAMES[0]}>
              {CAT_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Department *</label>
            <select defaultValue={document?.dept ?? DEPT_NAMES[0]}>
              {DEPT_NAMES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label>Document date</label>
          <input type="date" defaultValue={document?.docDate ?? '2026-07-03'} className="max-w-[220px]" />
        </div>
        <div className="mb-4">
          <label>Main file *</label>
          <div className="rounded-2xl border border-dashed border-[#d8d0be] bg-[#f6f3ec]/70 p-6 text-center">
            <Stamp size="sm" className="mx-auto mb-2.5">
              <UploadIcon className="h-[14px] w-[14px]" />
            </Stamp>
            <b>Drag the file here or click to choose</b>
            <p className="mt-1">PDF, Word, or Excel — up to 20 MB</p>
          </div>
          <p className="mt-1.5 text-xs text-[#5b6b75]">
            If the file type or size is not allowed, the system will show an error on upload.
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]" type="submit">
            Save document
          </button>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#d8d0be] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#1c2b39] transition duration-150 hover:bg-[#ede8db]" type="button" onClick={() => router.push('/documents')}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
