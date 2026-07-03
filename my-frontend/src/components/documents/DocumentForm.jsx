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
    showToast('تم حفظ الوثيقة بنجاح');
    router.push('/documents');
  }

  return (
    <div className="panel" style={{ maxWidth: 720 }}>
      <div className="panel-head">
        <h2>{document ? 'تعديل وثيقة' : 'إضافة وثيقة جديدة'}</h2>
      </div>
      <form className="panel-body" onSubmit={handleSubmit}>
        <div className="field">
          <label>عنوان الوثيقة *</label>
          <input placeholder="مثال: سياسة إجازات الموظفين 2026" defaultValue={document?.title} required />
        </div>
        <div className="field">
          <label>الوصف</label>
          <textarea rows={4} placeholder="وصف تفصيلي مختصر لمحتوى الوثيقة" defaultValue={document?.desc} />
        </div>
        <div className="field-row">
          <div className="field">
            <label>التصنيف *</label>
            <select defaultValue={document?.cat ?? CAT_NAMES[0]}>
              {CAT_NAMES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>القسم *</label>
            <select defaultValue={document?.dept ?? DEPT_NAMES[0]}>
              {DEPT_NAMES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>تاريخ الوثيقة</label>
          <input type="date" defaultValue={document?.docDate ?? '2026-07-03'} style={{ maxWidth: 220 }} />
        </div>
        <div className="field">
          <label>الملف الرئيسي *</label>
          <div className="dropzone">
            <Stamp size="sm" style={{ margin: '0 auto 10px' }}>
              <UploadIcon style={{ width: 14, height: 14 }} />
            </Stamp>
            <b>اسحب الملف هنا أو اضغط للاختيار</b>
            <p style={{ marginTop: 4 }}>PDF، Word، أو Excel — حتى 20 ميجابايت</p>
          </div>
          <p className="hint">إذا كان نوع الملف أو حجمه غير مسموح، سيعرض النظام رسالة خطأ فور الرفع.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button className="btn btn-primary" type="submit">
            حفظ الوثيقة
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => router.push('/documents')}>
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}
