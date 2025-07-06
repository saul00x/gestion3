const API_BASE_URL = 'http://localhost:8000/api';

// Configuration de l'API
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 10000,
};

// Helper pour les requêtes authentifiées
const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper pour les requêtes avec fichiers
const getFormDataHeaders = () => ({
  ...getAuthHeaders(),
  // Ne pas définir Content-Type pour FormData, le navigateur le fera automatiquement
});

// Helper pour les requêtes JSON
const getJsonHeaders = () => ({
  ...getAuthHeaders(),
  'Content-Type': 'application/json',
});

// Fonction générique pour les requêtes API
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: getJsonHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (response.status === 401) {
      // Token expiré, rediriger vers login
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Fonction pour les uploads de fichiers
export const apiUpload = async (endpoint: string, formData: FormData) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(), // Pas de Content-Type pour FormData
      body: formData,
    });
    
    if (response.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
      throw new Error('Session expirée');
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Erreur upload:', error);
    throw error;
  }
};

// API endpoints
export const endpoints = {
  // Auth
  login: '/auth/login/',
  logout: '/auth/logout/',
  refresh: '/auth/refresh/',
  currentUser: '/auth/me/',
  users: '/auth/users/',
  
  // Products
  products: '/products/',
  
  // Stores
  stores: '/stores/',
  
  // Suppliers
  suppliers: '/suppliers/',
  
  // Stock
  stocks: '/stock/stocks/',
  movements: '/stock/mouvements/',
  orders: '/stock/commandes/',
  
  // Attendance
  attendance: '/attendance/presences/',
  
  // Messaging
  messages: '/messaging/messages/',
};
