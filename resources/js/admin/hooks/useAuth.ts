import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LoginParams {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
}

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Login mutation
  const login = useMutation({
    mutationFn: async (params: LoginParams) => {
      const { data } = await axios.post('/api/admin/login', params);
      return data;
    },
    onSuccess: (data) => {
      localStorage.setItem('admin_token', data.token);
      toast.success('Connexion réussie !');
      navigate('/admin');
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur de connexion');
    },
  });

  // Logout mutation
  const logout = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('admin_token');
      if (token) {
        await axios.post('/api/admin/logout', {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    },
    onSuccess: () => {
      localStorage.removeItem('admin_token');
      toast.success('Déconnexion réussie');
      navigate('/admin/login');
      queryClient.clear();
    },
  });

  // Get current user
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const token = localStorage.getItem('admin_token');
      if (!token) throw new Error('No token');
      
      const { data } = await axios.get('/api/admin/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return data;
    },
    enabled: !!localStorage.getItem('admin_token'),
    retry: false,
  });

  return {
    login,
    logout,
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}