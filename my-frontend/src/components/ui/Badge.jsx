export function CatBadge({ children }) {
  return <span className="badge badge-cat">{children}</span>;
}

export function DeptBadge({ children }) {
  return <span className="badge badge-dept">{children}</span>;
}

export function RoleBadge({ role }) {
  const cls =
    role === 'Admin' ? 'badge-role-admin' : role === 'Manager' ? 'badge-role-manager' : 'badge-role-employee';
  return <span className={`badge ${cls}`}>{role}</span>;
}

export function StatusBadge({ active }) {
  return (
    <span className={`badge ${active ? 'badge-active' : 'badge-inactive'}`}>
      <span className="dot" />
      {active ? 'مفعّل' : 'موقوف'}
    </span>
  );
}
