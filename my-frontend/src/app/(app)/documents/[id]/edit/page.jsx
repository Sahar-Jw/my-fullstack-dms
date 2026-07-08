'use client';

import { useRouter } from 'next/navigation';
import { notFound, useParams } from 'next/navigation';
import { BackIcon } from '../../../../../components/icons';
import DocumentForm from '../../../../../components/documents/DocumentForm';
import { DOCS } from '../../../../../lib/mockData';

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const doc = DOCS.find((d) => d.id === params.id);

  if (!doc) return notFound();

  return (
    <>
        <button className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#a63d2f]" onClick={() => router.push('/documents')}>
          <BackIcon />
          Back to documents list
        </button>
      <DocumentForm document={doc} />
    </>
  );
}
