const baseBadge = 'inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold';

export function CatBadge({ children }) {
  return <span className={`${baseBadge} bg-[#fbede9] text-[#a63d2f]`}>{children}</span>;
}

export function DeptBadge({ children }) {
  return <span className={`${baseBadge} bg-[#e8efe8] text-[#4b7355]`}>{children}</span>;
}

export function RoleBadge({ role }) {
  const cls =
    role === 'Admin'
      ? 'bg-[#fbede9] text-[#a63d2f]'
      : role === 'Manager'
        ? 'bg-[#ede8db] text-[#b08b2e]'
        : 'bg-[#e8efe8] text-[#4b7355]';
  return <span className={`${baseBadge} ${cls}`}>{role}</span>;
}

export function StatusBadge({ active }) {
  return (
    <span className={`${baseBadge} ${active ? 'bg-[#e8efe8] text-[#4b7355]' : 'bg-[#f3efe6] text-[#5b6b75]'}`}>
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
