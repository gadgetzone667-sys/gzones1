import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Product } from "../data/products";
import { useAuth } from "./AuthContext";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  fetchProductsOnce,
  forceRefetchProducts,
  updateProductLocal,
  deleteProductLocal,
  addProductLocal,
  toProduct,
} from "../store/slices/productSlice";

interface ProductContextType {
  products: Product[];
  isLoading: boolean;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, "id">) => Promise<void>;
  refetch: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products.items);
  const status = useAppSelector((state) => state.products.status);
  const isLoading = status === "loading" || status === "idle";
  const { getToken } = useAuth();

  // Fetch products from API exactly once on application start via Redux
  // Zero localStorage or sessionStorage usage - pure Redux state in memory!
  useEffect(() => {
    dispatch(fetchProductsOnce());
  }, [dispatch]);

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
    const created = await res.json();
    if (created && (created._id || created.id)) {
      dispatch(addProductLocal(toProduct(created)));
    } else {
      await dispatch(forceRefetchProducts());
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update product");
    dispatch(updateProductLocal({ id, updates }));
  };

  const deleteProduct = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error("Failed to delete product");
    dispatch(deleteProductLocal(id));
  };

  const refetch = async () => {
    await dispatch(forceRefetchProducts());
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        isLoading,
        updateProduct,
        deleteProduct,
        addProduct,
        refetch,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
}
