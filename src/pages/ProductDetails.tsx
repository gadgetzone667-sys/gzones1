import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useProducts } from "../context/ProductContext";
import { useReviews } from "../context/ReviewContext";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { Star, ShoppingCart, ArrowLeft, Send, Heart } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { reviews, fetchReviews, addReview } = useReviews();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [nameInput, setNameInput] = useState(user?.email?.split('@')[0] || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const product = products.find(p => p.id === id);
  const productReviews = reviews.filter(r => r.productId === id);

  useEffect(() => {
    if (id) fetchReviews(id);
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
        <Button onClick={() => navigate("/products")}>Back to Products</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Please sign in before adding items to your cart.");
      navigate("/login?redirect=/cart");
      return;
    }
    addItem({ id: product.id, name: product.name, price: product.price, type: "product" });
    toast.success(`${product.name} added to cart`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to submit a review.");
      return;
    }
    if (!commentInput.trim()) {
      toast.error("Please provide a comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addReview(product!.id, { rating: ratingInput, comment: commentInput });
      setCommentInput("");
      toast.success("Review submitted successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl 2xl:max-w-7xl">
        
        <Link to="/products" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Link>
        
        {/* Product Highlights Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12 sm:mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="aspect-square max-h-[500px] w-full mx-auto bg-secondary rounded-2xl flex items-center justify-center p-0 overflow-hidden shadow-inner border border-border/50">
            {product.image ? (
               <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground font-medium uppercase tracking-widest text-xs sm:text-sm">{product.category}</span>
               </div>
            )}
          </motion.div>
          
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col justify-center">
            <p className="text-xs sm:text-sm font-bold text-primary uppercase tracking-wider mb-2">{product.brand}</p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-extrabold tracking-tight mb-4">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-4 sm:h-5 w-4 sm:w-5 ${i < Math.floor(product.rating) ? "fill-warning text-warning" : "text-border"}`} />
                ))}
              </div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">({product.reviewCount} user reviews)</span>
            </div>
            
            <div className="mb-6 flex flex-wrap items-baseline gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl font-display font-black">₹{product.price.toLocaleString()}</span>
              {product.originalPrice && <span className="text-lg sm:text-xl text-muted-foreground line-through font-medium">₹{product.originalPrice.toLocaleString()}</span>}
              {product.stock > 0 ? (
                 <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-xs font-bold uppercase tracking-wider ml-auto">In Stock</span>
              ) : (
                 <span className="px-3 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold uppercase tracking-wider ml-auto">Out of Stock</span>
              )}
            </div>
            
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-6 sm:mb-8">{product.description}</p>
            
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-muted/30 rounded-xl border border-border shadow-sm">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider mb-4 text-primary">Technical Specifications</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-xs sm:text-sm">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key}>
                      <p className="text-muted-foreground mb-0.5">{key}</p>
                      <p className="font-semibold text-foreground">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 sm:gap-4">
              <Button size="lg" className="flex-1 h-12 sm:h-14 text-sm sm:text-base font-bold shadow-md hover:shadow-lg transition-all" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5 mr-2 sm:mr-3" /> Add to Cart
              </Button>
              <Button size="lg" variant="outline" className="h-12 sm:h-14 px-4 sm:px-6 border-border hover:bg-muted" onClick={() => toggleWishlist(product.id)} title="Toggle Wishlist">
                <Heart className={`h-5 sm:h-6 w-5 sm:w-6 ${isInWishlist(product.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="max-w-4xl mx-auto border-t border-border pt-16">
          <h2 className="text-3xl font-bold mb-8">Customer Reviews</h2>
          
          <div className="grid md:grid-cols-[1fr_2fr] gap-12">
            
            {/* Review Form */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Write a Review</h3>
              <p className="text-sm text-muted-foreground mb-4">Share your thoughts on this product with others.</p>
              
              <form onSubmit={handleSubmitReview} className="space-y-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
                {!user && (
                  <p className="text-sm text-amber-500 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">Please log in to submit a review.</p>
                )}
                <div className="space-y-2">
                  <Label>Your Name</Label>
                  <Input value={nameInput} onChange={e => setNameInput(e.target.value)} placeholder="John Doe" disabled={!!user} />
                </div>
                
                <div className="space-y-2">
                  <Label>Rating</Label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(star => (
                      <button type="button" key={star} onClick={() => setRatingInput(star)} className="focus:outline-none transition-transform hover:scale-110">
                        <Star className={`h-8 w-8 ${star <= ratingInput ? "fill-warning text-warning" : "text-muted border-border"}`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Review Comment</Label>
                  <Textarea value={commentInput} onChange={e => setCommentInput(e.target.value)} rows={4} placeholder="What did you like or dislike?" />
                </div>
                
                <Button type="submit" className="w-full mt-2" disabled={isSubmitting || !user}>
                  <Send className="h-4 w-4 mr-2" /> {isSubmitting ? "Submitting..." : "Submit Review"}
                </Button>
              </form>
            </div>
            
            {/* Review List */}
            <div className="space-y-6">
              {productReviews.length === 0 ? (
                <div className="bg-muted/30 p-8 rounded-2xl text-center border border-border border-dashed">
                  <p className="text-muted-foreground font-medium">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                productReviews.map(review => (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={review.id} className="p-6 rounded-2xl bg-card border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{review.userName}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex bg-warning/10 px-2 py-1 rounded-full">
                        <span className="text-warning font-bold text-sm flex items-center">
                          {review.rating} <Star className="h-3 w-3 ml-1 fill-warning text-warning" />
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">"{review.comment}"</p>
                  </motion.div>
                ))
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductDetails;
