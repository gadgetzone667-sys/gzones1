import { useRef, useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Zap,
  Shield,
  Truck,
  Star,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Quote,
  Flame,
  Gauge
} from "lucide-react";
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

  // Triple the array to provide an uninterrupted, seamless infinite loop
  const sliderProducts = [
    ...displayProducts,
    ...displayProducts,
    ...displayProducts,
  ];

  const sliderReviews = reviews.length > 0 ? [...reviews, ...reviews, ...reviews] : [];

  // ==========================================
  // FEATURED PRODUCTS SLIDER STATE & LOGIC
  // ==========================================
  const productsRef = useRef<HTMLDivElement | null>(null);
  const [isProductsHovered, setIsProductsHovered] = useState(false);
  const [sliderSpeed, setSliderSpeed] = useState<number>(2.8); // Fast, energetic default speed
  const [isDraggingProducts, setIsDraggingProducts] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);
  const currentScrollRef = useRef(0);

  // High-performance requestAnimationFrame infinite scroll with seamless wrap-around
  useEffect(() => {
    let animId: number;
    const el = productsRef.current;
    if (!el) return;

    const scrollStep = () => {
      if (productsRef.current && !isProductsHovered && !isDraggingProducts) {
        currentScrollRef.current += sliderSpeed;

        const totalWidth = productsRef.current.scrollWidth;
        const oneThird = totalWidth / 3;

        // When past the second set, subtract one set seamlessly (100% invisible reset)
        if (oneThird > 0 && currentScrollRef.current >= oneThird * 2) {
          currentScrollRef.current -= oneThird;
        }

        productsRef.current.scrollLeft = currentScrollRef.current;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [isProductsHovered, isDraggingProducts, sliderSpeed, sliderProducts.length]);

  // Mouse Drag-to-Scroll for Featured Products
  const handleProductMouseDown = (e: React.MouseEvent) => {
    if (!productsRef.current) return;
    setIsDraggingProducts(true);
    dragStartX.current = e.pageX - productsRef.current.offsetLeft;
    dragScrollLeft.current = productsRef.current.scrollLeft;
  };

  const handleProductMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingProducts || !productsRef.current) return;
    e.preventDefault();
    const x = e.pageX - productsRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.5;
    productsRef.current.scrollLeft = dragScrollLeft.current - walk;
    currentScrollRef.current = productsRef.current.scrollLeft;
  };

  const handleProductMouseUp = () => {
    setIsDraggingProducts(false);
  };

  const scrollProducts = useCallback((direction: "left" | "right") => {
    if (!productsRef.current) return;
    const delta = direction === "left" ? -320 : 320;
    currentScrollRef.current += delta;
    productsRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }, []);

  // ==========================================
  // REVIEWS SLIDER STATE & LOGIC
  // ==========================================
  const reviewsRef = useRef<HTMLDivElement | null>(null);
  const [isReviewsHovered, setIsReviewsHovered] = useState(false);
  const [isDraggingReviews, setIsDraggingReviews] = useState(false);
  const reviewDragStartX = useRef(0);
  const reviewDragScrollLeft = useRef(0);
  const reviewScrollRef = useRef(0);

  useEffect(() => {
    let animId: number;
    const el = reviewsRef.current;
    if (!el) return;

    const scrollStep = () => {
      if (reviewsRef.current && !isReviewsHovered && !isDraggingReviews) {
        reviewScrollRef.current += 1.4;
        const totalWidth = reviewsRef.current.scrollWidth;
        const oneThird = totalWidth / 3;

        if (oneThird > 0 && reviewScrollRef.current >= oneThird * 2) {
          reviewScrollRef.current -= oneThird;
        }

        reviewsRef.current.scrollLeft = reviewScrollRef.current;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [isReviewsHovered, isDraggingReviews, sliderReviews.length]);

  const handleReviewMouseDown = (e: React.MouseEvent) => {
    if (!reviewsRef.current) return;
    setIsDraggingReviews(true);
    reviewDragStartX.current = e.pageX - reviewsRef.current.offsetLeft;
    reviewDragScrollLeft.current = reviewsRef.current.scrollLeft;
  };

  const handleReviewMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingReviews || !reviewsRef.current) return;
    e.preventDefault();
    const x = e.pageX - reviewsRef.current.offsetLeft;
    const walk = (x - reviewDragStartX.current) * 1.5;
    reviewsRef.current.scrollLeft = reviewDragScrollLeft.current - walk;
    reviewScrollRef.current = reviewsRef.current.scrollLeft;
  };

  const scrollReviews = (direction: "left" | "right") => {
    if (!reviewsRef.current) return;
    const delta = direction === "left" ? -340 : 340;
    reviewScrollRef.current += delta;
    reviewsRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen min-h-dvh pt-20 pb-12 space-y-8 w-full px-3 sm:px-6 lg:px-10 xl:px-14">
      {/* SECTION 1: BUILD YOUR DREAM MACHINE (HERO) */}
      <section className="relative overflow-hidden section-highlight p-5 sm:p-8 md:p-10 lg:p-12 border-sky-500/30 w-full min-w-0 shadow-[0_20px_50px_rgba(14,165,233,0.15)]">
        <div className="absolute -right-20 -top-20 w-72 sm:w-96 h-72 sm:h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-ring" />
        <div className="absolute -left-20 -bottom-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none animate-pulse-ring" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center relative z-10 w-full min-w-0">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center min-w-0">
            <motion.div {...fadeUp}>
              <span className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-[11px] sm:text-xs font-black uppercase tracking-widest mb-4 shadow-sm shadow-sky-500/20 hover:scale-105 transition-transform">
                <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '6s' }} /> Dreams Come True
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp}
              transition={{ delay: 0.1 }}
              className="font-display hero-title text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4"
            >
              Build Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-400 to-orange-400 drop-shadow-md">
                Dream Machine
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp}
              transition={{ delay: 0.2 }}
              className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-xl mb-6 leading-relaxed"
            >
              Premium PC components, expert assembly services, and custom configurations. Everything you need under one roof.
            </motion.p>

            <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex flex-wrap gap-3 sm:gap-4">
              <Link
                to="/products"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/25 hover:shadow-sky-500/50 hover:scale-[1.04] active:scale-[0.98] transition-all flex-1 sm:flex-initial"
              >
                Shop Now <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/build-pc"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl border border-sky-500/40 bg-sky-500/5 text-foreground font-bold text-xs sm:text-sm hover:bg-sky-500/20 hover:border-sky-400 hover:scale-[1.04] active:scale-[0.98] transition-all flex-1 sm:flex-initial shadow-sm"
              >
                Build Your PC
              </Link>
            </motion.div>
          </div>

          {/* Right Column: Entry Video */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-5 w-full flex items-center justify-center min-w-0"
          >
            <div className="relative w-full aspect-video sm:aspect-[16/9] lg:aspect-[4/3] xl:aspect-[16/9] rounded-2xl overflow-hidden border border-sky-500/40 shadow-2xl shadow-sky-500/30 bg-slate-950/80 group transition-all duration-500 hover:shadow-sky-500/50 hover:border-sky-400">
              <video
                src={entryVideo}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover rounded-2xl transition-transform duration-700 ease-out group-hover:scale-105"
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

      {/* SECTION 2: FEATURED PRODUCTS (⚡ TOP HARDWARE) */}
      <section className="section-highlight p-5 sm:p-6 md:p-8 border-amber-500/30 relative overflow-hidden shadow-[0_20px_50px_rgba(245,158,11,0.12)]">
        {/* Ambient Glows */}
        <div className="absolute -top-32 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-5 gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform cursor-default">
                <Flame className="h-3.5 w-3.5 text-amber-400 animate-bounce" />
                ⚡ TOP HARDWARE
              </span>

              {/* Live Speed & Status Indicator */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] text-slate-300">
                <Gauge className="h-3 w-3 text-amber-400" />
                <span>
                  {isProductsHovered ? "Paused on hover" : `Speed: ${sliderSpeed}x`}
                </span>
              </div>

              {/* Speed Preset Switcher */}
              <div className="hidden sm:inline-flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-lg p-0.5 text-[10px]">
                <button
                  onClick={() => setSliderSpeed(1.6)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    sliderSpeed === 1.6
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Smooth Speed"
                >
                  1.6x
                </button>
                <button
                  onClick={() => setSliderSpeed(2.8)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    sliderSpeed === 2.8
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="High Speed"
                >
                  2.8x
                </button>
                <button
                  onClick={() => setSliderSpeed(4.2)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    sliderSpeed === 4.2
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                  title="Turbo Speed"
                >
                  Turbo
                </button>
              </div>
            </div>

            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Featured Products
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              Handpicked for peak gaming and creator performance • <span className="text-amber-400/90">Hover to pause • Drag to glide</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => scrollProducts("left")}
              className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-white/10 hover:border-amber-400 hover:bg-amber-500/15 text-foreground hover:text-amber-300 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md shadow-amber-500/10"
              title="Scroll Left"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button
              onClick={() => scrollProducts("right")}
              className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-white/10 hover:border-amber-400 hover:bg-amber-500/15 text-foreground hover:text-amber-300 transition-all duration-200 hover:scale-110 active:scale-95 shadow-md shadow-amber-500/10"
              title="Scroll Right"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-bold hover:bg-amber-500/25 hover:border-amber-400 hover:scale-105 active:scale-95 transition-all ml-1 shadow-sm"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Auto Scrolling Track with Drag Support & Mouse Hover */}
        <div
          ref={productsRef}
          onMouseEnter={() => setIsProductsHovered(true)}
          onMouseLeave={() => {
            setIsProductsHovered(false);
            handleProductMouseUp();
          }}
          onMouseDown={handleProductMouseDown}
          onMouseMove={handleProductMouseMove}
          onMouseUp={handleProductMouseUp}
          className={`flex gap-5 overflow-x-auto no-scrollbar py-3 px-1 select-none ${
            isDraggingProducts ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {sliderProducts.map((p: Product, idx: number) => (
            <div
              key={`${p.id}-${idx}`}
              className="w-[220px] sm:w-[260px] shrink-0 transition-transform duration-300"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: SHOP BY CATEGORY */}
      <section className="section-highlight p-6 sm:p-8 md:p-10 border-purple-500/25 shadow-[0_20px_50px_rgba(168,85,247,0.12)]">
        <motion.div {...fadeUp} className="text-center mb-8">
          <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-wider mb-2 shadow-[0_0_15px_rgba(168,85,247,0.25)]">
            EXPLORE CATALOG
          </span>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1">Shop by Category</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Explore our specialized hardware departments</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
          {categories.map((cat: any, i: number) => (
            <motion.div
              key={cat.id}
              {...fadeUp}
              transition={{ delay: i * 0.04 }}
              whileHover={{ y: -6, scale: 1.03 }}
            >
              <Link
                to={`/products?category=${cat.id}`}
                className="block p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-purple-500/60 hover:bg-purple-500/15 transition-all text-center group shadow-md hover:shadow-[0_12px_28px_rgba(168,85,247,0.25)] shimmer-card"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/25 transition-all mx-auto flex items-center justify-center mb-2.5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="font-display font-bold text-xs sm:text-sm mb-1 group-hover:text-purple-300 transition-colors truncate">
                  {cat.name}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground group-hover:text-purple-400/80 transition-colors">
                  {cat.count} items
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 4: FREE SHIPPING & TRUST BADGES */}
      <section className="section-highlight p-5 sm:p-7 md:p-9 border-indigo-500/25 shadow-[0_20px_50px_rgba(99,102,241,0.12)]">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-5 text-center">
          {[
            {
              icon: Truck,
              label: "Free Shipping",
              sub: "Orders over ₹1,000",
              color: "text-sky-400",
              border: "hover:border-sky-500/50 hover:shadow-sky-500/20",
              bg: "group-hover:bg-sky-500/20"
            },
            {
              icon: Shield,
              label: "2-Year Warranty",
              sub: "On all products",
              color: "text-purple-400",
              border: "hover:border-purple-500/50 hover:shadow-purple-500/20",
              bg: "group-hover:bg-purple-500/20"
            },
            {
              icon: Zap,
              label: "Expert Assembly",
              sub: "Professional builds",
              color: "text-amber-400",
              border: "hover:border-amber-500/50 hover:shadow-amber-500/20",
              bg: "group-hover:bg-amber-500/20"
            },
            {
              icon: Star,
              label: "5-Star Reviews",
              sub: "Trusted by 10K+",
              color: "text-emerald-400",
              border: "hover:border-emerald-500/50 hover:shadow-emerald-500/20",
              bg: "group-hover:bg-emerald-500/20"
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              {...fadeUp}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className={`group flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl bg-muted/20 border border-white/5 transition-all duration-300 shadow-md ${item.border}`}
            >
              <div className={`p-3 rounded-2xl bg-background/60 border border-white/10 ${item.color} ${item.bg} group-hover:scale-110 transition-all duration-300`}>
                <item.icon className="h-6 w-6" />
              </div>
              <p className="font-display font-bold text-xs sm:text-sm text-foreground">{item.label}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">{item.sub}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 5: REVIEWS AUTO-SCROLL CAROUSEL */}
      <section className="section-highlight p-5 sm:p-6 md:p-8 border-emerald-500/30 relative overflow-hidden shadow-[0_20px_50px_rgba(16,185,129,0.12)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-2">
              CUSTOMER TESTIMONIALS
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold">What Our Customers Say</h2>
            <p className="text-xs text-muted-foreground">Authentic verified feedback from our PC enthusiasts</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => scrollReviews("left")}
              className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/15 text-foreground hover:text-emerald-300 transition-all hover:scale-110 active:scale-95 shadow-sm"
              title="Scroll Left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollReviews("right")}
              className="p-2 sm:p-2.5 rounded-xl bg-background/80 border border-white/10 hover:border-emerald-400 hover:bg-emerald-500/15 text-foreground hover:text-emerald-300 transition-all hover:scale-110 active:scale-95 shadow-sm"
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
          onMouseLeave={() => {
            setIsReviewsHovered(false);
            setIsDraggingReviews(false);
          }}
          onMouseDown={handleReviewMouseDown}
          onMouseMove={handleReviewMouseMove}
          onMouseUp={() => setIsDraggingReviews(false)}
          className={`flex gap-5 overflow-x-auto no-scrollbar py-3 select-none ${
            isDraggingReviews ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {sliderReviews.map((t: Review, idx: number) => (
            <div
              key={`${t.id}-${idx}`}
              className="w-[290px] sm:w-[340px] shrink-0 p-5 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/50 hover:shadow-[0_12px_28px_rgba(16,185,129,0.2)] transition-all flex flex-col justify-between shimmer-card"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        className={`h-4 w-4 ${
                          j < t.rating ? "fill-amber-400 text-amber-400" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="h-5 w-5 text-emerald-400/40" />
                </div>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed mb-4 italic">
                  "{t.comment}"
                </p>
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
