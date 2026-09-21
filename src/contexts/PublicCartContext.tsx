// farm-fuzion-frontend/src/contexts/PublicCartContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

export interface CartTier {
  min_qty: number;
  price: number;
}

export interface PublicCartItem {
  productId: string;
  productName: string;
  cooperativeName: string;
  groupId?: string;
  country?: string;
  certification?: string;
  unit: string;
  currency: string;
  basePrice: number;      // base tier price (from product price_per_unit)
  tierPricing: CartTier[]; // optional tier pricing table
  moq: number;
  availableStock: number;
  quantity: number;
}

interface PublicCartContextType {
  items: PublicCartItem[];
  addItem: (item: Omit<PublicCartItem, "quantity">, quantity: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  getUnitPrice: (item: PublicCartItem) => number;
  getLineTotal: (item: PublicCartItem) => number;
  groupedByCooperative: () => Record<string, PublicCartItem[]>;
}

const PublicCartContext = createContext<PublicCartContextType | undefined>(undefined);
const STORAGE_KEY = "ff_public_cart_v1";

export const PublicCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<PublicCartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PublicCartItem[]) : [];
    } catch {
      return [];
    }
  });

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn("Failed to persist cart:", e);
    }
  }, [items]);

  const getUnitPrice = (item: PublicCartItem): number => {
    if (!item.tierPricing || item.tierPricing.length === 0) return item.basePrice;
    const sorted = [...item.tierPricing].sort((a, b) => b.min_qty - a.min_qty);
    const matched = sorted.find((t) => item.quantity >= t.min_qty);
    return matched ? matched.price : item.basePrice;
  };

  const getLineTotal = (item: PublicCartItem): number => getUnitPrice(item) * item.quantity;

  const addItem = (incoming: Omit<PublicCartItem, "quantity">, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === incoming.productId);
      const clampedQty = Math.max(
        incoming.moq,
        Math.min(quantity, incoming.availableStock)
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === incoming.productId
            ? { ...i, quantity: Math.min(i.quantity + clampedQty, i.availableStock) }
            : i
        );
      }
      return [...prev, { ...incoming, quantity: clampedQty }];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(i.moq, Math.min(quantity, i.availableStock)) }
          : i
      )
    );
  };

  const removeItem = (productId: string) =>
    setItems((prev) => prev.filter((i) => i.productId !== productId));

  const clearCart = () => setItems([]);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + getLineTotal(i), 0),
    [items]
  );

  const groupedByCooperative = (): Record<string, PublicCartItem[]> => {
    return items.reduce<Record<string, PublicCartItem[]>>((acc, item) => {
      const key = item.cooperativeName || "Unassigned Cooperative";
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  return (
    <PublicCartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
        subtotal,
        getUnitPrice,
        getLineTotal,
        groupedByCooperative,
      }}
    >
      {children}
    </PublicCartContext.Provider>
  );
};

export const usePublicCart = () => {
  const ctx = useContext(PublicCartContext);
  if (!ctx) throw new Error("usePublicCart must be used within a PublicCartProvider");
  return ctx;
};
