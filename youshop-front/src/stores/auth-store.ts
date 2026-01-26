'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isAdmin: false,

      setAuth: (user: User, accessToken: string) => {
        localStorage.setItem('accessToken', accessToken);
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isAdmin: user.role === 'ADMIN',
        });
      },

      logout: () => {
        localStorage.removeItem('accessToken');
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isAdmin: false,
        });
      },

      updateUser: (user: User) => {
        set({
          user,
          isAdmin: user.role === 'ADMIN',
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        isAdmin: state.isAdmin,
      }),
    }
  )
);
