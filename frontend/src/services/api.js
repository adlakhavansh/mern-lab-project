import axios from 'axios';
const api = axios.create({ baseURL: 'http://localhost:5000', withCredentials: true });
export default api;

// Wishlist
export const getWishlist = async () => (await api.get('/wishlist')).data;
export const toggleWishlist = async (productId) => (await api.patch(`/wishlist/${productId}/toggle`)).data;
export const removeFromWishlist = async (productId) => (await api.delete(`/wishlist/${productId}`)).data;
