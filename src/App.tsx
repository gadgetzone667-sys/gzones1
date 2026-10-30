import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { CartProvider } from "./context/CartContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProductProvider } from "./context/ProductContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ReviewProvider } from "./context/ReviewContext";
import { isAdminSubdomain } from "./lib/domain";
import Navbar from "./components/Navbar";
import { AdminNavbar } from "./components/AdminNavbar";
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
import AdminLogin from "./pages/AdminLogin";
import AdminRedirect from "./pages/AdminRedirect";
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

/**
 * Dedicated portal view when accessed via https://admin.gzones.in/
 */
const AdminSubdomainPortal = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen min-h-dvh flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-wider">CONNECTING TO ADMIN GATEWAY...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh flex flex-col w-full overflow-x-hidden bg-slate-950 text-slate-100">
      <AdminNavbar />
      <main className="flex-1 flex flex-col w-full">
        <Routes>
          <Route path="/" element={user?.isAdmin ? <Admin /> : <AdminLogin />} />
          <Route path="/admin" element={user?.isAdmin ? <Admin /> : <AdminLogin />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="border-t border-purple-500/20 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GadgetZone Management Gateway • https://admin.gzones.in</span>
          <span>Restricted Administrative Access Only</span>
        </div>
      </footer>
    </div>
  );
};

const App = () => {
  const onAdminDomain = isAdminSubdomain();
  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
  const isDirectAdmin =
    typeof window !== "undefined" &&
    (window.location.search.includes("direct=1") || window.location.search.includes("mode=direct"));

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ProductProvider>
            <ReviewProvider>
              <CartProvider>
                <WishlistProvider>
                  <Sonner />
                  <BrowserRouter>
                    {onAdminDomain ? (
                      <AdminSubdomainPortal />
                    ) : (
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
                            {/* In local dev keep /admin directly accessible, in production redirect to admin.gzones.in */}
                            <Route
                              path="/admin"
                              element={isLocalDev || isDirectAdmin ? <Admin /> : <AdminRedirect />}
                            />
                            <Route
                              path="/admin/login"
                              element={isLocalDev ? <AdminLogin /> : <AdminRedirect loginOnly />}
                            />
                            <Route path="/login" element={<Login />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                        <Footer />
                      </div>
                    )}
                  </BrowserRouter>
                </WishlistProvider>
              </CartProvider>
            </ReviewProvider>
          </ProductProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;