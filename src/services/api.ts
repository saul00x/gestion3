import { apiRequest, apiUpload, endpoints } from '../config/api';

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
  
  getUsers: () => apiRequest(endpoints.users),
  
  createUser: (userData: any) => {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });
    return apiUpload(endpoints.users, formData);
  },
  
  updateUser: (id: string, userData: any) => {
    const formData = new FormData();
    Object.keys(userData).forEach(key => {
      if (userData[key] !== null && userData[key] !== undefined) {
        formData.append(key, userData[key]);
      }
    });
    return apiUpload(`${endpoints.users}${id}/`, formData);
  },
  
  deleteUser: (id: string) =>
    apiRequest(`${endpoints.users}${id}/`, { method: 'DELETE' }),
};

// Products Services
export const productsService = {
  getProducts: () => apiRequest(endpoints.products),
  
  createProduct: (productData: any) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    return apiUpload(endpoints.products, formData);
  },
  
  updateProduct: (id: string, productData: any) => {
    const formData = new FormData();
    Object.keys(productData).forEach(key => {
      if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });
    return apiUpload(`${endpoints.products}${id}/`, formData);
  },
  
  deleteProduct: (id: string) =>
    apiRequest(`${endpoints.products}${id}/`, { method: 'DELETE' }),
};

// Stores Services
export const storesService = {
  getStores: () => apiRequest(endpoints.stores),
  
  createStore: (storeData: any) => {
    const formData = new FormData();
    Object.keys(storeData).forEach(key => {
      if (storeData[key] !== null && storeData[key] !== undefined) {
        formData.append(key, storeData[key]);
      }
    });
    return apiUpload(endpoints.stores, formData);
  },
  
  updateStore: (id: string, storeData: any) => {
    const formData = new FormData();
    Object.keys(storeData).forEach(key => {
      if (storeData[key] !== null && storeData[key] !== undefined) {
        formData.append(key, storeData[key]);
      }
    });
    return apiUpload(`${endpoints.stores}${id}/`, formData);
  },
  
  deleteStore: (id: string) =>
    apiRequest(`${endpoints.stores}${id}/`, { method: 'DELETE' }),
};

// Suppliers Services
export const suppliersService = {
  getSuppliers: () => apiRequest(endpoints.suppliers),
  
  createSupplier: (supplierData: any) => {
    const formData = new FormData();
    Object.keys(supplierData).forEach(key => {
      if (supplierData[key] !== null && supplierData[key] !== undefined) {
        formData.append(key, supplierData[key]);
      }
    });
    return apiUpload(endpoints.suppliers, formData);
  },
  
  updateSupplier: (id: string, supplierData: any) => {
    const formData = new FormData();
    Object.keys(supplierData).forEach(key => {
      if (supplierData[key] !== null && supplierData[key] !== undefined) {
        formData.append(key, supplierData[key]);
      }
    });
    return apiUpload(`${endpoints.suppliers}${id}/`, formData);
  },
  
  deleteSupplier: (id: string) =>
    apiRequest(`${endpoints.suppliers}${id}/`, { method: 'DELETE' }),
};

// Stock Services
export const stockService = {
  getStocks: () => apiRequest(endpoints.stocks),
  
  createStock: (stockData: any) =>
    apiRequest(endpoints.stocks, {
      method: 'POST',
      body: JSON.stringify(stockData),
    }),
  
  updateStock: (id: string, stockData: any) =>
    apiRequest(`${endpoints.stocks}${id}/`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    }),
  
  deleteStock: (id: string) =>
    apiRequest(`${endpoints.stocks}${id}/`, { method: 'DELETE' }),
  
  getMovements: () => apiRequest(endpoints.movements),
  
  createMovement: (movementData: any) =>
    apiRequest(endpoints.movements, {
      method: 'POST',
      body: JSON.stringify(movementData),
    }),
};

// Attendance Services
export const attendanceService = {
  getAttendance: () => apiRequest(endpoints.attendance),
  
  createAttendance: (attendanceData: any) =>
    apiRequest(endpoints.attendance, {
      method: 'POST',
      body: JSON.stringify(attendanceData),
    }),
  
  updateAttendance: (id: string, attendanceData: any) =>
    apiRequest(`${endpoints.attendance}${id}/`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData),
    }),
  
  deleteAttendance: (id: string) =>
    apiRequest(`${endpoints.attendance}${id}/`, { method: 'DELETE' }),
};

// Messaging Services
export const messagingService = {
  getMessages: () => apiRequest(endpoints.messages),
  
  createMessage: (messageData: any) =>
    apiRequest(endpoints.messages, {
      method: 'POST',
      body: JSON.stringify(messageData),
    }),
  
  updateMessage: (id: string, messageData: any) =>
    apiRequest(`${endpoints.messages}${id}/`, {
      method: 'PUT',
      body: JSON.stringify(messageData),
    }),
  
  deleteMessage: (id: string) =>
    apiRequest(`${endpoints.messages}${id}/`, { method: 'DELETE' }),
};