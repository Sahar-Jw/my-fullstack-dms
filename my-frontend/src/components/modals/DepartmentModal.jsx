'use client';

import Modal from "../ui/Modal";


export default function DepartmentModal({ open, department, onClose, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={department ? 'Edit Department' : 'Add New Department'}
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
        <label>Department name</label>
        <input placeholder="e.g. IT" defaultValue={department?.name} />
      </div>
      <div className="mb-4">
        <label>Description</label>
        <textarea rows={3} placeholder="Short description of the department" defaultValue={department?.desc} />
      </div>
    </Modal>
  );
}
