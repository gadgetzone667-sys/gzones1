import { configureStore } from "@reduxjs/toolkit";
import productReducer from "./slices/productSlice";

export const store = configureStore({
  reducer: {
    products: productReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
