import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getWishlist, toggleWishlist, removeFromWishlist } from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
};

export function CartProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState(() => new Set());
  const [isAuthed, setIsAuthed] = useState(null); // null = not yet known

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

  const value = useMemo(() => ({
    wishlistIds,
    wishlistCount: wishlistIds.size,
    isAuthed,
    setIsAuthed,
    toggleWishlistItem,
    dropWishlistItem,
    refreshWishlist
  }), [wishlistIds, isAuthed, toggleWishlistItem, dropWishlistItem, refreshWishlist]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
