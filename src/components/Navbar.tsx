import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X, Monitor, User, Heart, Package } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useWishlist } from "../context/WishlistContext";
import { motion, AnimatePresence } from "framer-motion";
import gadgetZoneLogo from "../assets/Gadgetzone.png";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/services", label: "Services" },
  { to: "/build-pc", label: "Build PC" },
  { to: "/contact", label: "Contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const { products } = useProducts();
  const { totalWishlistItems } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement | null>(null);

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    closeSearch();
    if (!user) {
      toast.info("Please log in to access your shopping cart.");
      navigate("/login?redirect=/cart");
    } else {
      navigate("/cart");
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
  };

  // Close search and menus on route/location change
  useEffect(() => {
    closeSearch();
    setUserMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // Close search on Escape key or clicking outside the navbar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeSearch();
        setUserMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeSearch();
        setUserMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav ref={navRef} className="fixed top-0 left-0 right-0 z-50 glass border-b border-border navbar-shadow">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeSearch}
            className="group flex items-center gap-2 sm:gap-2.5 transition-transform duration-300 hover:scale-105 shrink-0 mr-2 sm:mr-6 lg:mr-10"
          >
            <img
              src={gadgetZoneLogo}
              alt="GADGET ZONE Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 object-contain shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]"
            />
            <span className="font-display text-base sm:text-lg lg:text-xl font-black tracking-wider uppercase flex items-center gap-1 sm:gap-1.5 drop-shadow-sm group-hover:drop-shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all whitespace-nowrap">
              <span className="text-sky-400 group-hover:text-sky-300 transition-colors">GADGET</span>
              <span className="text-orange-500 group-hover:text-orange-400 transition-colors">ZONE</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2.5 ml-2 lg:ml-6 flex-1 whitespace-nowrap">
            {[...navLinks, ...(user?.isAdmin ? [{ to: "/admin", label: "Admin" }] : [])].map(link => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={closeSearch}
                  className={`relative px-3 lg:px-4 py-1.5 rounded-xl text-xs lg:text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                    isActive
                      ? "text-sky-400 bg-sky-500/10 border border-sky-500/30 shadow-[0_0_14px_rgba(56,189,248,0.25)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/10 hover:shadow-[0_0_12px_rgba(255,255,255,0.08)] hover:scale-[1.03]"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavbarIndicator"
                      className="absolute bottom-0 left-2.5 right-2.5 h-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-full shadow-[0_0_8px_#38bdf8]"
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* User Display */}
            {user ? (
              <div className="relative flex items-center gap-1.5 sm:gap-2 z-50 shrink-0">
                <span className="text-xs lg:text-sm font-medium hidden lg:inline-block text-muted-foreground whitespace-nowrap">
                  {user.email.split('@')[0]}
                </span>
                <button 
                  onClick={() => {
                    closeSearch();
                    setUserMenuOpen(!userMenuOpen);
                  }} 
                  className="p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-400 hover:shadow-[0_0_14px_rgba(56,189,248,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 relative shrink-0" 
                  title="Account"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 hover:rotate-6" />
                </button>

                {/* Dropdown Box */}
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-2xl shadow-xl py-2 flex flex-col overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-border/50 bg-muted/20">
                        <p className="text-sm font-bold truncate text-foreground">{user.email.split('@')[0]}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="p-2 space-y-1">
                        <Link 
                          to="/orders" 
                          onClick={() => {
                            closeSearch();
                            setUserMenuOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          <Package className="h-4 w-4" /> My Orders
                        </Link>
                        <button 
                          onClick={() => {
                            logout();
                            closeSearch();
                            setUserMenuOpen(false);
                          }} 
                          className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                          Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={closeSearch}
                className="p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-400 hover:shadow-[0_0_14px_rgba(56,189,248,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
                title="Login"
              >
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            )}

            <button
              onClick={() => {
                setUserMenuOpen(false);
                setSearchOpen(!searchOpen);
              }}
              className="p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-400 hover:shadow-[0_0_14px_rgba(56,189,248,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
              aria-label="Search"
            >
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <Link
              to="/wishlist"
              onClick={closeSearch}
              className="group relative p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-destructive/30 hover:bg-destructive/15 hover:text-destructive hover:shadow-[0_0_14px_rgba(239,68,68,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
              title="Wishlist"
            >
              <Heart className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:scale-110" />
              {totalWishlistItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  {totalWishlistItems}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={handleCartClick}
              className="group relative p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-primary/30 hover:bg-primary/15 hover:text-primary hover:shadow-[0_0_14px_rgba(56,189,248,0.35)] hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
              title="Cart"
            >
              <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 group-hover:scale-110" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                closeSearch();
                setMobileOpen(!mobileOpen);
              }}
              className="md:hidden p-1.5 sm:p-2 rounded-xl border border-transparent hover:border-sky-500/30 hover:bg-sky-500/15 hover:text-sky-400 hover:shadow-[0_0_14px_rgba(56,189,248,0.3)] hover:scale-110 active:scale-95 transition-all duration-200 shrink-0"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4 sm:h-5 sm:w-5" /> : <Menu className="h-4 w-4 sm:h-5 sm:w-5" />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-visible pb-4"
            >
              <div className="relative">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="Search products, brands, or categories... (Press Esc to exit)"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                    autoFocus
                  />
                  <button
                    onClick={closeSearch}
                    className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Close Search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                {searchQuery.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden max-h-[60vh] overflow-y-auto z-50">
                    {(() => {
                      const results = products.filter(p => 
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.brand.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      
                      if (results.length === 0) {
                        return <div className="p-6 text-center text-sm font-medium text-muted-foreground bg-muted/20">No products found matching "{searchQuery}"</div>;
                      }
                      
                      return results.map(p => (
                        <Link 
                           key={p.id} 
                           to={`/product/${p.id}`} 
                           onClick={() => { 
                             setSearchOpen(false); 
                             setSearchQuery(""); 
                           }}
                           className="flex items-center gap-4 p-3 hover:bg-muted/50 border-b border-border/50 last:border-0 transition-colors"
                        >
                          <div className="h-12 w-12 bg-secondary rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-border/50">
                             {p.image ? (
                               <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                             ) : (
                               <Monitor className="h-5 w-5 text-muted-foreground" />
                             )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground truncate uppercase tracking-wider">{p.category} • {p.brand}</p>
                          </div>
                          <span className="text-sm font-black text-primary">₹{p.price.toLocaleString()}</span>
                        </Link>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="md:hidden overflow-hidden border-t border-border bg-background"
          >
            <div className="px-4 py-4 space-y-1 bg-background/95 backdrop-blur-lg">
              {[...navLinks, ...(user?.isAdmin ? [{ to: "/admin", label: "Admin" }] : [])].map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    location.pathname === link.to
                      ? "bg-sky-500/20 text-sky-400 border border-sky-500/40 shadow-[0_0_12px_rgba(56,189,248,0.3)]"
                      : "text-foreground hover:text-sky-400 hover:bg-sky-500/10 hover:translate-x-1.5 hover:shadow-[0_0_10px_rgba(56,189,248,0.2)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
