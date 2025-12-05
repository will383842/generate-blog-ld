import axios, { AxiosInstance } from 'axios';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

export function useApi(): AxiosInstance {
  const navigate = useNavigate();
  
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: true,
    });

    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (csrfToken) {
          config.headers['X-CSRF-TOKEN'] = csrfToken;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          navigate('/admin/login', { replace: true });
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [navigate]);

  return api;
}