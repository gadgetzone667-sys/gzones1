import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistItems: string[];
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  totalWishlistItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from local storage or default to empty
  const [wishlistItems, setWishlistItems] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("GadgetZone_wishlist");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Sync to local storage whenever wishlist changes
  useEffect(() => {
    localStorage.setItem("GadgetZone_wishlist", JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => {
      if (prev.includes(productId)) {
        toast.info("Removed successfully from your wishlist");
        return prev.filter(id => id !== productId);
      } else {
        toast.success("Saved successfully to your wishlist!");
        return [...prev, productId];
      }
    });
  }, []);

  const isInWishlist = useCallback((productId: string) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
    toast.success("Wishlist cleared");
  }, []);

  const totalWishlistItems = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isInWishlist, clearWishlist, totalWishlistItems }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};
