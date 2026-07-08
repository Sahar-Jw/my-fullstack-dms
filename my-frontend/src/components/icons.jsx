import { SVGProps } from 'react';

const base = (props) => ({
  className: 'h-5 w-5',
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  ...props,
});

export const DashboardIcon = (p) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

export const DocumentsIcon = (p) => (
  <svg {...base(p)}>
    <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z" />
    <path d="M14 2v6h6" />
  </svg>
);

export const SearchIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const UsersIcon = (p) => (
  <svg {...base(p)}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const DepartmentsIcon = (p) => (
  <svg {...base(p)}>
    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M9 13h1M14 9h1M14 13h1M9 21v-4h6v4" />
  </svg>
);

export const CategoriesIcon = (p) => (
  <svg {...base(p)}>
    <path d="M20.6 12.3 12 20.9a2 2 0 0 1-2.8 0L3 14.7V4a1 1 0 0 1 1-1h10.7l5.9 5.9a2 2 0 0 1 0 2.8Z" />
    <circle cx="8" cy="8" r="1.5" />
  </svg>
);

export const SettingsIcon = (p) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
  </svg>
);

export const LogoutIcon = (p) => (
  <svg {...base(p)}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const MenuIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const ArrowRightIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M15 12H3M11 6l6 6-6 6" />
  </svg>
);

export const BackIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
);

export const EditIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </svg>
);

export const TrashIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
  </svg>
);

export const DownloadIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </svg>
);

export const ViewIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const PlusIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const UploadIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const AlertIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16h.01" />
  </svg>
);

export const CloseIcon = (p) => (
  <svg {...base({ strokeWidth: 2, ...p })}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
