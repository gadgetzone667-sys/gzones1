import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Zap, Shield, Truck, Star, ChevronLeft, ChevronRight, Sparkles, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { categories } from "../data/products";
import { useProducts } from "../context/ProductContext";
import { useReviews } from "../context/ReviewContext";
import ProductCard from "../components/ProductCard";
import type { Product, Review } from "../data/products";
import entryVideo from "../assets/Title card.mp4";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const Index = () => {
  const { products } = useProducts();
  const { reviews } = useReviews();

  const featuredProducts = products.filter((p: Product) => p.featured);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8);
  const sliderProducts = [...displayProducts, ...displayProducts];
  const sliderReviews = reviews.length > 0 ? [...reviews, ...reviews] : [];

  // Refs & Hover states for Featured Products auto-scroll
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isProductsHovered, setIsProductsHovered] = useState(false);

  // Refs & Hover states for Reviews auto-scroll
  const reviewsRef = useRef<HTMLDivElement | null>(null);
  const [isReviewsHovered, setIsReviewsHovered] = useState(false);

  // Ultra-smooth 60FPS requestAnimationFrame auto-scroll for Featured Products
  useEffect(() => {
    let animId: number;
    const scrollStep = () => {
      if (productsRef.current && !isProductsHovered) {
        const { scrollLeft, scrollWidth, clientWidth } = productsRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 2) {
          productsRef.current.scrollLeft = 0;
        } else {
          productsRef.current.scrollLeft += 0.85;
        }
      }
      animId = requestAnimationFrame(scrollStep);
    };
    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [isProductsHovered]);

  // Ultra-smooth 60FPS requestAnimationFrame auto-scroll for Reviews
  useEffect(() => {
    let animId: number;
    const scrollStep = () => {
      if (reviewsRef.current && !isReviewsHovered) {
        const { scrollLeft, scrollWidth, clientWidth } = reviewsRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 2) {
          reviewsRef.current.scrollLeft = 0;
        } else {
          reviewsRef.current.scrollLeft += 0.75;
        }
      }
      animId = requestAnimationFrame(scrollStep);
    };
    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [isReviewsHovered]);

  const scrollProducts = (direction: "left" | "right") => {
    if (!productsRef.current) return;
    const scrollAmount = direction === "left" ? -300 : 300;
    productsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  const scrollReviews = (direction: "left" | "right") => {
    if (!reviewsRef.current) return;
    const scrollAmount = direction === "left" ? -340 : 340;
    reviewsRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen min-h-dvh pt-20 pb-12 space-y-6 w-full px-3 sm:px-6 lg:px-10 xl:px-14">
      {/* SECTION 1: BUILD YOUR DREAM MACHINE (HERO) */}
      <section className="relative overflow-hidden section-highlight p-4 sm:p-8 md:p-10 lg:p-12 border-sky-500/30 w-full min-w-0">
        <div className="absolute -right-20 -top-20 w-72 sm:w-96 h-72 sm:h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center relative z-10 w-full min-w-0">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] sm:text-xs font-black uppercase tracking-widest mb-4 shadow-sm shadow-sky-500/20">
                <Sparkles className="h-3.5 w-3.5" /> Dreams Come True
              </span>
            </motion.div>

            <motion.h1 {...fadeUp} transition={{ delay: 0.1 }} className="font-display hero-title text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
              Build Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-orange-400 drop-shadow-md">
                Dream Machine
              </span>
            </motion.h1>

            <motion.p {...fadeUp} transition={{ delay: 0.2 }} className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mb-6 leading-relaxed">
              Premium PC components, expert assembly services, and custom configurations. Everything you need under one roof.
            </motion.p>

            <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1 sm:flex-initial"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/build-pc"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl border border-sky-500/40 bg-sky-500/5 text-foreground font-bold text-xs sm:text-sm hover:bg-sky-500/15 hover:border-sky-400 transition-all flex-1 sm:flex-initial"
              >
                Build Your PC
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Entry Video Running Continuously & Flexible Aspect Ratio */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-5 w-full flex items-center justify-center min-w-0"
          >
            <div className="relative w-full aspect-video sm:aspect-[16/9] lg:aspect-[4/3] xl:aspect-[16/9] rounded-2xl overflow-hidden border border-sky-500/40 shadow-2xl shadow-sky-500/25 bg-slate-950/80 group">
              <video
                src={entryVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-sky-400 flex items-center justify-between pointer-events-none">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  GADGET ZONE
                </span>
                <span className="text-muted-foreground text-[10px]">4K PERFORMANCE</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: FEATURED PRODUCTS */}
      <section className="section-highlight p-4 sm:p-5 md:p-6 border-amber-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 gap-3">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
              ⚡ TOP HARDWARE
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-extrabold">Featured Products</h2>
            <p className="text-muted-foreground text-[11px] sm:text-xs">Handpicked for peak gaming and creator performance</p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => scrollProducts("left")}
              className="p-1.5 sm:p-2 rounded-full bg-background/60 border border-white/10 hover:border-amber-400/50 hover:bg-amber-500/10 text-foreground transition-all shadow-sm"
              title="Scroll Left"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => scrollProducts("right")}
              className="p-1.5 sm:p-2 rounded-full bg-background/60 border border-white/10 hover:border-amber-400/50 hover:bg-amber-500/10 text-foreground transition-all shadow-sm"
              title="Scroll Right"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-bold hover:bg-amber-500/20 transition-all ml-1"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Auto Scrolling Track */}
        <div
          ref={productsRef}
          onMouseEnter={() => setIsProductsHovered(true)}
          onMouseLeave={() => setIsProductsHovered(false)}
          className="flex gap-4 overflow-x-auto no-scrollbar py-1"
        >
          {sliderProducts.map((p: Product, idx: number) => (
            <div key={`${p.id}-${idx}`} className="w-[210px] sm:w-[245px] shrink-0">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: SHOP BY CATEGORY */}
      <section className="section-highlight p-5 sm:p-6 md:p-8 border-purple-500/20">
        <motion.div {...fadeUp} className="text-center mb-6">
          <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
            EXPLORE CATALOG
          </span>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold mb-1">Shop by Category</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Explore our specialized hardware departments</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((cat: any, i: number) => (
            <motion.div key={cat.id} {...fadeUp} transition={{ delay: i * 0.05 }}>
              <Link
                to={`/products?category=${cat.id}`}
                className="block p-4 rounded-2xl bg-background/40 border border-white/10 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all text-center group shadow-md"
              >
                <p className="font-display font-bold text-xs sm:text-sm mb-1 group-hover:text-purple-400 transition-colors truncate">{cat.name}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground">{cat.count} items</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: FREE SHIPPING & TRUST BADGES */}
      <section className="section-highlight p-4 sm:p-6 md:p-8 border-indigo-500/20">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
          {[
            { icon: Truck, label: "Free Shipping", sub: "Orders over ₹1,000", color: "text-sky-400" },
            { icon: Shield, label: "2-Year Warranty", sub: "On all products", color: "text-purple-400" },
            { icon: Zap, label: "Expert Assembly", sub: "Professional builds", color: "text-amber-400" },
            { icon: Star, label: "5-Star Reviews", sub: "Trusted by 10K+", color: "text-emerald-400" },
          ].map((item, i) => (
            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-muted/20 border border-white/5 hover:border-white/20 transition-colors">
              <div className={`p-2.5 rounded-2xl bg-background/50 border border-white/10 ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <p className="font-display font-bold text-xs sm:text-sm">{item.label}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">{item.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 5: REVIEWS AUTO-SCROLL CAROUSEL */}
      <section className="section-highlight p-5 sm:p-6 md:p-8 border-emerald-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">What Our Customers Say</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollReviews("left")}
              className="p-2 rounded-full bg-background/60 border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-foreground transition-all shadow-sm"
              title="Scroll Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollReviews("right")}
              className="p-2 rounded-full bg-background/60 border border-white/10 hover:border-emerald-400/50 hover:bg-emerald-500/10 text-foreground transition-all shadow-sm"
              title="Scroll Right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Auto Scrolling Track */}
        <div
          ref={reviewsRef}
          onMouseEnter={() => setIsReviewsHovered(true)}
          onMouseLeave={() => setIsReviewsHovered(false)}
          className="flex gap-5 overflow-x-auto no-scrollbar py-2 scroll-smooth"
        >
          {sliderReviews.map((t: Review, idx: number) => (
            <div
              key={`${t.id}-${idx}`}
              className="w-[290px] sm:w-[340px] shrink-0 p-5 rounded-2xl bg-background/50 border border-white/10 hover:border-emerald-500/40 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-4 w-4 ${j < t.rating ? "fill-amber-400 text-amber-400" : "text-border"}`}
                      />
                    ))}
                  </div>
                  <Quote className="h-4 w-4 text-emerald-400/40" />
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-4 italic">"{t.comment}"</p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-xs sm:text-sm text-foreground">{t.userName}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{t.date || "Recent"}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
