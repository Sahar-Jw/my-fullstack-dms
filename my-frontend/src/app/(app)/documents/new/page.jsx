'use client';

import { useRouter } from 'next/navigation';
import { BackIcon } from '../../../../components/icons';
import DocumentForm from '../../../../components/documents/DocumentForm';

export default function NewDocumentPage() {
  const router = useRouter();
  return (
    <>
        <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#a63d2f]" onClick={() => router.push('/documents')}>
          <BackIcon />
          Back to documents list
        </button>
      <DocumentForm />
    </>
  );
}
