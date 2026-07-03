'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

export default function Home() {
  const { isAuthenticated } = useApp();
  const router = useRouter();

  useEffect(() => {
    router.replace(isAuthenticated ? '/dashboard' : '/login');
  }, [isAuthenticated, router]);

  return null;
}
