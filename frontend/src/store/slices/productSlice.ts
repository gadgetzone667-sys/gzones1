import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { Product } from "../../data/products";

// Convert raw API / MongoDB doc (_id) to Product interface (id)
export function toProduct(doc: Record<string, unknown>): Product {
  return {
    id: String(doc._id || doc.id || ""),
    name: (doc.name as string) || "",
    category: (doc.category as string) || "",
    price: (doc.price as number) || 0,
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

export interface ProductState {
  items: Product[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  lastFetched: number | null;
}

const initialState: ProductState = {
  items: [],
  status: "idle",
  error: null,
  lastFetched: null,
};

// Async thunk to fetch products from /api/products exactly ONCE
// The condition callback guarantees single-flight, single-time fetch across all components!
export const fetchProductsOnce = createAsyncThunk(
  "products/fetchOnce",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(toProduct);
      }
      return [];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to fetch products";
      console.warn("Redux productSlice: Could not fetch from /api/products:", message);
      return rejectWithValue(message);
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { products: ProductState };
      // If already fetched or currently loading, skip the network call (Single-fetch guarantee)
      if (state.products.status === "succeeded" || state.products.status === "loading") {
        return false;
      }
      return true;
    },
  }
);

// Explicit force refetch (e.g. after Admin creates/updates a product)
export const forceRefetchProducts = createAsyncThunk(
  "products/forceRefetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map(toProduct);
      }
      return [];
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to refetch products";
      return rejectWithValue(message);
    }
  }
);

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.items = action.payload;
      state.status = "succeeded";
      state.lastFetched = Date.now();
    },
    addProductLocal: (state, action: PayloadAction<Product>) => {
      const exists = state.items.some((p) => p.id === action.payload.id);
      if (!exists) {
        state.items.unshift(action.payload);
      }
    },
    updateProductLocal: (state, action: PayloadAction<{ id: string; updates: Partial<Product> }>) => {
      const index = state.items.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload.updates };
      }
    },
    deleteProductLocal: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProductsOnce
      .addCase(fetchProductsOnce.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProductsOnce.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(fetchProductsOnce.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Failed to load products";
      })
      // forceRefetchProducts
      .addCase(forceRefetchProducts.pending, (state) => {
        state.error = null;
      })
      .addCase(forceRefetchProducts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
        state.lastFetched = Date.now();
      })
      .addCase(forceRefetchProducts.rejected, (state, action) => {
        state.error = (action.payload as string) || "Failed to reload products";
      });
  },
});

export const { setProducts, addProductLocal, updateProductLocal, deleteProductLocal } = productSlice.actions;

export default productSlice.reducer;

