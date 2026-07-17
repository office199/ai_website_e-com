'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();

export const getApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:4000';
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  if (hostname.includes('3000')) {
    const newHost = hostname.replace('3000', '4000');
    return `${protocol}//${newHost}`;
  }
  
  if (window.location.port === '3000') {
    return `${protocol}//${hostname}:4000`;
  }
  
  return 'http://localhost:4000';
};

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToastState] = useState('');
  const userId = 'demo'; // simulated default user

  const showToast = useCallback((msg) => {
    setToastState(msg);
    const timer = setTimeout(() => {
      setToastState('');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  }, []);

  const fetchCart = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  }, []);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch(`${getApiUrl()}/api/wishlist/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setWishlist(data);
      }
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchProducts(), fetchCart(), fetchWishlist()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchProducts, fetchCart, fetchWishlist]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
        const item = products.find(p => p.id === productId);
        showToast(`✓ ${item ? item.name : 'Product'} added to your bag`);
      } else {
        showToast('Error adding item to bag');
      }
    } catch (err) {
      console.error('Error in addToCart:', err);
      showToast('Network error adding item to bag');
    }
  };

  const updateCartQuantity = async (productId, quantity) => {
    if (quantity < 1) {
      await removeFromCart(productId);
      return;
    }
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${userId}/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (res.ok) {
        await fetchCart();
        showToast('✓ Bag updated');
      }
    } catch (err) {
      console.error('Error in updateCartQuantity:', err);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/cart/${userId}/${productId}`, {
        method: 'DELETE',
      });
      if (res.ok || res.status === 204) {
        setCart(prev => prev.filter(x => x.productId !== productId));
        showToast('✓ Item removed from bag');
      }
    } catch (err) {
      console.error('Error in removeFromCart:', err);
    }
  };

  const toggleWishlist = async (productId) => {
    const isWishlisted = wishlist.some(x => x.id === productId);
    try {
      if (isWishlisted) {
        const res = await fetch(`${getApiUrl()}/api/wishlist/${userId}/${productId}`, {
          method: 'DELETE',
        });
        if (res.ok || res.status === 204) {
          setWishlist(prev => prev.filter(x => x.id !== productId));
          showToast('✓ Removed from wishlist');
        }
      } else {
        const res = await fetch(`${getApiUrl()}/api/wishlist/${userId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          const data = await res.json();
          setWishlist(data);
          showToast('✓ Added to wishlist');
        }
      }
    } catch (err) {
      console.error('Error in toggleWishlist:', err);
    }
  };

  const checkout = async (total) => {
    try {
      const res = await fetch(`${getApiUrl()}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, total }),
      });
      if (res.ok) {
        const order = await res.json();
        setCart([]);
        showToast(`✓ Order ${order.id} placed successfully!`);
        return order;
      }
      showToast('Error checking out');
      return null;
    } catch (err) {
      console.error('Error in checkout:', err);
      showToast('Network error during checkout');
      return null;
    }
  };

  return (
    <AppContext.Provider value={{
      products,
      cart,
      wishlist,
      loading,
      toast,
      showToast,
      fetchProducts,
      fetchCart,
      fetchWishlist,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      toggleWishlist,
      checkout,
      userId
    }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
