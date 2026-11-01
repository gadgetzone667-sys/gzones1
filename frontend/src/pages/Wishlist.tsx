import { motion } from "framer-motion";
import { ShoppingCart, ExternalLink, HeartOff, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useProducts } from "../context/ProductContext";
import { useCart } from "../context/CartContext";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const Wishlist = () => {
  const { wishlistItems, toggleWishlist, clearWishlist } = useWishlist();
  const { products, isLoading } = useProducts();
  const { addItem } = useCart();

  const savedProducts = products.filter(p => wishlistItems.includes(p.id));

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-medium">Fetching your wishlist...</p>
      </div>
    );
  }

  const handleAddToCart = (product: typeof products[0]) => {
    addItem({ id: product.id, name: product.name, price: product.price, type: "product", image: product.image });
    toast.success(`${product.name} added to cart!`);
    toggleWishlist(product.id);
  };

  if (savedProducts.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <HeartOff className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">Your Wishlist is Empty</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          You haven't added any products to your wishlist yet. Explore our hardware and save your favorites for later!
        </p>
        <Link to="/products">
          <Button size="lg" className="rounded-xl px-8 shadow-md">
            Browse Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">My Wishlist</h1>
            <p className="text-muted-foreground font-medium">You have {wishlistItems.length} saved {wishlistItems.length === 1 ? 'item' : 'items'}.</p>
          </div>
          <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-4 md:ml-0" onClick={clearWishlist}>
            <Trash2 className="h-4 w-4 mr-2" /> Clear All
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {savedProducts.map((p, idx) => (
            <motion.div 
               key={p.id}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: idx * 0.05 }}
               className="group flex flex-col bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm hover:shadow-lg transition-all"
            >
              <Link to={`/product/${p.id}`} className="block relative aspect-square bg-secondary/50 p-6 overflow-hidden">
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                   <button 
                     onClick={(e) => {
                       e.preventDefault(); 
                       toggleWishlist(p.id);
                     }}
                     className="bg-background/80 backdrop-blur-md p-2 rounded-full text-destructive shadow-sm hover:scale-110 transition-transform"
                     title="Remove from Wishlist"
                   >
                     <HeartOff className="h-4 w-4" />
                   </button>
                   <div 
                     className="bg-background/80 backdrop-blur-md p-2 rounded-full text-foreground shadow-sm hover:scale-110 transition-transform flex items-center justify-center"
                     title="View Details"
                   >
                     <ExternalLink className="h-4 w-4" />
                   </div>
                </div>

                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-muted rounded-xl flex items-center justify-center font-bold text-muted-foreground tracking-wider uppercase text-xs group-hover:scale-105 transition-transform duration-500">
                    {p.brand}
                  </div>
                )}
              </Link>
              
              <div className="p-5 flex-1 flex flex-col">
                <p className="text-xs text-primary font-bold uppercase tracking-wider mb-1">{p.category}</p>
                <div className="flex-1">
                  <h3 className="font-display font-bold text-lg leading-tight mb-2 line-clamp-2">{p.name}</h3>
                </div>
                
                <div className="flex items-center justify-between mt-4 pb-4 border-b border-border/40">
                  <span className="font-display font-black text-xl">₹{p.price.toLocaleString()}</span>
                  {p.stock <= 0 && <span className="text-xs font-bold text-destructive bg-destructive/10 px-2 py-1 rounded-md">Out of Stock</span>}
                </div>
                
                <div className="pt-4 mt-auto">
                  <Button 
                    className="w-full font-bold shadow-sm" 
                    onClick={() => handleAddToCart(p)}
                    disabled={p.stock <= 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> 
                    Move to Cart
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
