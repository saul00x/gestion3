import { apiRequest, endpoints, normalizeApiResponse } from '../config/api';

// Auth Services
export const authService = {
  login: (email: string, password: string) =>
    apiRequest(endpoints.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  
  logout: (refreshToken: string) =>
    apiRequest(endpoints.logout, {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    }),
  
  getCurrentUser: () => apiRequest(endpoints.currentUser),
  
  getUsers: async () => {
    try {
      console.log('Récupération des utilisateurs...');
      const response = await apiRequest(endpoints.users);
      console.log('Utilisateurs API response:', response);
      return normalizeApiResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  },
  
  createUser: (userData: any) => {
    // Créer FormData pour l'upload
    const formData = new FormData();
    
    // Générer un username basé sur l'email si pas fourni
    const username = userData.username || userData.email.split('@')[0];
    
    // Ajouter les champs requis
    formData.append('username', username); // CHAMP OBLIGATOIRE
    formData.append('email', userData.email);
    formData.append('nom', userData.nom);
    formData.append('prenom', userData.prenom);
    formData.append('password', userData.password);
    formData.append('role', userData.role);
    
    // Ajouter le magasin si fourni
    if (userData.magasin) {
      formData.append('magasin', userData.magasin);
    }
    
    // Ajouter l'image si fournie
    if (userData.image) {
      formData.append('image', userData.image);
    }
    
    console.log('Création utilisateur avec données:', {
      username,
      email: userData.email,
      nom: userData.nom,
      prenom: userData.prenom,
      role: userData.role,
      magasin: userData.magasin
    });
    
    return fetch(`http://localhost:8000/api/auth/users/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur détaillée création utilisateur:', errorData);
        throw new Error(JSON.stringify(errorData));
      }
      return response.json();
    });
  },
  
  updateUser: (id: string, userData: any) => {
    const formData = new FormData();
    
    // Ajouter les champs modifiables
    if (userData.nom) formData.append('nom', userData.nom);
    if (userData.prenom) formData.append('prenom', userData.prenom);
    if (userData.role) formData.append('role', userData.role);
    if (userData.magasin) formData.append('magasin', userData.magasin);
    if (userData.image) formData.append('image', userData.image);
    
    console.log('Modification utilisateur avec données:', userData);
    
    return fetch(`http://localhost:8000/api/auth/users/${id}/`, {
      method: 'PATCH', // Utiliser PATCH au lieu de PUT pour les mises à jour partielles
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur détaillée modification utilisateur:', errorData);
        throw new Error(JSON.stringify(errorData));
      }
      return response.json();
    });
  },
  
  deleteUser: (id: string) =>
    apiRequest(`${endpoints.users}${id}/`, { method: 'DELETE' }),
};

// Products Services
export const productsService = {
  getProducts: async () => {
    try {
      console.log('Récupération des produits...');
      const response = await apiRequest(endpoints.products);
      console.log('Produits API response:', response);
      return normalizeApiResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des produits:', error);
      throw error;
    }
  },
  
  createProduct: (productData: any) => {
    const formData = new FormData();
    
    formData.append('nom', productData.nom);
    formData.append('reference', productData.reference);
    formData.append('categorie', productData.categorie);
    formData.append('prix_unitaire', productData.prix_unitaire.toString());
    formData.append('seuil_alerte', productData.seuil_alerte.toString());
    
    if (productData.fournisseur) {
      formData.append('fournisseur', productData.fournisseur);
    }
    
    if (productData.image) {
      formData.append('image', productData.image);
    }
    
    return fetch(`http://localhost:8000/api/products/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return response.json();
    });
  },
  
  updateProduct: (id: string, productData: any) => {
    const formData = new FormData();
    
    formData.append('nom', productData.nom);
    formData.append('reference', productData.reference);
    formData.append('categorie', productData.categorie);
    formData.append('prix_unitaire', productData.prix_unitaire.toString());
    formData.append('seuil_alerte', productData.seuil_alerte.toString());
    
    if (productData.fournisseur) {
      formData.append('fournisseur', productData.fournisseur);
    }
    
    if (productData.image) {
      formData.append('image', productData.image);
    }
    
    return fetch(`http://localhost:8000/api/products/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return response.json();
    });
  },
  
  deleteProduct: (id: string) =>
    apiRequest(`${endpoints.products}${id}/`, { method: 'DELETE' }),
};

// Stores Services
export const storesService = {
  getStores: async () => {
    try {
      console.log('Récupération des magasins...');
      const response = await apiRequest(endpoints.stores);
      console.log('Magasins API response:', response);
      return normalizeApiResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des magasins:', error);
      throw error;
    }
  },
  
  createStore: (storeData: any) => {
    const formData = new FormData();
    
    formData.append('nom', storeData.nom);
    formData.append('adresse', storeData.adresse);
    formData.append('latitude', storeData.latitude.toString());
    formData.append('longitude', storeData.longitude.toString());
    
    if (storeData.image) {
      formData.append('image', storeData.image);
    }
    
    return fetch(`http://localhost:8000/api/stores/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return response.json();
    });
  },
  
  updateStore: (id: string, storeData: any) => {
    const formData = new FormData();
    
    formData.append('nom', storeData.nom);
    formData.append('adresse', storeData.adresse);
    formData.append('latitude', storeData.latitude.toString());
    formData.append('longitude', storeData.longitude.toString());
    
    if (storeData.image) {
      formData.append('image', storeData.image);
    }
    
    return fetch(`http://localhost:8000/api/stores/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return response.json();
    });
  },
  
  deleteStore: (id: string) =>
    apiRequest(`${endpoints.stores}${id}/`, { method: 'DELETE' }),
};

// Suppliers Services
export const suppliersService = {
  getSuppliers: async () => {
    try {
      console.log('Récupération des fournisseurs...');
      const response = await apiRequest(endpoints.suppliers);
      console.log('Fournisseurs API response:', response);
      return normalizeApiResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des fournisseurs:', error);
      throw error;
    }
  },
  
  createSupplier: (supplierData: any) => {
    const formData = new FormData();
    
    formData.append('nom', supplierData.nom);
    formData.append('adresse', supplierData.adresse);
    formData.append('contact', supplierData.contact);
    
    if (supplierData.image) {
      formData.append('image', supplierData.image);
    }
    
    return fetch(`http://localhost:8000/api/suppliers/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return response.json();
    });
  },
  
  updateSupplier: (id: string, supplierData: any) => {
    const formData = new FormData();
    
    formData.append('nom', supplierData.nom);
    formData.append('adresse', supplierData.adresse);
    formData.append('contact', supplierData.contact);
    
    if (supplierData.image) {
      formData.append('image', supplierData.image);
    }
    
    return fetch(`http://localhost:8000/api/suppliers/${id}/`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
      },
      body: formData,
    }).then(async response => {
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `Erreur HTTP: ${response.status}`);
      }
      return response.json();
    });
  },
  
  deleteSupplier: (id: string) =>
    apiRequest(`${endpoints.suppliers}${id}/`, { method: 'DELETE' }),
};

// Corrections pour stockService dans api.ts

export const stockService = {
  getStocks: async () => {
    try {
      console.log('📥 Récupération des stocks...');
      const response = await apiRequest(endpoints.stocks);
      console.log('📥 Stocks API response:', response);
    
      const normalizedData = normalizeApiResponse(response).map((stock: any) => ({
        ...stock,
        id: Number(stock.id),
        produit_id: Number(stock.product),  // Conversion critique
        magasin_id: Number(stock.magasin),  // Conversion critique
        quantite: Number(stock.quantity),
        updatedAt: new Date(stock.updated_at)
      }));
      console.log('📥 Stocks normalisés:', normalizedData);
      return normalizedData;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stocks:', error);
      throw error;
    }
  },
  
  createStock: async (stockData: any) => {
    try {
      console.log('📤 Création de stock avec données:', stockData);
      const response = await apiRequest(endpoints.stocks, {
        method: 'POST',
        body: JSON.stringify(stockData),
      });
      console.log('✅ Stock créé:', response);
      
      // S'assurer que la réponse contient les bonnes données
      if (!response.id) {
        throw new Error('Réponse API invalide: ID manquant');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la création du stock:', error);
      throw error;
    }
  },
  
  updateStock: async (id: string, stockData: any) => {
    try {
      console.log('📝 Modification de stock avec données:', stockData);
      const response = await apiRequest(`${endpoints.stocks}${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(stockData),
      });
      console.log('✅ Stock modifié:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la modification du stock:', error);
      throw error;
    }
  },
  
  deleteStock: async (id: string) => {
    try {
      console.log('🗑️ Suppression du stock:', id);
      const response = await apiRequest(`${endpoints.stocks}${id}/`, { method: 'DELETE' });
      console.log('✅ Stock supprimé');
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du stock:', error);
      throw error;
    }
  },
  
  // Nouvelle fonction pour récupérer un stock spécifique
  getStock: async (id: string) => {
    try {
      console.log('📥 Récupération du stock:', id);
      const response = await apiRequest(`${endpoints.stocks}${id}/`);
      console.log('📥 Stock récupéré:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du stock:', error);
      throw error;
    }
  },
  
  // Fonction pour vérifier si un stock existe déjà
  checkStockExists: async (produitId: number, magasinId: number) => {
    try {
      const stocks = await stockService.getStocks();
      return stocks.find((stock: any) => 
        parseInt(stock.produit_id.toString()) === produitId && 
        parseInt(stock.magasin_id.toString()) === magasinId
      );
    } catch (error) {
      console.error('❌ Erreur lors de la vérification du stock:', error);
      throw error;
    }
  },
  
  // Reste des fonctions...
  getMovements: async () => {
    try {
      console.log('📥 Récupération des mouvements...');
      const response = await apiRequest(endpoints.movements);
      console.log('📥 Mouvements API response:', response);
      return normalizeApiResponse(response);
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des mouvements:', error);
      throw error;
    }
  },
  
  createMovement: async (movementData: any) => {
    try {
      console.log('📤 Création de mouvement avec données:', movementData);
      const response = await apiRequest(endpoints.movements, {
        method: 'POST',
        body: JSON.stringify(movementData),
      });
      console.log('✅ Mouvement créé:', response);
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la création du mouvement:', error);
      throw error;
    }
  },
};

// Attendance Services
export const attendanceService = {
  getAttendance: async () => {
    try {
      console.log('Récupération des présences...');
      const response = await apiRequest(endpoints.attendance);
      console.log('Présences API response:', response);
      return normalizeApiResponse(response);
    } catch (error) {
      console.error('Erreur lors de la récupération des présences:', error);
      throw error;
    }
  },
  
  createAttendance: async (attendanceData: any) => {
    try {
      console.log('Création de présence avec données:', attendanceData);
      const response = await apiRequest(endpoints.attendance, {
        method: 'POST',
        body: JSON.stringify(attendanceData),
      });
      console.log('Présence créée:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création de la présence:', error);
      throw error;
    }
  },
  
  updateAttendance: async (id: string, attendanceData: any) => {
    try {
      console.log('Modification de présence avec données:', attendanceData);
      const response = await apiRequest(`${endpoints.attendance}${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(attendanceData),
      });
      console.log('Présence modifiée:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la modification de la présence:', error);
      throw error;
    }
  },
  
  deleteAttendance: (id: string) =>
    apiRequest(`${endpoints.attendance}${id}/`, { method: 'DELETE' }),
};

// Messaging Services
export const messagingService = {
  getMessages: async () => {
    try {
      console.log('Récupération des messages...');
      const response = await apiRequest(endpoints.messages);
      console.log('Messages API response:', response);
      const normalizedData = normalizeApiResponse(response);
      console.log('Messages normalisés:', normalizedData);
      return normalizedData;
    } catch (error) {
      console.error('Erreur lors de la récupération des messages:', error);
      throw error;
    }
  },
  
  createMessage: async (messageData: any) => {
    try {
      console.log('Création de message avec données:', messageData);
      const response = await apiRequest(endpoints.messages, {
        method: 'POST',
        body: JSON.stringify(messageData),
      });
      console.log('Message créé:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la création du message:', error);
      throw error;
    }
  },
  
  updateMessage: async (id: string, messageData: any) => {
    try {
      console.log('Modification de message avec données:', messageData);
      const response = await apiRequest(`${endpoints.messages}${id}/`, {
        method: 'PATCH',
        body: JSON.stringify(messageData),
      });
      console.log('Message modifié:', response);
      return response;
    } catch (error) {
      console.error('Erreur lors de la modification du message:', error);
      throw error;
    }
  },
  
  deleteMessage: (id: string) =>
    apiRequest(`${endpoints.messages}${id}/`, { method: 'DELETE' }),
};