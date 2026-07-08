'use client';

import { DEPT_NAMES } from '../../lib/mockData';
import Modal from '../ui/Modal';


export default function UserModal({ open, user, onClose, onSave }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add New User'}
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
        <label>Full name</label>
        <input placeholder="e.g. Sarah Ahmed" defaultValue={user?.name} />
      </div>
      <div className="mb-4">
        <label>Email</label>
        <input type="email" placeholder="name@organization.com" defaultValue={user?.email} />
      </div>
      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <div>
          <label>Department</label>
          <select defaultValue={user?.dept ?? DEPT_NAMES[0]}>
            {DEPT_NAMES.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Role</label>
          <select defaultValue={user?.role ?? 'Employee'}>
            <option>Employee</option>
            <option>Manager</option>
            <option>Admin</option>
          </select>
        </div>
      </div>
      <div className="mb-4">
        <label>Temporary password</label>
        <input type="password" placeholder="User will be asked to change this on first login" />
      </div>
    </Modal>
  );
}
