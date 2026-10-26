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
    addItem({ id: product.id, name: product.name, price: product.price, type: "product" });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-card rounded-xl border border-border overflow-hidden card-hover relative"
    >
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleWishlist(product.id); }}
        className="absolute top-3 right-3 z-10 p-2 bg-background/80 hover:bg-background backdrop-blur rounded-full text-foreground shadow-sm transition-all"
        title={isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
      </button>

      <Link to={`/product/${product.id}`} className="block aspect-square w-full bg-secondary overflow-hidden hover:opacity-95 transition-opacity relative">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-muted/60 flex items-center justify-center">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{product.category}</span>
          </div>
        )}
      </Link>
      <div className="p-5">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{product.brand}</p>
        <Link to={`/product/${product.id}`} className="hover:underline">
          <h3 className="font-display font-semibold text-sm leading-snug mb-2 line-clamp-2">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1 mb-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(product.rating) ? "fill-warning text-warning" : "text-border"}`} />
          ))}
          <span className="text-xs text-muted-foreground ml-1">({product.reviewCount})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-bold text-lg">₹{product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">₹{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            aria-label="Add to cart"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
