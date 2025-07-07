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
      // S'assurer que les données sont bien formatées
      const loginData = {
        email: email.trim(),
        password: password
      };

      console.log('Tentative de connexion avec:', { email: loginData.email });

      const response = await fetch(`http://localhost:8000/api/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur de connexion:', errorData);
        throw new Error(errorData.error || errorData.message || 'Erreur de connexion');
      }

      const data = await response.json();
      console.log('Réponse de connexion:', data);
      
      // Stocker les tokens
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Mettre à jour l'état utilisateur
      setUser({
        id: data.user.id,
        email: data.user.email,
        nom: data.user.nom || '',
        prenom: data.user.prenom || '',
        role: data.user.role,
        magasin_id: data.user.magasin_id,
        image_url: data.user.image_url,
        createdAt: new Date(data.user.created_at)
      });
      
      return data;
    } catch (error) {
      console.error('Erreur dans login:', error);
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