import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ReviewProvider } from "./context/ReviewContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Index from "./pages/Index";
import Products from "./pages/Products";
import Services from "./pages/Services";
import BuildPC from "./pages/BuildPC";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import ProductDetails from "./pages/ProductDetails";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import GlowingNetworkBackground from "./components/GlowingNetworkBackground";

const queryClient = new QueryClient();

const AuthOverlay = () => {
  const { isLoggedIn, hasSkippedLogin, isLoading } = useAuth();
  const location = useLocation();
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // If user is logged in, skipped login, session is loading, or on /login page, do not pop up
    if (isLoading || isLoggedIn || hasSkippedLogin || location.pathname === "/login") {
      setShowPopup(false);
      return;
    }

    // Trigger login popup after 12 seconds (within 10-15 seconds requirement)
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, 12000);

    return () => clearTimeout(timer);
  }, [isLoading, isLoggedIn, hasSkippedLogin, location.pathname]);

  if (!showPopup || isLoading || isLoggedIn || hasSkippedLogin || location.pathname === "/login") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm overflow-y-auto p-2 sm:p-6 flex items-center justify-center animate-fade-in modal-scrollable">
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto my-auto rounded-3xl">
        <Login />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ProductProvider>
          <ReviewProvider>
          <CartProvider>
            <WishlistProvider>
              <Sonner />
              <BrowserRouter>
                <div className="min-h-screen min-h-dvh flex flex-col w-full overflow-x-hidden relative">
                  <GlowingNetworkBackground />
                  <AuthOverlay />
                  <Navbar />
                  <main className="flex-1 flex flex-col w-full">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/products" element={<Products />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/build-pc" element={<BuildPC />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/checkout" element={<Checkout />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/product/:id" element={<ProductDetails />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </BrowserRouter>
            </WishlistProvider>
          </CartProvider>
          </ReviewProvider>
        </ProductProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;