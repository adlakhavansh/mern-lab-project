import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getWishlist, toggleWishlist, removeFromWishlist,
  getCart, addToCartApi, updateQuantityApi, removeFromCartApi
} from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthed, setIsAuthed] = useState(null); // null = not yet known

  const refreshCart = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCart();
      setCartItems(data.cart);
      setIsAuthed(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthed(false);
        setCartItems([]);
      } else {
        setError('Unable to load your cart.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // One fetch gives the navbar its count and every card its heart state, so a
  // saved product still shows as saved after a page refresh.
  const refreshWishlist = useCallback(async () => {
    try {
      const data = await getWishlist();
      setWishlistIds(new Set(data.wishlist.map(product => product._id)));
      setIsAuthed(true);
    } catch (err) {
      if (err.response?.status === 401) {
        setIsAuthed(false);
        setWishlistIds(new Set());
      }
    }
  }, []);

  useEffect(() => { refreshCart(); }, [refreshCart]);
  useEffect(() => { refreshWishlist(); }, [refreshWishlist]);

  // Returns the new saved state so the caller can word its own message
  const toggleWishlistItem = useCallback(async (productId) => {
    const data = await toggleWishlist(productId);
    setWishlistIds(previous => {
      const next = new Set(previous);
      if (data.saved) next.add(productId);
      else next.delete(productId);
      return next;
    });
    return data.saved;
  }, []);

  const dropWishlistItem = useCallback(async (productId) => {
    await removeFromWishlist(productId);
    setWishlistIds(previous => {
      const next = new Set(previous);
      next.delete(productId);
      return next;
    });
  }, []);

  // Every mutation replaces state from the server response, so the navbar
  // badge and the cart page can never drift apart.
  const runMutation = useCallback(async (call) => {
    const data = await call();
    setCartItems(data.cart);
    setIsAuthed(true);
    return data;
  }, []);

  const addToCart = useCallback((productId) => runMutation(() => addToCartApi(productId)), [runMutation]);
  const updateQuantity = useCallback((productId, quantity) => runMutation(() => updateQuantityApi(productId, quantity)), [runMutation]);
  const removeFromCart = useCallback((productId) => runMutation(() => removeFromCartApi(productId)), [runMutation]);
  const clearCartState = useCallback(() => setCartItems([]), []);

  // Login navigates without remounting the provider, so the page that signs in
  // has to ask for a re-sync or the navbar keeps showing the guest state.
  const refreshAll = useCallback(async () => {
    await Promise.all([refreshCart(), refreshWishlist()]);
  }, [refreshCart, refreshWishlist]);

  const value = useMemo(() => ({
    cartItems,
    loading,
    error,
    isAuthed,
    setIsAuthed,
    wishlistIds,
    wishlistCount: wishlistIds.size,
    // Derived, never stored: subtotal and counts come from cart state
    itemCount: cartItems.reduce((total, item) => total + item.quantity, 0),
    subtotal: cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0),
    addToCart,
    updateQuantity,
    removeFromCart,
    refreshCart,
    toggleWishlistItem,
    dropWishlistItem,
    refreshWishlist,
    refreshAll,
    clearCartState
  }), [
    cartItems, loading, error, isAuthed, wishlistIds,
    addToCart, updateQuantity, removeFromCart, refreshCart,
    toggleWishlistItem, dropWishlistItem, refreshWishlist, refreshAll, clearCartState
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
