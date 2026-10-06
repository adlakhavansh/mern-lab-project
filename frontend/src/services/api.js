import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000', withCredentials: true });
export default api;

// Wishlist
export const getWishlist = async () => (await api.get('/wishlist')).data;
export const toggleWishlist = async (productId) => (await api.patch(`/wishlist/${productId}/toggle`)).data;
export const removeFromWishlist = async (productId) => (await api.delete(`/wishlist/${productId}`)).data;

// Cart
export const getCart = async () => (await api.get('/cart')).data;
export const addToCartApi = async (productId) => (await api.post(`/cart/${productId}`)).data;
export const updateQuantityApi = async (productId, quantity) => (await api.patch(`/cart/${productId}`, { quantity })).data;
export const removeFromCartApi = async (productId) => (await api.delete(`/cart/${productId}`)).data;
