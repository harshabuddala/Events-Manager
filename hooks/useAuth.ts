'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

let cachedUser: User | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 30_000;

export function useAuth() {
  const [user, setUser] = useState<User | null>(cachedUser);
  const [isLoading, setIsLoading] = useState(!cachedUser);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current && cachedUser) return;
    fetchedRef.current = true;

    const now = Date.now();
    if (cachedUser && now - cacheTimestamp < CACHE_TTL) {
      setUser(cachedUser);
      setIsLoading(false);
      return;
    }

    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          cachedUser = data.user;
          cacheTimestamp = Date.now();
          setUser(data.user);
        } else {
          cachedUser = null;
          setUser(null);
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
