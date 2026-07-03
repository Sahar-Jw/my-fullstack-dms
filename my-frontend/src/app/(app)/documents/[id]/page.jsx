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
      <button className="back-link" onClick={() => router.push('/documents')}>
        <BackIcon />
        العودة إلى قائمة الوثائق
      </button>

      <div className="detail-head">
        <div>
          <h1>{doc.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <CatBadge>{doc.cat}</CatBadge>
            <DeptBadge>{doc.dept}</DeptBadge>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button className="btn btn-ghost" onClick={() => router.push(`/documents/${doc.id}/edit`)}>
            <EditIcon />
            تعديل
          </button>
          <button className="btn btn-primary">
            <DownloadIcon />
            تنزيل الملف الرئيسي
          </button>
          <button
            className="icon-btn danger"
            onClick={() =>
              openConfirm('هل تريد حذف هذه الوثيقة؟ سيتم حذف جميع مرفقاتها بشكل نهائي.', () => {
                showToast('تم الحذف بنجاح');
                router.push('/documents');
              })
            }
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <div className="panel">
          <div className="panel-body">
            <p style={{ fontSize: 14, lineHeight: 1.9, color: 'var(--ink-soft)' }}>{doc.desc}</p>
            <div className="detail-meta-list">
              <div className="meta-item">
                <div className="k">أنشأها</div>
                <div className="v">{doc.by}</div>
              </div>
              <div className="meta-item">
                <div className="k">تاريخ الوثيقة</div>
                <div className="v mono">{doc.docDate}</div>
              </div>
              <div className="meta-item">
                <div className="k">تاريخ الرفع</div>
                <div className="v mono">{doc.uploadedAt}</div>
              </div>
              <div className="meta-item">
                <div className="k">آخر تعديل</div>
                <div className="v mono">{doc.updatedAt}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h2 style={{ fontSize: 16 }}>المرفقات ({doc.files.length})</h2>
            <button className="btn btn-text btn-sm" onClick={() => setAttachOpen(true)}>
              + إضافة مرفق
            </button>
          </div>
          <div className="panel-body">
            {doc.files.map((f) => (
              <div className="file-row" key={f.id}>
                <div className="fic">
                  <DocumentsIcon />
                </div>
                <div className="finfo">
                  <div className="fname">{f.name}</div>
                  <div className="fmeta">
                    {f.size} · رفعه {f.uploadedBy}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="icon-btn" title="تنزيل">
                    <DownloadIcon />
                  </button>
                  <button
                    className="icon-btn danger"
                    title="حذف"
                    onClick={() => openConfirm('حذف هذا المرفق نهائياً؟', () => showToast('تم الحذف بنجاح'))}
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
          showToast('تم رفع المرفق بنجاح');
          setAttachOpen(false);
        }}
      />
    </>
  );
}
