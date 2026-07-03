'use client';

import { useRouter } from 'next/navigation';
import { BackIcon } from '../../../../components/icons';
import DocumentForm from '../../../../components/documents/DocumentForm';

export default function NewDocumentPage() {
  const router = useRouter();
  return (
    <>
      <button className="back-link" onClick={() => router.push('/documents')}>
        <BackIcon />
        العودة إلى قائمة الوثائق
      </button>
      <DocumentForm />
    </>
  );
}
