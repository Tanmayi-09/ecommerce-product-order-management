import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from '../../shared/types.ts';
import { api } from '../services/api.ts';
import { useAuth } from './AuthContext.tsx';
import { useToast } from './ToastContext.tsx';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { success, error } = useToast();

  const refreshCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      setSubtotal(0);
      return;
    }
    try {
      setIsLoading(true);
      const res = await api.cart.get();
      if (res.success) {
        setItems(res.items || []);
        setSubtotal(res.subtotal || 0);
      }
    } catch (err) {
      console.warn('Failed to load cart:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (productId: string, quantity = 1): Promise<boolean> => {
    if (!user) {
      error('Please log in to add items to your cart.');
      return false;
    }
    try {
      const res = await api.cart.add(productId, quantity);
      if (res.success) {
        success(res.message || 'Added to cart!');
        await refreshCart();
        return true;
      }
      return false;
    } catch (err: any) {
      error(err.message || 'Could not add item to cart.');
      return false;
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    try {
      await api.cart.update(id, quantity);
      await refreshCart();
    } catch (err: any) {
      error(err.message || 'Could not update quantity.');
    }
  };

  const removeFromCart = async (id: string) => {
    try {
      await api.cart.remove(id);
      success('Item removed from cart.');
      await refreshCart();
    } catch (err: any) {
      error(err.message || 'Could not remove item.');
    }
  };

  const clearCart = async () => {
    try {
      await api.cart.clear();
      setItems([]);
      setSubtotal(0);
    } catch (err: any) {
      error(err.message || 'Could not clear cart.');
    }
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
