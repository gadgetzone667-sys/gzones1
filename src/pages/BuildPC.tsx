import { useState, useEffect, useMemo } from "react";
import { useCart } from "../context/CartContext";
import { motion } from "framer-motion";
import { ShoppingCart, AlertTriangle, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { pcComponents as initialPcComponents } from "../data/products";

interface PCComponent {
  id: string;
  category: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
}

const categoryLabels: Record<string, string> = {
  processor: "Processor (CPU)",
  motherboard: "Motherboard",
  ram: "Memory (RAM)",
  storage: "Storage",
  gpu: "Graphics Card (GPU)",
  psu: "Power Supply (PSU)",
  cooling: "CPU Cooler",
  case: "Case",
};

const BuildPC = () => {
  const { addItem } = useCart();
  const [pcComponents, setPcComponents] = useState<Record<string, PCComponent[]>>({});
  const [selections, setSelections] = useState<Record<string, PCComponent | null>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const res = await fetch("/api/components");
        if (!res.ok) throw new Error("Failed to fetch components");
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          setPcComponents(data);
        } else {
          setPcComponents(initialPcComponents);
        }
      } catch (err) {
        console.warn("BuildPC: Backend server offline, falling back to static components", err);
        setPcComponents(initialPcComponents);
      } finally {
        setLoading(false);
      }
    };
    fetchComponents();
  }, []);

  const select = (category: string, id: string) => {
    const component = pcComponents[category]?.find(c => c.id === id) || null;
    setSelections(prev => ({ ...prev, [category]: component }));
  };

  const totalPrice = useMemo(
    () => Object.values(selections).reduce((sum, c) => sum + (c?.price || 0), 0),
    [selections]
  );

  const selectedCount = Object.values(selections).filter(Boolean).length;
  // A build is complete if all 8 categories are selected
  const REQUIRED_CATEGORIES = Object.keys(categoryLabels);
  const isComplete = selectedCount === REQUIRED_CATEGORIES.length;

  const addBuildToCart = () => {
    const parts = Object.values(selections).filter(Boolean) as PCComponent[];
    const name = `Custom Build (${parts.length} parts)`;
    addItem({ id: `build-${Date.now()}`, name, price: totalPrice, type: "build" });
    toast.success("Custom build added to cart!");
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading hardware database...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen min-h-dvh pt-24 pb-16">
      <div className="container mx-auto px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8 sm:mb-12">
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold mb-3">Build Your PC</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
            Select components to build your dream machine. Real-time pricing and compatibility checks.
          </p>
        </motion.div>

        <div className="max-w-4xl 2xl:max-w-5xl mx-auto">
          <div className="space-y-3 sm:space-y-4 mb-8">
            {REQUIRED_CATEGORIES.map((category, i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-4 sm:p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <div className="sm:w-48 shrink-0">
                    <label className="font-display font-semibold text-xs sm:text-sm text-foreground">{categoryLabels[category]}</label>
                  </div>
                  <select
                    value={selections[category]?.id || ""}
                    onChange={e => select(category, e.target.value)}
                    className="flex-1 px-3.5 py-2.5 rounded-lg bg-secondary text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring truncate"
                  >
                    <option value="">Select {categoryLabels[category]}</option>
                    {(pcComponents[category] || []).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} — ₹{c.price.toLocaleString()} ({c.specs})
                      </option>
                    ))}
                  </select>
                  <div className="sm:w-28 text-left sm:text-right font-display font-bold text-xs sm:text-sm text-primary">
                    {selections[category] ? `₹${selections[category]!.price.toLocaleString()}` : "—"}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="sticky bottom-4 z-40 bg-card/95 backdrop-blur rounded-xl border border-border p-4 sm:p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {isComplete ? (
                    <Check className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
                  )}
                  <span className="font-display font-semibold text-sm sm:text-base">
                    {isComplete ? "Build Complete!" : `${selectedCount}/${REQUIRED_CATEGORIES.length} components selected`}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isComplete ? "Your build is ready to order." : "Select all components to complete your build."}
                </p>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-left sm:text-right">
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase font-semibold">Total Price</p>
                  <p className="font-display text-xl sm:text-2xl font-black text-primary">₹{totalPrice.toLocaleString()}</p>
                </div>
                <button
                  onClick={addBuildToCart}
                  disabled={selectedCount === 0}
                  className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuildPC;
