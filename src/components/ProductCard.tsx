import { Star, ShoppingCart, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import type { Product } from "../data/products";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ProductCard = ({ product }: { product: Product }) => {
  const { addItem } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const handleAdd = () => {
    addItem({ id: product.id, name: product.name, price: product.price, type: "product", image: product.image });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="group bg-card/90 backdrop-blur-md rounded-2xl border border-border/80 overflow-hidden card-hover shimmer-card relative transition-all duration-300 hover:border-amber-400/50 hover:shadow-[0_16px_36px_-10px_rgba(245,158,11,0.25),0_0_20px_rgba(56,189,248,0.12)]"
    >
      {/* Category / Performance Badge */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-background/80 backdrop-blur-md border border-white/10 text-amber-400 group-hover:border-amber-400/40 group-hover:bg-amber-500/15 group-hover:shadow-[0_0_10px_rgba(245,158,11,0.3)] transition-all">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
          {product.category}
        </span>
      </div>

      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
        className="absolute top-3 right-3 z-10 p-2 bg-background/80 hover:bg-background backdrop-blur-md rounded-full text-foreground shadow-sm transition-all duration-200 hover:scale-110 active:scale-90 hover:shadow-[0_0_12px_rgba(244,63,94,0.35)]"
        title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`h-4 w-4 transition-colors ${isInWishlist(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground hover:text-rose-400'}`} />
      </button>

      <Link to={`/product/${product.id}`} className="block aspect-square w-full bg-secondary/60 overflow-hidden relative group/img">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-[0.5deg]" 
          />
        ) : (
          <div className="w-full h-full bg-muted/60 flex items-center justify-center">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{product.category}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </Link>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider truncate">{product.brand}</p>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-foreground">{product.rating}</span>
            <span className="text-[10px] text-muted-foreground">({product.reviewCount})</span>
          </div>
        </div>

        <Link to={`/product/${product.id}`} className="block">
          <h3 className="font-display font-bold text-xs sm:text-sm leading-snug mb-3 line-clamp-2 text-foreground group-hover:text-amber-400 transition-colors duration-200">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex flex-col">
            <span className="font-display font-extrabold text-base sm:text-lg text-foreground group-hover:text-amber-300 transition-colors">
              ₹{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-[11px] text-muted-foreground line-through">
                ₹{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-[0_0_15px_rgba(249,115,22,0.4)] shadow-sm flex items-center justify-center"
            aria-label="Add to cart"
            title="Add to Cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
