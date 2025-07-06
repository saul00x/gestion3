import { useState, useEffect } from 'react';
import { apiRequest, endpoints } from '../config/api';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (token) {
        try {
          const userData = await apiRequest(endpoints.currentUser);
          setUser({
            id: userData.id,
            email: userData.email,
            nom: userData.nom || '',
            prenom: userData.prenom || '',
            role: userData.role,
            magasin_id: userData.magasin_id,
            image_url: userData.image_url,
            createdAt: new Date(userData.created_at)
          });
        } catch (error) {
          console.error('Erreur lors de la récupération des données utilisateur:', error);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest(endpoints.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);
      
      setUser({
        id: response.user.id,
        email: response.user.email,
        nom: response.user.nom || '',
        prenom: response.user.prenom || '',
        role: response.user.role,
        magasin_id: response.user.magasin_id,
        image_url: response.user.image_url,
        createdAt: new Date(response.user.created_at)
      });
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiRequest(endpoints.logout, {
          method: 'POST',
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  return { user, loading, login, logout };
};