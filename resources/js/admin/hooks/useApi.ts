import axios, { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function useApi(): AxiosInstance {
  const navigate = useNavigate();
  const [api] = useState(() => {
    const token = localStorage.getItem('admin_token');
    
    const instance = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    // Intercepteur pour gérer les erreurs 401 (token expiré)
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login');
        }
        return Promise.reject(error);
      }
    );

    return instance;
  });

  return api;
}