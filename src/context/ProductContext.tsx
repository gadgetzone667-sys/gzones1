import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type Product, products as initialProducts } from "../data/products";
import { useAuth } from "./AuthContext";

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  refetch: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Helper: convert MongoDB doc (_id) to our Product interface (id)
function toProduct(doc: Record<string, unknown>): Product {
  return {
    id: String(doc._id || doc.id || ""),
    name: doc.name as string,
    category: doc.category as string,
    price: doc.price as number,
    originalPrice: doc.originalPrice as number | undefined,
    image: (doc.image as string) || "",
    rating: (doc.rating as number) ?? 0,
    reviewCount: (doc.reviewCount as number) ?? 0,
    brand: (doc.brand as string) || "",
    description: (doc.description as string) || "",
    stock: (doc.stock as number) ?? 0,
    featured: (doc.featured as boolean) ?? false,
    specs: doc.specs as Record<string, string> | undefined,
  };
}

export function ProductProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data.map(toProduct));
      } else {
        setProducts(initialProducts);
      }
    } catch (err) {
      console.warn("ProductContext: Backend server unavailable, falling back to static data", err);
      setProducts(initialProducts);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const addProduct = async (product: Omit<Product, "id">) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(product),
    });
    if (!res.ok) throw new Error("Failed to add product");
    await fetchProducts();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update product");
    setProducts(prev =>
      prev.map(p => (p.id === id ? { ...p, ...updates } : p))
    );
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete product");
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <ProductContext.Provider value={{
      products,
      isLoading,
      updateProduct,
      deleteProduct,
      addProduct,
      refetch: fetchProducts,
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
