import { useState, useMemo } from "react";
import { categories } from "../data/products";
import { useProducts } from "../context/ProductContext";
import ProductCard from "../components/ProductCard";
import { motion } from "framer-motion";
import { SlidersHorizontal, X } from "lucide-react";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

const Products = () => {
  const { products, isLoading } = useProducts();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sort, setSort] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== "all") list = list.filter(p => p.category === selectedCategory);
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase()));
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "rating": list.sort((a, b) => b.rating - a.rating); break;
    }
    return list;
  }, [products, search, selectedCategory, sort]);

  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 sm:mb-10">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-2">All Products</h1>
          <p className="text-sm sm:text-base text-muted-foreground">{isLoading ? "Loading products..." : `${filtered.length} products available`}</p>
        </motion.div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="px-4 py-2.5 rounded-lg bg-secondary text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden p-2.5 rounded-lg bg-secondary hover:bg-accent transition-colors"
          >
            {showFilters ? <X className="h-5 w-5" /> : <SlidersHorizontal className="h-5 w-5" />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          {/* Sidebar */}
          <aside className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-56 shrink-0`}>
            <div className="sticky top-24 space-y-2 bg-card/60 backdrop-blur md:bg-transparent p-4 md:p-0 rounded-2xl border border-border md:border-none shadow-lg md:shadow-none">
              <h3 className="font-display font-semibold text-sm mb-3">Categories</h3>
              <button
                onClick={() => { setSelectedCategory("all"); setShowFilters(false); }}
                className={`block w-full text-left px-3.5 py-2 rounded-lg text-sm transition-colors ${selectedCategory === "all" ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-secondary text-muted-foreground"}`}
              >
                All Products
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setShowFilters(false); }}
                  className={`block w-full text-left px-3.5 py-2 rounded-lg text-sm transition-colors ${selectedCategory === cat.id ? "bg-primary text-primary-foreground font-semibold" : "hover:bg-secondary text-muted-foreground"}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </aside>

          {/* Grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-4 sm:gap-6">
            {isLoading ? (
              <div className="col-span-full flex flex-col justify-center items-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-muted-foreground font-medium">Fetching hardware selection...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                No products found matching your criteria.
              </div>
            ) : (
              filtered.map(p => <ProductCard key={p.id} product={p} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;
