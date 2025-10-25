// Configuración centralizada de la API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper para construir URLs completas
export const getApiUrl = (endpoint) => {
  // Asegurarse de que el endpoint comience con /
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${path}`;
};

export default API_URL;