'use client';

import { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    }
    fetchUser();
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';
  const isVolunteer = user?.role === 'VOLUNTEER' || user?.role === 'LEAD_EVALUATOR' || user?.role === 'COORDINATOR';
  const canManage = isAdmin || isManager;

  return { user, isLoading, isAdmin, isManager, isVolunteer, canManage };
}

export function useRoleGuard(requiredRoles: string[]) {
  const { user, isLoading } = useAuth();
  const hasAccess = user ? requiredRoles.includes(user.role) : false;
  return { hasAccess, isLoading, user };
}