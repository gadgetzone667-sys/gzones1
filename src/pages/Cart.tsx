import { useState, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { useProducts } from "../context/ProductContext";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, RefreshCw, PlusCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ProductCard from "../components/ProductCard";

const Cart = () => {
  const { user, isLoggedIn } = useAuth();
  const { items, removeItem, updateQuantity, totalPrice, clearCart, addItem } = useCart();
  const { products } = useProducts();
  const [shuffleIndex, setShuffleIndex] = useState(0);
  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (!isLoggedIn || !user) {
      toast.info("Please sign in to proceed with checkout.");
      navigate("/login?redirect=/checkout");
      return;
    }
    navigate("/checkout");
  };

  // Dynamic recommendations algorithm based on current cart items & shuffle seed
  const suggestedProducts = useMemo(() => {
    const cartProductIds = new Set(items.map(i => i.id));
    const available = products.filter(p => !cartProductIds.has(p.id));

    if (available.length === 0) return [];

    // Extract cart brands & categories if cart is not empty
    const cartCategories = new Set(items.map(i => i.type?.toLowerCase()).filter(Boolean));
    const cartNames = items.map(i => i.name.toLowerCase());

    // Rank available products by similarity / complementarity
    const ranked = available.map(p => {
      let score = Math.random() * 2;
      const cat = p.category.toLowerCase();
      const brand = p.brand.toLowerCase();

      if (cartCategories.has(cat)) score += 3;
      if (cartNames.some(n => n.includes(brand))) score += 4;

      return { product: p, score };
    });

    // Sort by dynamic score
    ranked.sort((a, b) => b.score - a.score);

    // Apply offset for interactive rotation/refresh
    const offset = (shuffleIndex * 4) % ranked.length;
    const rotated = [...ranked.slice(offset), ...ranked.slice(0, offset)];
    return rotated.slice(0, 4).map(r => r.product);
  }, [items, products, shuffleIndex]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 space-y-12">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 bg-card rounded-2xl border border-border p-8 max-w-2xl mx-auto shadow-lg">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products or build a custom PC to get started.</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all"
            >
              Browse Products <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Suggested Products for Empty Cart */}
          <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-amber-400" />
              <h3 className="font-display text-xl font-bold">Trending Hardware Suggestions</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {products.slice(0, 4).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 space-y-12">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold mb-8">Shopping Cart</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-5 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-5 shadow-sm"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-secondary flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{item.type}</span>
                  )}
                </div>
                <div className="flex-1 min-w-[150px]">
                  <h3 className="font-display font-semibold text-sm truncate">{item.name}</h3>
                  <p className="text-muted-foreground text-sm font-medium">₹{item.price.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-1.5 rounded-md bg-secondary hover:bg-accent transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="font-display font-bold w-24 text-right">₹{(item.price * item.quantity).toLocaleString()}</p>
                <button
                  onClick={() => { removeItem(item.id); toast.info("Item removed"); }}
                  className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                  title="Remove Item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div>
            <div className="bg-card rounded-xl border border-border p-6 sticky top-24 shadow-lg">
              <h3 className="font-display text-lg font-bold mb-4">Order Summary</h3>
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium text-emerald-400">FREE</span>
                </div>
                <div className="border-t border-border pt-3 flex justify-between">
                  <span className="font-display font-bold">Total</span>
                  <span className="font-display font-bold text-lg text-sky-400">
                    ₹{totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleProceedToCheckout}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-sm shadow-md hover:shadow-sky-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all mb-2 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              {!isLoggedIn && (
                <p className="text-[11px] text-muted-foreground text-center mb-3">
                  You will be prompted to sign in before finalizing your order.
                </p>
              )}
              <button
                onClick={() => { clearCart(); toast.info("Cart cleared"); }}
                className="w-full px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <div className="pt-10 border-t border-border/60">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-400" />
                <h3 className="font-display text-xl font-bold">Recommended For You</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShuffleIndex(prev => prev + 1)}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  title="Shuffle recommendations"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Shuffle</span>
                </button>
                <Link to="/products" className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
                  View All <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {suggestedProducts.map(product => (
                <div key={product.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col justify-between hover:border-sky-500/40 transition-all shadow-sm">
                  <Link to={`/product/${product.id}`} className="aspect-square bg-secondary overflow-hidden block relative">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <span className="text-xs text-muted-foreground uppercase">{product.category}</span>
                      </div>
                    )}
                  </Link>
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{product.brand}</p>
                      <Link to={`/product/${product.id}`} className="hover:underline">
                        <h4 className="font-display text-xs sm:text-sm font-bold truncate mb-2">{product.name}</h4>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <span className="font-display font-black text-sm text-sky-400">₹{product.price.toLocaleString()}</span>
                      <button
                        onClick={() => {
                          addItem({ id: product.id, name: product.name, price: product.price, type: "product" });
                          toast.success(`${product.name} added to cart`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500 hover:text-white transition-all text-xs font-bold"
                      >
                        <PlusCircle className="h-3.5 w-3.5" /> Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
