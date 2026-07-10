// lib/preview.ts
import { DmsDocument, DocVersion, DocAttachment, PreviewTarget } from './types';

/** Preview the document's current (latest) version. */
export function previewTargetForDocument(doc: DmsDocument, latestVersion?: DocVersion): PreviewTarget | null {
  if (!latestVersion) return null;
  return {
    previewPath: `/documents/${doc.id}/preview`,
    filename: latestVersion.originalFileName || doc.name,
    mimeType: latestVersion.mimeType,
  };
}

/** Preview a specific historical version (falls back to download-as-preview
 *  since there's no dedicated inline-version-preview route yet — see note below). */
export function previewTargetForVersion(documentId: number, version: DocVersion): PreviewTarget {
  return {
    previewPath: `/documents/${documentId}/version/${version.id}/download`,
    filename: version.originalFileName,
    mimeType: version.mimeType,
  };
}

export function previewTargetForAttachment(attachment: DocAttachment): PreviewTarget {
  return {
    previewPath: `/documents/attachments/${attachment.id}/download`,
    filename: attachment.fileName,
    mimeType: attachment.mimeType,
  };
}