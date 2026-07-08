'use client';

import Modal from "../ui/Modal";
import Stamp from "../ui/Stamp";


export default function AttachmentModal({ open, onClose, onUpload }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Attachment"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onUpload}>
            Upload
          </button>
        </>
      }
    >
      <div className="rounded-2xl border border-dashed border-[#d8d0be] bg-[#f6f3ec]/70 p-6 text-center">
        <Stamp size="sm" className="mx-auto mb-2.5">
          ↑
        </Stamp>
        <b>Drag one or more files here</b>
        <p className="mt-1">or click to choose from your device</p>
      </div>
    </Modal>
  );
}
