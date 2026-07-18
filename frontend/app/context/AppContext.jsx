'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { ScrollTopBottomButton } from '../components/ScrollTopBottomButton';

const AppContext = createContext();

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  if (typeof window === 'undefined') return 'http://localhost:4000';
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return `${window.location.protocol}//${window.location.hostname}:4000`;
  }
  return 'http://localhost:4000';
};

const readError = async (response) => {
  try {
    const data = await response.json();
    return data.error || 'Request failed. Please try again.';
  } catch {
    return 'Request failed. Please try again.';
  }
};

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [toast, setToastState] = useState('');

  const showToast = useCallback((message) => {
    setToastState(message);
    window.setTimeout(() => setToastState(''), 3500);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('mode_auth_token');
    setToken(null);
    setUser(null);
    setCart([]);
    setWishlist([]);
  }, []);

  const authFetch = useCallback(async (path, options = {}) => {
    const headers = { ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
    if (response.status === 401 && token) clearSession();
    return response;
  }, [token, clearSession]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${getApiUrl()}/api/products`);
      if (!response.ok) throw new Error(await readError(response));
      setProducts(await response.json());
    } catch (error) {
      console.error('Unable to load products:', error);
      showToast('We could not load the product catalogue.');
    }
  }, [showToast]);

  const fetchCart = useCallback(async () => {
    if (!token) {
      setCart([]);
      return;
    }
    try {
      const response = await authFetch('/api/cart');
      if (response.ok) setCart(await response.json());
    } catch (error) {
      console.error('Unable to load cart:', error);
    }
  }, [authFetch, token]);

  const fetchWishlist = useCallback(async () => {
    if (!token) {
      setWishlist([]);
      return;
    }
    try {
      const response = await authFetch('/api/wishlist');
      if (response.ok) setWishlist(await response.json());
    } catch (error) {
      console.error('Unable to load wishlist:', error);
    }
  }, [authFetch, token]);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem('mode_auth_token');
      if (!storedToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch(`${getApiUrl()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        setToken(storedToken);
        setUser(data.user);
      } catch {
        localStorage.removeItem('mode_auth_token');
      } finally {
        setAuthLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    const loadStoreData = async () => {
      setLoading(true);
      await fetchProducts();
      setLoading(false);
    };
    loadStoreData();
  }, [fetchProducts]);

  useEffect(() => {
    if (!authLoading) {
      if (token) {
        fetchCart();
        fetchWishlist();
      } else {
        setCart([]);
        setWishlist([]);
      }
    }
  }, [authLoading, token, fetchCart, fetchWishlist]);

  const authenticate = useCallback(async (endpoint, credentials) => {
    try {
      const response = await fetch(`${getApiUrl()}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) return { ok: false, error: await readError(response) };
      const data = await response.json();
      localStorage.setItem('mode_auth_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return { ok: true, user: data.user };
    } catch (error) {
      console.error('Authentication request failed:', error);
      return { ok: false, error: 'Unable to reach the server. Please try again.' };
    }
  }, []);

  const login = useCallback((credentials) => authenticate('/api/auth/login', credentials), [authenticate]);
  const signup = useCallback((credentials) => authenticate('/api/auth/signup', credentials), [authenticate]);

  const subscribe = useCallback(async (email) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/newsletter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        showToast(await readError(response));
        return false;
      }
      showToast('You are subscribed. Thank you for joining us.');
      return true;
    } catch (error) {
      console.error('Unable to subscribe:', error);
      showToast('Unable to save your subscription. Please try again.');
      return false;
    }
  }, [showToast]);

  const logout = useCallback(() => {
    clearSession();
    showToast('You have been signed out.');
  }, [clearSession, showToast]);

  const ensureAuthenticated = useCallback(() => {
    if (token && user) return true;
    showToast('Please sign in to save items and place orders.');
    return false;
  }, [token, user, showToast]);

  const addToCart = useCallback(async (productId, quantity = 1) => {
    if (!ensureAuthenticated()) return false;
    try {
      const response = await authFetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) {
        showToast(await readError(response));
        return false;
      }
      const data = await response.json();
      setCart(data);
      const product = products.find((item) => item.id === productId);
      showToast(`${product?.name || 'Item'} added to your bag.`);
      return true;
    } catch (error) {
      console.error('Unable to add to cart:', error);
      showToast('Unable to update your bag.');
      return false;
    }
  }, [authFetch, ensureAuthenticated, products, showToast]);

  const updateCartQuantity = useCallback(async (productId, quantity) => {
    if (!ensureAuthenticated()) return false;
    if (quantity < 1) return removeFromCart(productId);
    try {
      const response = await authFetch(`/api/cart/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) {
        showToast(await readError(response));
        return false;
      }
      setCart(await response.json());
      return true;
    } catch (error) {
      console.error('Unable to update cart:', error);
      showToast('Unable to update your bag.');
      return false;
    }
  }, [authFetch, ensureAuthenticated, showToast]);

  const removeFromCart = useCallback(async (productId) => {
    if (!ensureAuthenticated()) return false;
    try {
      const response = await authFetch(`/api/cart/${productId}`, { method: 'DELETE' });
      if (!response.ok && response.status !== 204) {
        showToast(await readError(response));
        return false;
      }
      setCart((previous) => previous.filter((item) => item.productId !== productId));
      showToast('Item removed from your bag.');
      return true;
    } catch (error) {
      console.error('Unable to remove cart item:', error);
      showToast('Unable to update your bag.');
      return false;
    }
  }, [authFetch, ensureAuthenticated, showToast]);

  const toggleWishlist = useCallback(async (productId) => {
    if (!ensureAuthenticated()) return false;
    const isWishlisted = wishlist.some((item) => item.id === productId);
    try {
      const response = await authFetch(
        isWishlisted ? `/api/wishlist/${productId}` : '/api/wishlist',
        isWishlisted
          ? { method: 'DELETE' }
          : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId }) }
      );
      if (!response.ok && response.status !== 204) {
        showToast(await readError(response));
        return false;
      }
      if (isWishlisted) {
        setWishlist((previous) => previous.filter((item) => item.id !== productId));
        showToast('Removed from your wishlist.');
      } else {
        setWishlist(await response.json());
        showToast('Added to your wishlist.');
      }
      return true;
    } catch (error) {
      console.error('Unable to update wishlist:', error);
      showToast('Unable to update your wishlist.');
      return false;
    }
  }, [authFetch, ensureAuthenticated, showToast, wishlist]);

  const checkout = useCallback(async () => {
    if (!ensureAuthenticated()) return null;
    try {
      const response = await authFetch('/api/orders', { method: 'POST' });
      if (!response.ok) {
        showToast(await readError(response));
        return null;
      }
      const order = await response.json();
      setCart([]);
      showToast(`Order ${order.id} placed successfully.`);
      return order;
    } catch (error) {
      console.error('Unable to check out:', error);
      showToast('Unable to complete checkout.');
      return null;
    }
  }, [authFetch, ensureAuthenticated, showToast]);

  return (
    <AppContext.Provider value={{
      products,
      cart,
      wishlist,
      loading,
      authLoading,
      user,
      token,
      isAuthenticated: Boolean(user && token),
      toast,
      showToast,
      authFetch,
      fetchProducts,
      fetchCart,
      fetchWishlist,
      login,
      signup,
      subscribe,
      logout,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      toggleWishlist,
      checkout,
    }}>
      {children}
      {toast && <div className="toast" role="status">{toast}</div>}
      <ScrollTopBottomButton />
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
