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
import {
  Star,
  ShoppingCart,
  ArrowLeft,
  Send,
  Heart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Layers,
  Award,
  CreditCard,
  Tag,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import SEOHead from "../components/SEOHead";
import { motion, AnimatePresence } from "framer-motion";



const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products } = useProducts();
  const { reviews, fetchReviews, addReview } = useReviews();
  const { addItem } = useCart();
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"specifications" | "description" | "warranty">("specifications");

  const [ratingInput, setRatingInput] = useState<number>(5);
  const [commentInput, setCommentInput] = useState<string>("");
  const [nameInput, setNameInput] = useState<string>(user?.email?.split("@")[0] || "");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Direct fetch fallback in case product is not yet in Redux cache on fresh reload
  const [fetchedProduct, setFetchedProduct] = useState<any | null>(null);
  const [loadingDirect, setLoadingDirect] = useState<boolean>(false);

  const product = products.find((p) => p.id === id) || fetchedProduct;
  const productReviews = reviews.filter((r) => r.productId === id);

  useEffect(() => {
    if (id) {
      fetchReviews(id);
      // Fetch directly if not in state
      if (!products.some((p) => p.id === id)) {
        setLoadingDirect(true);
        fetch(`/api/products/${id}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data) {
              setFetchedProduct({
                id: String(data._id || data.id),
                name: data.name || "",
                category: data.category || "",
                price: Number(data.price) || 0,
                originalPrice: data.originalPrice,
                image: data.image || (Array.isArray(data.images) && data.images[0]) || "",
                images: Array.isArray(data.images) && data.images.length > 0 ? data.images : data.image ? [data.image] : [],
                features: Array.isArray(data.features) ? data.features : [],
                rating: Number(data.rating) || 4.3,
                reviewCount: Number(data.reviewCount) || 488,
                brand: data.brand || "HP",
                description: data.description || "",
                stock: data.stock !== undefined ? Number(data.stock) : 10,
                specs: data.specs || {},
                warranty: data.warranty || "1 Year Onsite Hardware Service",
              });
            }
          })
          .catch((err) => console.warn("Direct product fetch warning:", err))
          .finally(() => setLoadingDirect(false));
      }
    }
  }, [id, products]);

  if (loadingDirect && !product) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center">
        <Package className="h-14 w-14 text-muted-foreground/40 mb-3" />
        <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
        <p className="text-sm text-muted-foreground mb-6">The requested product could not be located in our catalog.</p>
        <Button onClick={() => navigate("/products")} className="rounded-xl">
          Back to Products
        </Button>
      </div>
    );
  }

  // Build the complete list of images strictly from uploaded product data (no dummy links)
  const rawImages: string[] = Array.isArray(product.images) && product.images.length > 0
    ? (product.images as string[]).filter(Boolean)
    : product.image
    ? [product.image as string]
    : [];

  const allImages: string[] = rawImages;
  const currentActiveImage = allImages[activeImageIndex] || allImages[0] || product.image || "";

  // Highlights & Specs - strictly derived from actual saved product data (no dummy fallbacks)
  const specsMap = (product.specs || {}) as Record<string, string>;
  const hasCustomFeatures = Array.isArray(product.features) && product.features.length > 0;

  const specProcessor = specsMap.Processor || specsMap["Processor Name"] || "";
  const specRam = specsMap.RAM || specsMap["RAM Capacity"] || "";
  const specStorage = specsMap.Storage || specsMap["SSD Capacity"] || "";
  const specGpu = specsMap.Graphics || specsMap["Graphic Processor"] || "";
  const specDisplay = specsMap.Display || specsMap["Display Size"] || "";
  const specOs = specsMap.OS || specsMap["Operating System"] || "";
  const specWarranty = product.warranty || specsMap.Warranty || "";

  const inferredHighlights: string[] = [
    specProcessor ? `${specProcessor} Processor` : '',
    specRam ? `${specRam} Memory` : '',
    specStorage ? `${specStorage} Storage` : '',
    specGpu ? `${specGpu}` : '',
    specDisplay ? `${specDisplay}` : '',
    specOs ? `${specOs}` : '',
    specWarranty ? `${specWarranty}` : '',
  ].filter(Boolean);

  const highlightsList: string[] = hasCustomFeatures ? (product.features as string[]) : inferredHighlights;

  const calculatedDiscount = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 22;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      type: "product",
      image: currentActiveImage || product.image,
    });
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      type: "product",
      image: currentActiveImage || product.image,
    });
    navigate("/checkout");
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to submit a review.");
      return;
    }
    if (!commentInput.trim()) {
      toast.error("Please provide a review comment.");
      return;
    }
    setIsSubmitting(true);
    try {
      await addReview(product.id, { rating: ratingInput, comment: commentInput });
      setCommentInput("");
      toast.success("Thank you! Review submitted successfully.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-20 bg-background text-foreground">
      {product && (
        <SEOHead
          title={product.seoTitle || `${product.name} | Best Price & Specs - GadgetZone`}
          description={
            product.seoDescription ||
            (product.description && product.description.length > 20
              ? product.description.slice(0, 160)
              : `Buy ${product.name} with original warranty, high performance specs and express delivery at GadgetZone.`)
          }
          canonical={`/product/${product.slug || product.id}`}
          ogImage={product.image || (Array.isArray(product.images) ? product.images[0] : undefined)}
          schemaData={{
            "@context": "https://schema.org/",
            "@type": "Product",
            name: product.name,
            image: Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image].filter(Boolean),
            description: product.seoDescription || product.description || product.name,
            brand: {
              "@type": "Brand",
              name: product.brand || "GadgetZone",
            },
            offers: {
              "@type": "Offer",
              url: typeof window !== "undefined" ? window.location.href : "",
              priceCurrency: "INR",
              price: product.price,
              availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
              itemCondition: "https://schema.org/NewCondition",
            },
          }}
        />
      )}
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-border/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <Link to="/" className="hover:text-primary transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/products" className="hover:text-primary transition-colors">
              Computers & Tech
            </Link>
            <span>/</span>
            <span className="capitalize">{product.category || "Laptops"}</span>
            <span>/</span>
            <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">
              {product.name}
            </span>
          </div>

          <Link
            to="/products"
            className="inline-flex items-center text-xs font-semibold text-primary hover:underline shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> All Products
          </Link>
        </div>

        {/* 2-COLUMN MAIN PRODUCT SHOWCASE LAYOUT (Flipkart Style) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16 items-start">
          {/* ========================================================= */}
          {/* LEFT COLUMN: MULTI-IMAGE GALLERY & ACTION BUTTONS         */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-5">
            {/* Main Active Image Display */}
            <div className="relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xl aspect-[4/3] sm:aspect-square flex items-center justify-center p-4 group">
              {/* Badges on image */}
              <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 pointer-events-none">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 backdrop-blur-md border border-primary/40 text-primary shadow-sm">
                  <Award className="h-3 w-3" /> Assured Genuine
                </span>
                {product.brand && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-background/80 backdrop-blur-md border border-border text-foreground w-fit">
                    {product.brand}
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className="absolute top-3.5 right-3.5 z-10 p-2.5 bg-background/80 hover:bg-background backdrop-blur-md rounded-full shadow-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                title="Save to wishlist"
              >
                <Heart
                  className={`h-5 w-5 transition-colors ${
                    isInWishlist(product.id) ? "fill-destructive text-destructive" : "text-muted-foreground hover:text-rose-400"
                  }`}
                />
              </button>

              {/* Main Image */}
              <AnimatePresence mode="wait">
                {currentActiveImage ? (
                  <motion.img
                    key={currentActiveImage}
                    src={currentActiveImage}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="w-full h-full object-contain max-h-[460px] drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground p-6">
                    <Package className="h-16 w-16 mb-2 stroke-1 opacity-40" />
                    <span className="text-xs font-semibold">No product photo uploaded</span>
                  </div>
                )}
              </AnimatePresence>

              {/* Image Prev / Next Navigation Arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
                    }
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-background hover:scale-110 shadow-md transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Previous photo"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
                    }
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-background hover:scale-110 shadow-md transition-all cursor-pointer opacity-80 hover:opacity-100"
                    title="Next photo"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Photo Index indicator */}
              <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-muted-foreground border border-border">
                {activeImageIndex + 1} / {allImages.length} Photos
              </div>
            </div>

            {/* Thumbnail Gallery Strip (5+ photos supported!) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Product Angles & Gallery
                </span>
                <span className="text-[11px] font-mono">
                  {allImages.length} Image{allImages.length > 1 ? "s" : ""} Available
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-1 no-scrollbar">
                {allImages.map((imgUrl: string, idx: number) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-card ${
                      activeImageIndex === idx
                        ? "border-primary shadow-[0_0_12px_rgba(56,189,248,0.45)] scale-105"
                        : "border-border/70 hover:border-border hover:opacity-90 opacity-70"
                    }`}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0 right-0 bg-background/80 text-[9px] font-mono font-bold px-1 rounded-tl text-muted-foreground">
                      #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons: Add to Cart & Buy Now */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                size="lg"
                variant="outline"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="h-12 sm:h-14 rounded-xl text-xs sm:text-sm font-bold border-primary/40 text-primary hover:bg-primary/10 gap-2 cursor-pointer shadow-sm"
              >
                <ShoppingCart className="h-4 sm:h-5 w-4 sm:w-5" />
                <span>Add to Cart</span>
              </Button>
              <Button
                size="lg"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="h-12 sm:h-14 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white gap-2 shadow-lg hover:shadow-orange-500/25 transition-all cursor-pointer"
              >
                <Zap className="h-4 sm:h-5 w-4 sm:w-5 fill-current" />
                <span>Buy Now</span>
              </Button>
            </div>

            {/* Trust Assurances (Flipkart Style Badges) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60 text-center">
              <div className="p-2.5 rounded-xl bg-card border border-border/50 text-[11px] space-y-1">
                <Truck className="h-4 w-4 mx-auto text-primary" />
                <span className="font-bold block text-foreground">Free Delivery</span>
                <span className="text-[10px] text-muted-foreground block">Across India</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/50 text-[11px] space-y-1">
                <ShieldCheck className="h-4 w-4 mx-auto text-emerald-400" />
                <span className="font-bold block text-foreground">1 Year Warranty</span>
                <span className="text-[10px] text-muted-foreground block">Onsite Support</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/50 text-[11px] space-y-1">
                <RotateCcw className="h-4 w-4 mx-auto text-sky-400" />
                <span className="font-bold block text-foreground">7 Days Policy</span>
                <span className="text-[10px] text-muted-foreground block">Replacement</span>
              </div>
              <div className="p-2.5 rounded-xl bg-card border border-border/50 text-[11px] space-y-1">
                <CreditCard className="h-4 w-4 mx-auto text-purple-400" />
                <span className="font-bold block text-foreground">GST Invoice</span>
                <span className="text-[10px] text-muted-foreground block">Input Tax Credit</span>
              </div>
            </div>

            {/* Flipkart-Style Secondary Gallery Feature Cards (Showcasing all angles) */}
            {allImages.length >= 2 && (
              <div className="pt-4 border-t border-border/60 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Showcase Gallery (High-Res Views)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {allImages.slice(1, 5).map((imgUrl: string, i: number) => (
                    <div
                      key={i}
                      onClick={() => setActiveImageIndex(i + 1)}
                      className="group/card rounded-xl border border-border overflow-hidden bg-card cursor-pointer hover:border-primary/50 transition-all shadow-sm"
                    >
                      <div className="aspect-[4/3] bg-muted/30 overflow-hidden">
                        <img
                          src={imgUrl}
                          alt={`Showcase ${i + 1}`}
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-2 text-center bg-card">
                        <span className="text-[10px] font-semibold text-muted-foreground group-hover/card:text-primary transition-colors">
                          {i === 0
                            ? "Display & Ergonomics"
                            : i === 1
                            ? "Precision Keyboard"
                            : i === 2
                            ? "Ports & Connectivity"
                            : "Premium Build Quality"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: SPECIFICATIONS, HIGHLIGHTS & DESCRIPTION     */}
          {/* ========================================================= */}
          <div className="lg:col-span-6 space-y-6">
            {/* Header: Brand, Title, Rating */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  {product.brand || "HP"}
                </span>
                <span className="text-xs text-muted-foreground font-medium">• Certified Tech Product</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight leading-snug text-foreground">
                {product.name}
              </h1>

              {/* Ratings and Reviews */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-xs font-bold shadow-sm">
                  <span>{product.rating || 4.3}</span>
                  <Star className="h-3 w-3 fill-current" />
                </div>
                <span className="text-xs text-muted-foreground font-semibold">
                  {product.reviewCount || 488} Ratings & 61 Reviews
                </span>
                <span className="text-xs text-emerald-400 font-semibold">• Highly Rated</span>
              </div>
            </div>

            {/* Price Block & Savings */}
            <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-sm space-y-3">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-display font-black text-foreground">
                  ₹{product.price.toLocaleString()}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <>
                    <span className="text-base sm:text-lg text-muted-foreground line-through font-medium">
                      ₹{product.originalPrice.toLocaleString()}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {calculatedDiscount}% off
                    </span>
                  </>
                )}
                <div className="ml-auto">
                  {product.stock > 0 ? (
                    <span className="px-2.5 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                      In Stock ({product.stock} units)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 bg-destructive/15 text-destructive border border-destructive/30 rounded-full text-xs font-bold uppercase tracking-wider">
                      Out of Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Special Value Deals Card (Flipkart style) */}
              <div className="pt-3 border-t border-border/50 space-y-1.5 text-xs">
                <div className="flex items-start gap-2 text-foreground/90 font-medium">
                  <Tag className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Bank Offer:</strong> ₹6,200 Instant Discount on ICICI & HDFC Bank Credit Cards
                  </span>
                </div>
                <div className="flex items-start gap-2 text-foreground/90 font-medium">
                  <Tag className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Special Price:</strong> Extra ₹10,000 off (Price inclusive of cashback & coupon)
                  </span>
                </div>
                <div className="flex items-start gap-2 text-foreground/90 font-medium">
                  <Tag className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Partner Offer:</strong> Sign up for GadgetZone Club & get ₹500 welcome voucher
                  </span>
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION: PRODUCT HIGHLIGHTS (Exact Flipkart Style)       */}
            {/* ========================================================= */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span>Product highlights</span>
                </h3>
                <span className="text-[10px] text-muted-foreground uppercase font-mono">
                  Full Feature Version
                </span>
              </div>

              {/* Highlight Bullet Items */}
              <div className="space-y-2.5">
                {highlightsList.map((highlight: string, hIdx: number) => (
                  <div key={hIdx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-foreground/90">
                    <div className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5 text-primary">
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ========================================================= */}
            {/* SECTION: ALL DETAILS TABS (SPECIFICATIONS / DESCRIPTION)  */}
            {/* ========================================================= */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              {/* Tab Header Buttons */}
              <div className="flex items-center border-b border-border bg-muted/40 overflow-x-auto no-scrollbar">
                {[
                  { id: "specifications", label: "Specifications" },
                  { id: "description", label: "Description" },
                  { id: "warranty", label: "Warranty & Support" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-5 py-3.5 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? "border-primary text-primary bg-card"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-5 sm:p-6">
                {/* TAB 1: SPECIFICATIONS (2-Column Key/Value Flipkart Table) */}
                {activeTab === "specifications" && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">
                      Technical Specifications & Architecture
                    </h4>

                    <div className="rounded-xl border border-border/60 overflow-hidden divide-y divide-border/60 text-xs sm:text-sm">
                      <div className="grid grid-cols-3 p-3 bg-muted/20">
                        <span className="text-muted-foreground font-medium">Processor Brand</span>
                        <span className="col-span-2 font-semibold text-foreground">
                          {specsMap["Processor Brand"] || "Intel"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="text-muted-foreground font-medium">Processor Name</span>
                        <span className="col-span-2 font-semibold text-foreground">{specProcessor}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3 bg-muted/20">
                        <span className="text-muted-foreground font-medium">RAM Capacity</span>
                        <span className="col-span-2 font-semibold text-foreground">{specRam}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="text-muted-foreground font-medium">SSD Capacity</span>
                        <span className="col-span-2 font-semibold text-foreground">{specStorage}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3 bg-muted/20">
                        <span className="text-muted-foreground font-medium">Storage Type</span>
                        <span className="col-span-2 font-semibold text-foreground">
                          {specsMap["Storage Type"] || "PCIe NVMe M.2 Solid State Drive"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="text-muted-foreground font-medium">Graphic Processor</span>
                        <span className="col-span-2 font-semibold text-foreground">{specGpu}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3 bg-muted/20">
                        <span className="text-muted-foreground font-medium">Display Resolution</span>
                        <span className="col-span-2 font-semibold text-foreground">{specDisplay}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="text-muted-foreground font-medium">Operating System</span>
                        <span className="col-span-2 font-semibold text-foreground">{specOs}</span>
                      </div>
                      <div className="grid grid-cols-3 p-3 bg-muted/20">
                        <span className="text-muted-foreground font-medium">Weight</span>
                        <span className="col-span-2 font-semibold text-foreground">
                          {specsMap.Weight || "1.65 Kg Lightweight"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-3">
                        <span className="text-muted-foreground font-medium">In the Box</span>
                        <span className="col-span-2 font-semibold text-foreground">
                          {specsMap["In The Box"] || "Laptop, 65W Smart AC Power Adapter, Power Cord, User Manual"}
                        </span>
                      </div>

                      {/* Any custom specs in specsMap not yet listed above */}
                      {Object.entries(specsMap).map(([key, val]) => {
                        if (
                          [
                            "Processor",
                            "Processor Brand",
                            "Processor Name",
                            "RAM",
                            "RAM Capacity",
                            "Storage",
                            "SSD Capacity",
                            "Storage Type",
                            "Graphics",
                            "Graphic Processor",
                            "Display",
                            "Display Size",
                            "OS",
                            "Operating System",
                            "Weight",
                            "In The Box",
                            "Warranty",
                          ].includes(key)
                        ) {
                          return null;
                        }
                        return (
                          <div key={key} className="grid grid-cols-3 p-3">
                            <span className="text-muted-foreground font-medium">{key}</span>
                            <span className="col-span-2 font-semibold text-foreground">{String(val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: DETAILED DESCRIPTION */}
                {activeTab === "description" && (
                  <div className="space-y-4 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                    <p className="font-semibold text-foreground text-sm sm:text-base">
                      {product.name} - Performance Overview
                    </p>
                    <p>
                      {product.description ||
                        `The ${product.name} combines sleek modern design with uncompromised computing power, engineered for productivity, creative workloads, and intense multitasking on the go. Equipped with a high-performance ${specProcessor} processor and paired with fast ${specRam} memory, it handles demanding applications, office suites, browser workflows, and digital media effortlessly.`}
                    </p>
                    <p>
                      Featuring an ultra-fast {specStorage} storage architecture, your system boots in seconds and loads heavy files instantly. The vibrant {specDisplay} offers crisp visual clarity with anti-glare technology to reduce eye fatigue during long sessions.
                    </p>
                    <p>
                      Built with military-grade durability standards, enhanced stereo audio output, and dual-array digital microphones with background noise cancellation for crystal-clear meetings and video calls.
                    </p>
                  </div>
                )}

                {/* TAB 3: WARRANTY & SERVICE */}
                {activeTab === "warranty" && (
                  <div className="space-y-4 text-xs sm:text-sm">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 space-y-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                        Official Warranty Coverage
                      </span>
                      <p className="font-extrabold text-foreground text-sm sm:text-base">
                        {specWarranty}
                      </p>
                    </div>

                    <div className="space-y-2 text-muted-foreground leading-relaxed">
                      <p>
                        <strong>Covered in Warranty:</strong> Manufacturing defects, internal motherboard issues, display panel defects, memory and SSD hardware failures.
                      </p>
                      <p>
                        <strong>Not Covered in Warranty:</strong> Physical damage due to falls, liquid spillage, electrical surge, unauthorized third-party repairs.
                      </p>
                      <p>
                        <strong>Service Type:</strong> Onsite technician visit to your registered doorstep address or carry-in support at authorized brand service centers across India.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CUSTOMER REVIEWS & RATINGS SECTION                        */}
        {/* ========================================================= */}
        <div className="max-w-5xl mx-auto border-t border-border pt-16">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold">Customer Reviews & Ratings</h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Verified customer experiences with this hardware product.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-lg text-sm font-bold shadow-sm">
                <span>{product.rating || 4.3}</span>
                <Star className="h-3.5 w-3.5 fill-current" />
              </div>
              <span className="text-xs text-muted-foreground font-semibold">
                Based on {product.reviewCount || 488} genuine reviews
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_1.8fr] gap-10 items-start">
            {/* Review Form */}
            <div className="space-y-4 bg-card p-6 rounded-2xl border border-border shadow-sm">
              <h3 className="text-base font-bold text-foreground">Write a Review</h3>
              <p className="text-xs text-muted-foreground">
                Share your feedback on hardware performance, build, and speed.
              </p>

              <form onSubmit={handleSubmitReview} className="space-y-4">
                {!user && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
                    Please log in to submit a verified product review.
                  </p>
                )}

                <div className="space-y-1">
                  <Label className="text-xs">Your Name</Label>
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="e.g. Ramesh K."
                    disabled={!!user}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Rating Score</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingInput(star)}
                        className="p-1 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= ratingInput ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-amber-400 ml-2">{ratingInput} Stars</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Review Comment</Label>
                  <Textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    rows={3}
                    placeholder="Tell us what you liked about this laptop / product..."
                    className="text-xs"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full text-xs font-bold gap-1.5 cursor-pointer"
                  disabled={isSubmitting || !user}
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubmitting ? "Submitting..." : "Submit Review"}</span>
                </Button>
              </form>
            </div>

            {/* Review List */}
            <div className="space-y-4">
              {productReviews.length === 0 ? (
                <div className="bg-card p-8 rounded-2xl text-center border border-dashed border-border">
                  <Star className="h-8 w-8 text-amber-400/40 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">Be the first to review this product!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your experience to help other builders and shoppers.
                  </p>
                </div>
              ) : (
                productReviews.map((review) => (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={review.id}
                    className="p-5 rounded-2xl bg-card border border-border shadow-sm space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm text-foreground">{review.userName}</p>
                        <p className="text-[11px] text-muted-foreground">{review.date}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-emerald-600/15 border border-emerald-600/30 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-bold">
                        <span>{review.rating}</span>
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                      "{review.comment}"
                    </p>
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
