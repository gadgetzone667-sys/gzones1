import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { categories } from "../data/products";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import { Button } from "../components/ui/button";
import SEOHead from "../components/SEOHead";
import { matchesSmartQuery, parseSearchQuery, type ParsedSpecs } from "../lib/smartSearch";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  Cpu,
  HardDrive,
  Database,
  Tag,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const sortOptions = [
  { value: "newest", label: "Newest Arrivals" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Customer Rated" },
];

const ITEMS_PER_PAGE = 12;

const Products = () => {
  const { products, isLoading } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || searchParams.get("search") || "";

  const [search, setSearch] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Sync with searchParams if url changes
  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("search") || "";
    if (q !== search) {
      setSearch(q);
      setCurrentPage(1);
    }
  }, [searchParams]);

  // Handle outside clicks to close autocomplete
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions with debounce
  useEffect(() => {
    const trimmed = search.trim();
    if (!trimmed || trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/suggestions?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 6) : []);
        } else {
          // Fallback client suggestions from product names and brands
          const terms = products
            .filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()) || p.brand.toLowerCase().includes(trimmed.toLowerCase()))
            .map((p) => p.name)
            .slice(0, 5);
          setSuggestions(terms);
        }
      } catch {
        // Fallback
        const terms = products
          .filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()))
          .map((p) => p.name)
          .slice(0, 5);
        setSuggestions(terms);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, products]);

  // Extract structured specs from current query to display active filter pills
  const activeSpecs: ParsedSpecs = useMemo(() => {
    return parseSearchQuery(search);
  }, [search]);

  const availableCategories = useMemo(() => {
    const list = [{ id: "all", name: "All Products" }];
    const seen = new Set(["all"]);

    products.forEach((p) => {
      if (p.category && !seen.has(p.category)) {
        const formatted = p.category
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        list.push({ id: p.category, name: formatted });
        seen.add(p.category);
      }
    });

    if (list.length === 1) {
      categories.forEach((c) => {
        if (!seen.has(c.id)) {
          list.push(c);
          seen.add(c.id);
        }
      });
    }

    return list;
  }, [products]);

  // Multi-condition smart filtering
  const filtered = useMemo(() => {
    let list = [...products];

    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (search.trim()) {
      list = list.filter((p) => matchesSmartQuery(p, search));
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case "newest":
      default:
        // maintain order or sort by date/id
        break;
    }

    return list;
  }, [products, search, selectedCategory, sort]);

  // Reset page to 1 whenever search, category, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, sort]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setShowSuggestions(true);
    if (value.trim()) {
      setSearchParams({ q: value.trim() }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    setSearchParams({ q: suggestion }, { replace: true });
  };

  const clearSearch = () => {
    setSearch("");
    setShowSuggestions(false);
    setSearchParams({}, { replace: true });
  };

  const removeSpec = (specType: "brand" | "ram" | "storage" | "processor") => {
    let newQuery = search;
    if (specType === "brand" && activeSpecs.brand) {
      newQuery = newQuery.replace(new RegExp(`\\b${activeSpecs.brand}\\b`, "i"), "");
    } else if (specType === "ram" && activeSpecs.ram) {
      newQuery = newQuery.replace(new RegExp(`\\b${activeSpecs.ram}(?:\\s*ram)?\\b`, "i"), "");
    } else if (specType === "storage" && activeSpecs.storage) {
      newQuery = newQuery.replace(new RegExp(`\\b${activeSpecs.storage}(?:\\s*(?:ssd|storage))?\\b`, "i"), "");
    } else if (specType === "processor" && activeSpecs.processor) {
      newQuery = newQuery.replace(new RegExp(`\\b${activeSpecs.processor}\\b`, "i"), "");
    }
    newQuery = newQuery.replace(/\s+/g, " ").trim();
    handleSearchChange(newQuery);
  };

  const hasDetectedSpecs = Boolean(
    activeSpecs.brand || activeSpecs.ram || activeSpecs.storage || activeSpecs.processor
  );

  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-16">
      <SEOHead
        title={search ? `Search results for "${search}" | GadgetZone` : "All Products & Computer Hardware | GadgetZone"}
        description="Explore the best deals on custom PCs, Intel and AMD laptops, graphics cards, DDR4/DDR5 RAM, and high-speed NVMe storage. Fast shipping across India."
        canonical="/products"
      />

      <div className="container mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
            All Products
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isLoading
              ? "Scanning hardware catalog..."
              : `${filtered.length} product${filtered.length === 1 ? "" : "s"} found matching your specifications`}
          </p>
        </motion.div>

        {/* Smart Search Bar & Controls */}
        <div className="space-y-3 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input Container with Autocomplete */}
            <div ref={searchContainerRef} className="relative flex-1 min-w-[240px]">
              <div className="relative flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder='Smart Search: e.g. "HP 8GB RAM 500GB storage", "Intel i7 RTX 4060"...'
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-secondary/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary border border-border/60 text-sm shadow-sm transition-all"
                />
                {search && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute top-full left-0 right-0 mt-1.5 bg-card border border-border/80 shadow-2xl rounded-xl overflow-hidden z-50 divide-y divide-border/40 backdrop-blur-xl"
                  >
                    <div className="px-3 py-1.5 bg-muted/40 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-primary" />
                      <span>Search Suggestions</span>
                    </div>
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full text-left px-3.5 py-2.5 text-xs sm:text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-between group"
                      >
                        <span className="truncate">{s}</span>
                        <Search className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-primary transition-opacity" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Sort Selector */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-secondary/80 text-foreground text-sm border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden p-2.5 rounded-xl bg-secondary/80 hover:bg-accent border border-border/60 transition-colors"
              title="Toggle Filters"
            >
              {showFilters ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
            </button>
          </div>

          {/* Recognized Specification Chips */}
          {hasDetectedSpecs && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 pt-1 text-xs"
            >
              <span className="text-muted-foreground font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Recognized Specs:
              </span>
              {activeSpecs.brand && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 font-medium">
                  <Tag className="h-3 w-3" /> Brand: <strong>{activeSpecs.brand}</strong>
                  <button onClick={() => removeSpec("brand")} className="hover:text-white ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeSpecs.ram && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 font-medium">
                  <Database className="h-3 w-3" /> RAM: <strong>{activeSpecs.ram.toUpperCase()}</strong>
                  <button onClick={() => removeSpec("ram")} className="hover:text-white ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeSpecs.storage && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-medium">
                  <HardDrive className="h-3 w-3" /> Storage: <strong>{activeSpecs.storage.toUpperCase()}</strong>
                  <button onClick={() => removeSpec("storage")} className="hover:text-white ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {activeSpecs.processor && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-medium">
                  <Cpu className="h-3 w-3" /> CPU: <strong>{activeSpecs.processor}</strong>
                  <button onClick={() => removeSpec("processor")} className="hover:text-white ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearSearch}
                className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1"
              >
                Reset Search
              </button>
            </motion.div>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Categories Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-56 shrink-0`}>
            <div className="sticky top-24 space-y-1.5 bg-card/60 backdrop-blur md:bg-transparent p-4 md:p-0 rounded-2xl border border-border md:border-none shadow-lg md:shadow-none">
              <h3 className="font-display font-bold text-xs uppercase tracking-wider text-muted-foreground px-3 mb-2">
                Categories
              </h3>
              {availableCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowFilters(false);
                  }}
                  className={`block w-full text-left px-3.5 py-2 rounded-xl text-sm transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground font-bold shadow-md shadow-primary/20 scale-[1.02]"
                      : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Product Grid & Pagination Area */}
          <div className="flex-1 space-y-8">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium">Searching hardware inventory...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-border/80 bg-card/40 p-12 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-secondary/80 flex items-center justify-center mx-auto text-muted-foreground">
                  <Search className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-display font-bold text-lg text-foreground">
                    No hardware found matching "{search}"
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Try searching with fewer specifications, check for typos, or browse by selecting a category on the left.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setSearch("HP 8GB RAM");
                      setSearchParams({ q: "HP 8GB RAM" });
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent text-foreground transition-colors"
                  >
                    Try "HP 8GB RAM"
                  </button>
                  <button
                    onClick={() => {
                      setSearch("500GB SSD");
                      setSearchParams({ q: "500GB SSD" });
                    }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent text-foreground transition-colors"
                  >
                    Try "500GB SSD"
                  </button>
                  <button
                    onClick={clearSearch}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium transition-colors"
                  >
                    View All Products
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 sm:gap-6">
                  {paginatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/60">
                    <p className="text-xs text-muted-foreground">
                      Showing{" "}
                      <span className="font-semibold text-foreground">
                        {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-semibold text-foreground">
                        {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                      </span>{" "}
                      of <span className="font-semibold text-foreground">{filtered.length}</span> products
                    </p>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="h-8 px-2.5 gap-1 text-xs"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" /> Previous
                      </Button>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // Display at most 5 page numbers around the current page
                        if (
                          totalPages > 7 &&
                          Math.abs(page - currentPage) > 2 &&
                          page !== 1 &&
                          page !== totalPages
                        ) {
                          if (Math.abs(page - currentPage) === 3) {
                            return (
                              <span key={page} className="px-1 text-xs text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return null;
                        }

                        return (
                          <Button
                            key={page}
                            size="sm"
                            variant={currentPage === page ? "default" : "outline"}
                            onClick={() => setCurrentPage(page)}
                            className="h-8 w-8 p-0 text-xs font-bold"
                          >
                            {page}
                          </Button>
                        );
                      })}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="h-8 px-2.5 gap-1 text-xs"
                      >
                        Next <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
