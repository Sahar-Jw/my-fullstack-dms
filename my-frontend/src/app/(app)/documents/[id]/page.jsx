'use client';

import { useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { CatBadge, DeptBadge } from '../../../../components/ui/Badge';
import ConfirmModal from '../../../../components/modals/ConfirmModal';
import AttachmentModal from '../../../../components/modals/AttachmentModal';
import { BackIcon, DocumentsIcon, DownloadIcon, EditIcon, TrashIcon } from '../../../../components/icons';
import { useApp } from '../../../../context/AppContext';
import { DOCS } from '../../../../lib/mockData';

export default function DocumentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useApp();
  const doc = DOCS.find((d) => d.id === params.id);

  const [confirmText, setConfirmText] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);

  if (!doc) return notFound();

  function openConfirm(text, action) {
    setConfirmText(text);
    setConfirmAction(() => action);
  }

  function closeConfirm() {
    setConfirmText(null);
    setConfirmAction(null);
  }

  function handleConfirm() {
    confirmAction?.();
    closeConfirm();
  }

  return (
    <>
      <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#a63d2f]" onClick={() => router.push('/documents')}>
            <BackIcon />
            Back to documents list
          </button>
      <div className="mb-5 flex flex-col gap-4 rounded-[10px] border border-[#e3ddc9] bg-white/80 p-4 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)] md:flex-row md:items-start md:justify-between">
        <div>
          <h1>{doc.title}</h1>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <CatBadge>{doc.cat}</CatBadge>
            <DeptBadge>{doc.dept}</DeptBadge>
          </div>
        </div>
          <div className="flex flex-wrap gap-2.5">
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#d8d0be] bg-transparent px-4 py-2.5 text-sm font-semibold text-[#1c2b39] transition duration-150 hover:bg-[#ede8db]" onClick={() => router.push(`/documents/${doc.id}/edit`)}>
            <EditIcon />
            Edit
          </button>
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent bg-[#a63d2f] px-4 py-2.5 text-sm font-semibold text-[#fffdf8] transition duration-150 hover:bg-[#8a2f22]">
            <DownloadIcon />
            Download main file
          </button>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7c4ba] bg-[#fffdf8] text-[#a63d2f] transition hover:bg-[#fbede9]"
            onClick={() =>
              openConfirm('Do you want to delete this document? All attachments will be permanently removed.', () => {
                showToast('Deleted successfully');
                router.push('/documents');
              })
            }
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="p-5">
            <p className="text-sm leading-8 text-[#5b6b75]">{doc.desc}</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Created by</div>
                <div className="mt-1 text-sm font-semibold text-[#1c2b39]">{doc.by}</div>
              </div>
              <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Document date</div>
                <div className="mt-1 text-sm font-semibold text-[#1c2b39] font-mono">{doc.docDate}</div>
              </div>
              <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Uploaded</div>
                <div className="mt-1 text-sm font-semibold text-[#1c2b39] font-mono">{doc.uploadedAt}</div>
              </div>
              <div className="rounded-xl border border-[#ede8db] bg-[#f6f3ec]/80 p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b6b75]">Last updated</div>
                <div className="mt-1 text-sm font-semibold text-[#1c2b39] font-mono">{doc.updatedAt}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#e3ddc9] bg-white/80 shadow-[0_1px_2px_rgba(28,43,57,0.06),0_6px_20px_rgba(28,43,57,0.06)]">
          <div className="flex items-center justify-between gap-3 border-b border-[#ede8db] px-5 py-4">
            <h2 className="text-[16px]">Attachments ({doc.files.length})</h2>
            <button className="rounded-lg bg-transparent p-2 text-sm text-[#5b6b75] transition hover:text-[#1c2b39]" onClick={() => setAttachOpen(true)}>
              + Add attachment
            </button>
          </div>
          <div className="p-5">
            {doc.files.map((f) => (
              <div className="flex flex-col gap-3 rounded-xl border border-[#ede8db] bg-[#f6f3ec]/70 p-3 sm:flex-row sm:items-center" key={f.id}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fffdf8] text-[#a63d2f]">
                  <DocumentsIcon />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#1c2b39]">{f.name}</div>
                  <div className="mt-1 text-sm text-[#5b6b75]">
                    {f.size} · uploaded by {f.uploadedBy}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#d8d0be] bg-[#fffdf8] text-[#1c2b39] transition hover:border-[#a63d2f] hover:text-[#a63d2f]" title="Download">
                    <DownloadIcon />
                  </button>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#e7c4ba] bg-[#fffdf8] text-[#a63d2f] transition hover:bg-[#fbede9]"
                    title="Delete"
                    onClick={() => openConfirm('Delete this attachment permanently?', () => showToast('Deleted successfully'))}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmModal open={confirmText !== null} text={confirmText ?? ''} onClose={closeConfirm} onConfirm={handleConfirm} />
      <AttachmentModal
        open={attachOpen}
        onClose={() => setAttachOpen(false)}
        onUpload={() => {
          showToast('Attachment uploaded successfully');
          setAttachOpen(false);
        }}
      />
    </>
  );
}
