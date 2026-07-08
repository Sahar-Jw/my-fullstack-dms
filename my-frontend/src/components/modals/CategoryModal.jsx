'use client';

import Modal from "../ui/Modal";



export default function CategoryModal({ open, category, onClose, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add New Category'}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Save
          </button>
        </>
      }
    >
      <div className="mb-4">
        <label>Category name</label>
        <input placeholder="e.g. Legal" defaultValue={category?.name} />
      </div>
      <div className="mb-4">
        <label>Description</label>
        <textarea rows={3} placeholder="Short description for this category" defaultValue={category?.desc} />
      </div>
    </Modal>
  );
}
