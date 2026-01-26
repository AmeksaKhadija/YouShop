'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api';
import { LoginCredentials, RegisterData } from '@/types';
import { toast } from 'sonner';

export function useAuth() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, setAuth, logout: storeLogout } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success('Connexion réussie !');
      if (data.user.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    },
    onError: () => {
      toast.error('Email ou mot de passe incorrect');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: RegisterData) => authApi.register(userData),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      toast.success('Inscription réussie !');
      router.push('/');
    },
    onError: () => {
      toast.error("Erreur lors de l'inscription");
    },
  });

  const logout = () => {
    storeLogout();
    toast.success('Déconnexion réussie');
    router.push('/');
  };

  return {
    user,
    isAuthenticated,
    isAdmin,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
