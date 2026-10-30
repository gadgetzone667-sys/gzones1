import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useReviews } from "../context/ReviewContext";
import { services as fallbackServices, pcComponents as fallbackComponents, type Product } from "../data/products";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Navigate } from "react-router-dom";
import { isAdminSubdomain } from "../lib/domain";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  Save,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Wrench,
  Cpu,
  IndianRupee,
  Upload,
  Camera,
  ShieldCheck,
  FileSpreadsheet,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLocalOrders,
  updateLocalOrderStatus,
  deleteLocalOrder,
  downloadOrderExcel,
  downloadAllOrdersExcel,
  type Order,
} from "../lib/orderExport";

interface AdminService {
  id: string;
  name: string;
  price: string;
  description: string;
  icon: string;
  features: string[];
}

interface AdminComponent {
  id: string;
  name: string;
  price: number;
  brand: string;
  specs: string;
  category: string;
}

const statusConfig = {
  Pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  Processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-500/10" },
  Shipped: { icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
  Delivered: { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  Cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
};

const Admin = () => {
  const { user, token } = useAuth();
  const { products, updateProduct, deleteProduct, addProduct } = useProducts();
  const { reviews, fetchReviews, deleteReview } = useReviews();

  const [activeTab, setActiveTab] = useState<
    "products" | "services" | "components" | "orders" | "reviews"
  >("products");

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderStatusFilter !== "all" && order.status !== orderStatusFilter) {
        return false;
      }
      if (orderSearch.trim()) {
        const query = orderSearch.toLowerCase();
        const matchesId = (order._id || "").toLowerCase().includes(query);
        const matchesTracking = (order.trackingId || "").toLowerCase().includes(query);
        const matchesName = (order.shippingInfo?.name || "").toLowerCase().includes(query);
        const matchesPhone = (order.shippingInfo?.phone || "").toLowerCase().includes(query);
        const matchesCity = (order.shippingInfo?.city || "").toLowerCase().includes(query);
        const matchesItems = (order.items || []).some((i) => (i.name || "").toLowerCase().includes(query));
        return matchesId || matchesTracking || matchesName || matchesPhone || matchesCity || matchesItems;
      }
      return true;
    });
  }, [orders, orderStatusFilter, orderSearch]);

  // Products Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ price: string; description: string; image: string }>({
    price: "",
    description: "",
    image: "",
  });
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    image: "",
  });

  const handleImageFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onSuccess: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file size should be less than 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onSuccess(result);
        toast.success("Photo uploaded successfully!");
      }
    };
    reader.readAsDataURL(file);
  };

  // Services Edit State
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({ name: "", price: "", description: "" });
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({ name: "", price: "", description: "", icon: "Wrench" });

  // Components Edit State
  const [componentsGrouped, setComponentsGrouped] = useState<Record<string, AdminComponent[]>>({});
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [editComponentForm, setEditComponentForm] = useState({ name: "", price: "", specs: "" });

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "orders") fetchAllOrders();
    if (activeTab === "services") fetchAdminServices();
    if (activeTab === "components") fetchAdminComponents();
  }, [activeTab]);

  const fetchAdminServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setServices(data);
      } else {
        setServices(fallbackServices as any);
      }
    } catch {
      setServices(fallbackServices as any);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAdminComponents = async () => {
    setComponentsLoading(true);
    try {
      const res = await fetch("/api/components");
      if (!res.ok) throw new Error("Failed to fetch PC components");
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setComponentsGrouped(data);
      } else {
        setComponentsGrouped(fallbackComponents as any);
      }
    } catch {
      setComponentsGrouped(fallbackComponents as any);
    } finally {
      setComponentsLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    setOrdersLoading(true);
    try {
      const local = getLocalOrders();
      let serverOrders: Order[] = [];

      if (token) {
        try {
          const res = await fetch("/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              serverOrders = data;
            }
          }
        } catch (e) {
          console.warn("Backend orders unreachable, reading local orders:", e);
        }
      }

      // Merge unique orders
      const mergedMap = new Map<string, Order>();
      serverOrders.forEach((o) => {
        const key = o.trackingId || o._id;
        if (key) mergedMap.set(key, o);
      });
      local.forEach((o) => {
        const key = o.trackingId || o._id;
        if (key) {
          const existing = mergedMap.get(key);
          mergedMap.set(key, { ...existing, ...o });
        } else {
          mergedMap.set(o._id, o);
        }
      });

      const all = Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      setOrders(all);
    } catch {
      toast.error("Could not load administrative orders.");
    } finally {
      setOrdersLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string, stage?: number) => {
    try {
      const calcStage = stage !== undefined 
        ? stage 
        : newStatus === "Pending" ? 1 
        : newStatus === "Processing" ? 2 
        : newStatus === "Shipped" ? 3 
        : newStatus === "Delivered" ? 4 
        : 0;

      // Update local storage
      updateLocalOrderStatus(orderId, newStatus, calcStage);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.trackingId === orderId
            ? { ...o, status: newStatus as any, trackingStage: calcStage }
            : o
        )
      );

      // Attempt backend update
      if (token) {
        try {
          await fetch(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus, trackingStage: calcStage }),
          });
        } catch {
          // Backend optional
        }
      }

      toast.success(`Tracking stage updated to: ${newStatus}`);
    } catch {
      toast.error("Failed to update order status.");
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order record?")) return;
    deleteLocalOrder(orderId);
    setOrders((prev) => prev.filter((o) => o._id !== orderId && o.trackingId !== orderId));
    toast.success("Order removed from administrative records.");
  };

  const onAdminSubdomain = isAdminSubdomain();
  if (!user?.isAdmin) return <Navigate to={onAdminSubdomain ? "/login" : "/admin/login"} replace />;

  // --- Product Functions ---
  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditForm({ price: String(p.price), description: p.description, image: p.image || "" });
  };

  const saveEdit = async (id: string) => {
    try {
      await updateProduct(id, {
        price: Number(editForm.price),
        description: editForm.description,
        image: editForm.image,
      });
      setEditingId(null);
      toast.success("Product price, details, and photo updated.");
    } catch {
      toast.error("Failed to update product.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast.success("Product deleted.");
    } catch {
      toast.error("Failed to delete product.");
    }
  };

  const handleAdd = async () => {
    if (!newProduct.name.trim() || !newProduct.price) return;
    try {
      await addProduct({
        name: newProduct.name,
        category: newProduct.category || "Uncategorized",
        price: Number(newProduct.price),
        description: newProduct.description,
        image:
          newProduct.image ||
          "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80",
        rating: 0,
        reviewCount: 0,
        brand: "Unknown",
        stock: 10,
      });
      setNewProduct({ name: "", category: "", price: "", description: "", image: "" });
      setShowAdd(false);
      toast.success("Product added with set price.");
    } catch {
      toast.error("Failed to add product.");
    }
  };

  // --- Service Functions ---
  const startEditService = (s: AdminService) => {
    setEditingServiceId(s.id);
    setEditServiceForm({ name: s.name, price: s.price, description: s.description });
  };

  const saveServiceEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editServiceForm.name,
          price: editServiceForm.price,
          description: editServiceForm.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service price and details updated.");
      setEditingServiceId(null);
      fetchAdminServices();
    } catch {
      toast.error("Failed to update service price.");
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price) return;
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      });
      if (!res.ok) throw new Error("Failed to add service");
      toast.success("New Service created successfully.");
      setNewService({ name: "", price: "", description: "", icon: "Wrench" });
      setShowAddService(false);
      fetchAdminServices();
    } catch {
      toast.error("Failed to create new service.");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete service");
      toast.success("Service deleted.");
      fetchAdminServices();
    } catch {
      toast.error("Failed to delete service.");
    }
  };

  // --- Component Functions ---
  const startEditComponent = (c: AdminComponent) => {
    setEditingComponentId(c.id);
    setEditComponentForm({ name: c.name, price: String(c.price), specs: c.specs });
  };

  const saveComponentEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/components/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editComponentForm.name,
          price: Number(editComponentForm.price),
          specs: editComponentForm.specs,
        }),
      });
      if (!res.ok) throw new Error("Failed to update component");
      toast.success("PC Component price updated.");
      setEditingComponentId(null);
      fetchAdminComponents();
    } catch {
      toast.error("Failed to update component price.");
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await deleteReview(id);
      toast.success("Review deleted.");
    } catch {
      toast.error("Failed to delete review.");
    }
  };

  return (
    <div className={`container max-w-5xl 2xl:max-w-7xl ${onAdminSubdomain ? "pt-6 sm:pt-8" : "pt-24"} pb-16 px-4 sm:px-6 min-h-screen min-h-dvh`}>
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 animate-fade-in-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300">
              <ShieldCheck className="h-3 w-3 text-purple-400" /> admin.gzones.in
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Gateway Connected
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Pricing & Management Panel</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Edit pricing for products, services, and PC components
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "products" && (
            <Button
              onClick={() => setShowAdd(!showAdd)}
              variant={showAdd ? "outline" : "default"}
              size="sm"
            >
              {showAdd ? (
                <>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add Product
                </>
              )}
            </Button>
          )}
          {activeTab === "services" && (
            <Button
              onClick={() => setShowAddService(!showAddService)}
              variant={showAddService ? "outline" : "default"}
              size="sm"
            >
              {showAddService ? (
                <>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" /> Add Service
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-1">
        {[
          { id: "products", label: "Products" },
          { id: "services", label: "Services", icon: Wrench },
          { id: "components", label: "PC Builder Components", icon: Cpu },
          { id: "orders", label: "Orders" },
          { id: "reviews", label: "Reviews" },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-bold capitalize transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTS PRICING & EDITING */}
      {activeTab === "products" && (
        <>
          {showAdd && (
            <div className="rounded-xl border bg-card p-5 mb-6 space-y-4 animate-fade-in-up">
              <h2 className="font-semibold">New Product</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Name *</Label>
                  <Input
                    value={newProduct.name}
                    onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Product name"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Input
                    value={newProduct.category}
                    onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                    placeholder="e.g. processors"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Price (₹) *</Label>
                  <Input
                    type="number"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                    placeholder="45000"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="flex items-center justify-between text-xs font-semibold">
                    <span>Product Photo</span>
                    <span className="text-[11px] text-muted-foreground font-normal">Upload photo from device or paste image URL</span>
                  </Label>
                  <div className="flex flex-col sm:flex-row items-center gap-3 bg-muted/20 p-3.5 rounded-xl border border-dashed border-border">
                    {newProduct.image ? (
                      <div className="relative group shrink-0">
                        <img src={newProduct.image} alt="Preview" className="h-16 w-16 object-cover rounded-xl border shadow-sm" />
                        <button
                          type="button"
                          onClick={() => setNewProduct(p => ({ ...p, image: "" }))}
                          className="absolute -top-2 -right-2 bg-destructive text-white p-1 rounded-full shadow hover:bg-destructive/90 transition-all"
                          title="Remove photo"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-16 w-16 rounded-xl bg-muted/50 flex flex-col items-center justify-center text-muted-foreground shrink-0 border border-border">
                        <Camera className="h-6 w-6 stroke-1" />
                        <span className="text-[9px] mt-0.5 font-medium">No Photo</span>
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer">
                          <span className="inline-flex items-center px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-all gap-1.5 cursor-pointer">
                            <Upload className="h-3.5 w-3.5" /> Upload Photo File
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageFileUpload(e, (dataUrl) => setNewProduct(p => ({ ...p, image: dataUrl })))}
                          />
                        </label>
                        <span className="text-xs text-muted-foreground">or</span>
                      </div>
                      <Input
                        value={newProduct.image}
                        onChange={(e) => setNewProduct((p) => ({ ...p, image: e.target.value }))}
                        placeholder="Paste image URL (https://...)"
                        className="text-xs h-8 bg-background rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Product description"
                  rows={3}
                />
              </div>
              <Button onClick={handleAdd}>
                <Save className="h-4 w-4 mr-1" /> Save Product
              </Button>
            </div>
          )}

          <div className="space-y-8">
            {Object.entries(
              products.reduce((acc, current) => {
                const cat = current.category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(current);
                return acc;
              }, {} as Record<string, Product[]>)
            ).map(([category, catProducts]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground mt-6 mb-3 px-2">
                  {category}
                </h2>
                {catProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    className="rounded-xl border bg-card p-5 animate-fade-in-up"
                    style={{ animationDelay: `${0.05 * idx}s` }}
                  >
                    {editingId === p.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold flex-1">{p.name}</h3>
                          <Button size="sm" onClick={() => saveEdit(p.id)}>
                            <Save className="h-3.5 w-3.5 mr-1" /> Save Product
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <Label className="flex items-center gap-1">
                              <IndianRupee className="h-3.5 w-3.5 text-emerald-500" /> New Price
                              (₹)
                            </Label>
                            <Input
                              type="number"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm((f) => ({ ...f, price: e.target.value }))
                              }
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="flex items-center justify-between text-xs font-semibold">
                              <span>Product Photo</span>
                            </Label>
                            <div className="flex items-center gap-3 bg-muted/20 p-2.5 rounded-xl border border-dashed border-border">
                              {editForm.image ? (
                                <img src={editForm.image} alt="Preview" className="h-12 w-12 object-cover rounded-lg border shrink-0 shadow-sm" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0 border">
                                  <Camera className="h-4 w-4" />
                                </div>
                              )}
                              <div className="flex-1 space-y-1">
                                <label className="cursor-pointer inline-block">
                                  <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-lg bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 transition-all gap-1 cursor-pointer">
                                    <Upload className="h-3 w-3" /> Upload Photo
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleImageFileUpload(e, (dataUrl) => setEditForm(f => ({ ...f, image: dataUrl })))}
                                  />
                                </label>
                                <Input
                                  value={editForm.image}
                                  onChange={(e) => setEditForm((f) => ({ ...f, image: e.target.value }))}
                                  placeholder="Or paste URL"
                                  className="text-xs h-7 bg-background rounded-lg"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label>Description</Label>
                          <Textarea
                            value={editForm.description}
                            onChange={(e) =>
                              setEditForm((f) => ({ ...f, description: e.target.value }))
                            }
                            rows={2}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="h-14 w-14 rounded-lg object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{p.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {p.description}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-400 shrink-0 text-base">
                          ₹{p.price.toLocaleString()}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => startEdit(p)}
                            title="Edit Price"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(p.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* TAB 2: SERVICES PRICING & EDITING */}
      {activeTab === "services" && (
        <div className="space-y-6">
          {showAddService && (
            <div className="rounded-xl border bg-card p-5 mb-6 space-y-4 animate-fade-in-up">
              <h2 className="font-semibold">New Service</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Service Name *</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                    placeholder="Printer Repair & Service"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Pricing (e.g. From ₹799) *</Label>
                  <Input
                    value={newService.price}
                    onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                    placeholder="From ₹799"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea
                  value={newService.description}
                  onChange={(e) =>
                    setNewService((s) => ({ ...s, description: e.target.value }))
                  }
                  placeholder="Service description"
                  rows={2}
                />
              </div>
              <Button onClick={handleAddService}>
                <Save className="h-4 w-4 mr-1" /> Create Service
              </Button>
            </div>
          )}

          {servicesLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching services...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((s, idx) => (
                <div
                  key={s.id}
                  className="rounded-xl border bg-card p-5 animate-fade-in-up"
                  style={{ animationDelay: `${0.05 * idx}s` }}
                >
                  {editingServiceId === s.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Input
                          value={editServiceForm.name}
                          onChange={(e) =>
                            setEditServiceForm((f) => ({ ...f, name: e.target.value }))
                          }
                          className="font-bold flex-1"
                        />
                        <Button size="sm" onClick={() => saveServiceEdit(s.id)}>
                          <Save className="h-3.5 w-3.5 mr-1" /> Save Service
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingServiceId(null)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-emerald-400">
                          Pricing Text (e.g. From ₹1,999)
                        </Label>
                        <Input
                          value={editServiceForm.price}
                          onChange={(e) =>
                            setEditServiceForm((f) => ({ ...f, price: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold">Description</Label>
                        <Textarea
                          value={editServiceForm.description}
                          onChange={(e) =>
                            setEditServiceForm((f) => ({ ...f, description: e.target.value }))
                          }
                          rows={2}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <h3 className="font-bold text-base">{s.name}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {s.description}
                        </p>
                      </div>
                      <span className="font-mono font-bold text-emerald-400 text-lg shrink-0">
                        {s.price}
                      </span>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditService(s)}
                          title="Edit Service Price"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteService(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PC BUILDER COMPONENTS PRICING */}
      {activeTab === "components" && (
        <div className="space-y-6">
          {componentsLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching components...</p>
            </div>
          ) : (
            Object.entries(componentsGrouped).map(([category, parts]) => (
              <div key={category} className="space-y-3">
                <h2 className="text-lg font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">
                  {category}
                </h2>
                {parts.map((c, idx) => (
                  <div
                    key={c.id}
                    className="rounded-xl border bg-card p-4 animate-fade-in-up"
                    style={{ animationDelay: `${0.03 * idx}s` }}
                  >
                    {editingComponentId === c.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm flex-1">{c.name}</h3>
                          <Button size="sm" onClick={() => saveComponentEdit(c.id)}>
                            <Save className="h-3.5 w-3.5 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingComponentId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Component Price (₹)</Label>
                            <Input
                              type="number"
                              value={editComponentForm.price}
                              onChange={(e) =>
                                setEditComponentForm((f) => ({ ...f, price: e.target.value }))
                              }
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Specifications</Label>
                            <Input
                              value={editComponentForm.specs}
                              onChange={(e) =>
                                setEditComponentForm((f) => ({ ...f, specs: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold">{c.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">({c.specs})</span>
                        </div>
                        <span className="font-mono font-bold text-emerald-400">
                          ₹{c.price.toLocaleString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditComponent(c)}
                          title="Edit Component Price"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: ORDERS FULFILLMENT & EXCEL EXPORTS */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Orders Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card rounded-2xl border border-border p-5 shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                  <Package className="h-5 w-5" />
                </span>
                <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
                  Customer Orders & Excel Exports
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Live customer orders received. You can update shipment stages and export order invoices to Excel.
              </p>
            </div>

            {/* Global Actions & Stats */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/80 border border-border text-xs font-semibold">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-foreground">{orders.length} Orders</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400">
                <IndianRupee className="h-3.5 w-3.5" />
                <span>
                  ₹{orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0).toLocaleString()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => downloadAllOrdersExcel(orders)}
                disabled={orders.length === 0}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                title="Download Master Excel spreadsheet containing all customer orders"
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Download All Orders (Excel)</span>
              </button>
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search orders by customer, tracking ID, mobile, city..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
              />
              {orderSearch && (
                <button
                  type="button"
                  onClick={() => setOrderSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: "all", label: "All" },
                { id: "Pending", label: "Pending" },
                { id: "Processing", label: "Processing" },
                { id: "Shipped", label: "Shipped" },
                { id: "Delivered", label: "Delivered" },
                { id: "Cancelled", label: "Cancelled" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOrderStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    orderStatusFilter === tab.id
                      ? "bg-sky-500 text-white shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {ordersLoading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Fetching all orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border p-8">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold text-foreground text-sm mb-1">
                {orders.length === 0 ? "No orders found yet." : "No orders match your filter criteria."}
              </p>
              <p className="text-xs text-muted-foreground">
                {orders.length === 0
                  ? "When customers place orders through checkout, they will appear here in real time."
                  : "Try clearing your search query or choosing another status filter."}
              </p>
            </div>
          ) : (
            filteredOrders.map((order, idx) => {
              const currentStatus = order.status || "Pending";
              const StatusIcon = statusConfig[currentStatus]?.icon || Clock;
              const currentStage = order.trackingStage || (
                currentStatus === "Delivered" ? 4 :
                currentStatus === "Shipped" ? 3 :
                currentStatus === "Processing" ? 2 :
                currentStatus === "Cancelled" ? 0 : 1
              );

              return (
                <div
                  key={order._id}
                  className="bg-card rounded-2xl border border-border overflow-hidden p-6 animate-fade-in-up space-y-5 shadow-sm"
                  style={{ animationDelay: `${0.05 + idx * 0.03}s` }}
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-muted-foreground">Order ID:</span>
                        <span className="font-mono text-xs font-semibold">{order._id}</span>
                        {order.trackingId && (
                          <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                            #{order.trackingId}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{order.shippingInfo?.name || "Customer"}</h3>
                      <p className="text-xs text-muted-foreground">
                        Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : "Recent"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Individual Order Excel Download Button */}
                      <button
                        type="button"
                        onClick={() => downloadOrderExcel(order)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        title="Download complete details for this order as an Excel spreadsheet"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                        <span>Download Excel</span>
                      </button>

                      <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full ${statusConfig[currentStatus]?.bg || 'bg-muted'}`}>
                        <StatusIcon className={`h-4 w-4 ${statusConfig[currentStatus]?.color || 'text-foreground'}`} />
                        <span className={`text-xs font-bold ${statusConfig[currentStatus]?.color || 'text-foreground'}`}>
                          {currentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Tracking Process Stage Selector */}
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border/80 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5" />
                        Select Tracking Process Stage
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">
                        Click any stage to update customer tracking in real-time
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { stage: 1, status: "Pending", label: "1. Order Placed", icon: Clock },
                        { stage: 2, status: "Processing", label: "2. Processing & Assembly", icon: Package },
                        { stage: 3, status: "Shipped", label: "3. Out for Delivery", icon: Truck },
                        { stage: 4, status: "Delivered", label: "4. Delivered", icon: CheckCircle2 },
                      ].map((p) => {
                        const isCurrent = currentStage === p.stage && currentStatus !== "Cancelled";
                        const isPassed = currentStage >= p.stage && currentStatus !== "Cancelled";
                        const StepIcon = p.icon;

                        return (
                          <button
                            key={p.stage}
                            type="button"
                            onClick={() => updateOrderStatus(order._id, p.status, p.stage)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition-all flex flex-col gap-1 cursor-pointer ${
                              isCurrent
                                ? "bg-sky-500 text-white border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.4)] scale-[1.02]"
                                : isPassed
                                ? "bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20"
                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <StepIcon className="h-3.5 w-3.5" />
                              <span className="text-[10px] font-mono font-bold">
                                {isCurrent ? "ACTIVE" : isPassed ? "DONE" : `STEP ${p.stage}`}
                              </span>
                            </div>
                            <span className="truncate">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {currentStatus !== "Cancelled" && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => updateOrderStatus(order._id, "Cancelled", 0)}
                          className="text-[11px] text-destructive hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Cancel This Order
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Customer Shipping & Detailed Address */}
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                      Customer & Delivery Address
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted-foreground font-medium">Contact Numbers:</p>
                        <p className="font-semibold text-foreground">
                          Phone: <a href={`tel:${order.shippingInfo?.phone}`} className="text-sky-400 hover:underline">{order.shippingInfo?.phone}</a>
                        </p>
                        {order.shippingInfo?.alternatePhone && (
                          <p className="font-semibold text-foreground">
                            Alt Phone: <a href={`tel:${order.shippingInfo?.alternatePhone}`} className="text-sky-400 hover:underline">{order.shippingInfo?.alternatePhone}</a>
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="text-muted-foreground font-medium">Delivery Location:</p>
                        {order.shippingInfo?.address1 ? (
                          <p className="font-medium text-foreground">
                            {order.shippingInfo.address1}
                            {order.shippingInfo.address2 ? `, ${order.shippingInfo.address2}` : ""}
                            <br />
                            {order.shippingInfo.city ? `${order.shippingInfo.city}, ` : ""}{order.shippingInfo.state}, {order.shippingInfo.country || "India"} - {order.shippingInfo.pincode}
                          </p>
                        ) : (
                          <p className="font-medium text-foreground">{order.shippingInfo?.address}</p>
                        )}
                      </div>
                    </div>

                    {order.shippingInfo?.notes && (
                      <p className="text-xs italic text-muted-foreground pt-1 border-t border-border/40">
                        Notes: "{order.shippingInfo.notes}"
                      </p>
                    )}
                  </div>

                  {/* ORDERED ITEMS SECTION */}
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/60 space-y-2">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/40">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-sky-400" />
                        Ordered Hardware Items ({order.items?.length || 0})
                      </span>
                      <span className="text-xs font-bold text-sky-400">
                        Order Total: ₹{order.totalPrice?.toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((it, itemIdx) => (
                          <div
                            key={itemIdx}
                            className="p-2 rounded-lg bg-card/60 border border-border/40 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-foreground truncate">{it.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Qty: <span className="font-bold text-foreground">{it.quantity || 1}</span> × ₹{(it.price || 0).toLocaleString()}
                              </p>
                            </div>
                            <span className="font-mono font-bold text-foreground shrink-0">
                              ₹{((it.price || 0) * (it.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No individual item details specified.</p>
                      )}
                    </div>
                  </div>

                  {/* Order Footer */}
                  <div className="flex flex-wrap justify-between items-center border-t border-border pt-4 gap-2">
                    <div className="text-xs text-muted-foreground">
                      {order.items?.length || 0} items •{" "}
                      <span className="font-bold text-foreground">
                        ₹{order.totalPrice?.toLocaleString()}
                      </span>{" "}
                      via <span className="font-semibold text-primary uppercase text-[10px] tracking-wider">{order.paymentMethod || "COD"}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteOrder(order._id)}
                        className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
                        title="Delete order"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Record</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 5: REVIEWS MODERATION */}
      {activeTab === "reviews" && (
        <>
          <div className="mt-4 mb-6">
            <h2 className="text-xl font-bold">Manage Reviews</h2>
            <p className="text-sm text-muted-foreground">Delete inappropriate or spam reviews</p>
          </div>
          <div className="space-y-3">
            {reviews.map((r, idx) => (
              <div
                key={r.id}
                className="rounded-xl border bg-card p-4 flex items-start gap-4 animate-fade-in-up"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{r.userName}</span>
                    <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {r.rating} ★
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">{r.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">"{r.comment}"</p>
                  {r.productId && (
                    <p className="text-xs text-muted-foreground/60">Product ID: {r.productId}</p>
                  )}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive shrink-0"
                  onClick={() => handleDeleteReview(r.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No reviews to manage.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Admin;

