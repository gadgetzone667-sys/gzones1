import { useState, useEffect, useMemo, useCallback } from "react";
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
  Printer,
  Eye,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import {
  getLocalOrders,
  updateLocalOrderStatus,
  updateLocalPaymentStatus,
  deleteLocalOrder,
  downloadOrderExcel,
  downloadAllOrdersExcel,
  printOrderInvoice,
  initCrossDomainOrderBridge,
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

const statusConfig: Record<string, { icon: any; color: string; bg: string; border: string }> = {
  Pending: { icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  Confirmed: { icon: CheckCircle2, color: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  Processing: { icon: Package, color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
  Shipped: { icon: Truck, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  Delivered: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Cancelled: { icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
};

const paymentStatusConfig: Record<string, { color: string; bg: string; border: string }> = {
  Pending: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  Paid: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  Failed: { color: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30" },
  Refunded: { color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/30" },
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
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<string>("all");
  const [orderDateFilter, setOrderDateFilter] = useState<string>("all");
  const [orderSort, setOrderSort] = useState<"newest" | "oldest">("newest");
  const [orderPage, setOrderPage] = useState(1);
  const ordersPerPage = 10;

  // Selected Order for View Details Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Status Confirmation Dialog State (for sensitive actions like Cancel Order)
  const [statusConfirmDialog, setStatusConfirmDialog] = useState<{
    isOpen: boolean;
    orderId: string;
    newStatus: string;
    stage?: number;
    title: string;
    description: string;
  }>({
    isOpen: false,
    orderId: "",
    newStatus: "",
    title: "",
    description: "",
  });

  // Section 9: Dashboard Statistics (Revenue excludes cancelled orders)
  const orderStats = useMemo(() => {
    let pending = 0;
    let confirmed = 0;
    let delivered = 0;
    let cancelled = 0;
    let totalRevenue = 0;

    for (const o of orders) {
      const st = o.orderStatus || o.status || "Pending";
      const totalAmount = Number(o.grandTotal ?? o.totalPrice ?? 0);

      if (st === "Pending") pending++;
      else if (st === "Confirmed" || st === "Processing") confirmed++;
      else if (st === "Delivered") delivered++;
      else if (st === "Cancelled") cancelled++;

      // Revenue excludes cancelled orders
      if (st !== "Cancelled") {
        totalRevenue += totalAmount;
      }
    }

    return {
      total: orders.length,
      pending,
      confirmed,
      delivered,
      cancelled,
      revenue: totalRevenue,
    };
  }, [orders]);

  // Section 8: Search, Filter, Sort
  const filteredAndSortedOrders = useMemo(() => {
    const result = orders.filter((order) => {
      const orderStatus = order.orderStatus || order.status || "Pending";
      const paymentStatus = order.paymentStatus || "Pending";

      // Status filter
      if (orderStatusFilter !== "all" && orderStatus !== orderStatusFilter) {
        return false;
      }

      // Payment status filter
      if (orderPaymentFilter !== "all" && paymentStatus !== orderPaymentFilter) {
        return false;
      }

      // Date range filter
      if (orderDateFilter !== "all" && order.createdAt) {
        const orderDate = new Date(order.createdAt).getTime();
        const now = Date.now();
        if (orderDateFilter === "today") {
          const startOfDay = new Date().setHours(0, 0, 0, 0);
          if (orderDate < startOfDay) return false;
        } else if (orderDateFilter === "last7days") {
          if (now - orderDate > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (orderDateFilter === "last30days") {
          if (now - orderDate > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      // Search filter (Order ID, Customer Name, Phone, Email, City)
      if (orderSearch.trim()) {
        const q = orderSearch.toLowerCase();
        const matchesId = (order.orderId || order._id || "").toLowerCase().includes(q);
        const matchesTracking = (order.trackingId || "").toLowerCase().includes(q);
        const matchesName = (order.customer?.name || order.shippingInfo?.name || "").toLowerCase().includes(q);
        const matchesPhone = (order.customer?.phone || order.shippingInfo?.phone || "").toLowerCase().includes(q);
        const matchesEmail = (order.customer?.email || "").toLowerCase().includes(q);
        const matchesCity = (order.shippingAddress?.city || order.shippingInfo?.city || "").toLowerCase().includes(q);
        const matchesItems = (order.items || []).some((i) => (i.name || "").toLowerCase().includes(q));

        return matchesId || matchesTracking || matchesName || matchesPhone || matchesEmail || matchesCity || matchesItems;
      }

      return true;
    });

    // Sort Newest or Oldest
    result.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return orderSort === "oldest" ? timeA - timeB : timeB - timeA;
    });

    return result;
  }, [orders, orderStatusFilter, orderPaymentFilter, orderDateFilter, orderSearch, orderSort]);

  // Section 8: Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / ordersPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * ordersPerPage;
    return filteredAndSortedOrders.slice(start, start + ordersPerPage);
  }, [filteredAndSortedOrders, orderPage, ordersPerPage]);

  // Reset page when filter or search changes
  useEffect(() => {
    setOrderPage(1);
  }, [orderSearch, orderStatusFilter, orderPaymentFilter, orderDateFilter, orderSort]);

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

  const fetchAllOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setOrdersLoading(true);
    try {
      const local = getLocalOrders();
      let serverOrders: Order[] = [];

      if (token) {
        try {
          const res = await fetch("/api/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const contentType = res.headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
              const data = await res.json();
              if (Array.isArray(data)) {
                serverOrders = data;
              } else if (data?.orders && Array.isArray(data.orders)) {
                serverOrders = data.orders;
              }
            }
          }
        } catch (e) {
          console.warn("Backend orders unreachable, reading local orders:", e);
        }
      }

      // Merge unique orders by trackingId, orderId, or _id
      const mergedMap = new Map<string, Order>();
      serverOrders.forEach((o) => {
        const key = o.orderId || o.trackingId || o._id;
        if (key) mergedMap.set(key, o);
      });
      local.forEach((o) => {
        const key = o.orderId || o.trackingId || o._id;
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

      // Keep selectedOrder in sync if view details modal is open
      setSelectedOrder((prev) => {
        if (!prev) return null;
        const found = all.find((o) => o._id === prev._id || o.orderId === prev.orderId);
        return found || prev;
      });
    } catch {
      toast.error("Could not load administrative orders.");
    } finally {
      if (showLoading) setOrdersLoading(false);
    }
  }, [token]);

  // Cross-domain bridge to automatically receive orders placed on https://gzones.in
  useEffect(() => {
    const cleanup = initCrossDomainOrderBridge((bridgedOrders) => {
      if (bridgedOrders.length > 0) {
        setOrders((prev) => {
          const map = new Map<string, Order>();
          prev.forEach((o) => {
            const key = o.orderId || o.trackingId || o._id;
            if (key) map.set(key, o);
          });
          bridgedOrders.forEach((o) => {
            const key = o.orderId || o.trackingId || o._id;
            if (key) {
              map.set(key, { ...map.get(key), ...o });
            } else {
              map.set(o._id, o);
            }
          });
          return Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
        });
      }
    });

    return () => {
      cleanup();
    };
  }, []);

  // Section 11: Real-Time Order Updates (polls every 15s when active on Orders tab)
  useEffect(() => {
    if (activeTab !== "orders") return;
    fetchAllOrders(false);

    const interval = setInterval(() => {
      fetchAllOrders(false);
    }, 15000);

    return () => clearInterval(interval);
  }, [activeTab, fetchAllOrders]);

  // Section 6: Update Order Status with confirmation for sensitive actions
  const handleUpdateStatus = (orderId: string, newStatus: string, stage?: number) => {
    if (newStatus === "Cancelled") {
      setStatusConfirmDialog({
        isOpen: true,
        orderId,
        newStatus,
        stage: 0,
        title: "Cancel Customer Order",
        description: "Are you sure you want to mark this order as Cancelled? Customer tracking will be set to cancelled and this order will be excluded from revenue statistics.",
      });
      return;
    }
    executeUpdateStatus(orderId, newStatus, stage);
  };

  const executeUpdateStatus = async (orderId: string, newStatus: string, stage?: number) => {
    try {
      const calcStage = stage !== undefined 
        ? stage 
        : newStatus === "Pending" ? 1 
        : newStatus === "Confirmed" || newStatus === "Processing" ? 2 
        : newStatus === "Shipped" ? 3 
        : newStatus === "Delivered" ? 4 
        : 0;

      // Update local storage
      updateLocalOrderStatus(orderId, newStatus, calcStage);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.orderId === orderId || o.trackingId === orderId
            ? { ...o, orderStatus: newStatus as any, status: newStatus as any, trackingStage: calcStage }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev && (prev._id === orderId || prev.orderId === orderId)
          ? { ...prev, orderStatus: newStatus as any, status: newStatus as any, trackingStage: calcStage }
          : prev
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

      toast.success(`Order status updated to: ${newStatus}`);
    } catch {
      toast.error("Failed to update order status.");
    } finally {
      setStatusConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    }
  };

  // Section 7: Update Payment Status
  const handleUpdatePaymentStatus = async (
    orderId: string,
    newPaymentStatus: "Pending" | "Paid" | "Failed" | "Refunded"
  ) => {
    try {
      updateLocalPaymentStatus(orderId, newPaymentStatus);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId || o.orderId === orderId || o.trackingId === orderId
            ? { ...o, paymentStatus: newPaymentStatus }
            : o
        )
      );

      setSelectedOrder((prev) =>
        prev && (prev._id === orderId || prev.orderId === orderId)
          ? { ...prev, paymentStatus: newPaymentStatus }
          : prev
      );

      if (token) {
        try {
          await fetch(`/api/orders/${orderId}/payment-status`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentStatus: newPaymentStatus }),
          });
        } catch {
          // Fallback handled
        }
      }

      toast.success(`Payment status updated to: ${newPaymentStatus}`);
    } catch {
      toast.error("Failed to update payment status.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this order record?")) return;
    deleteLocalOrder(orderId);
    setOrders((prev) => prev.filter((o) => o._id !== orderId && o.orderId !== orderId && o.trackingId !== orderId));
    if (selectedOrder && (selectedOrder._id === orderId || selectedOrder.orderId === orderId)) {
      setSelectedOrder(null);
    }

    if (token) {
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch {
        // Fallback handled
      }
    }

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

      {/* TAB 4: ORDERS MANAGEMENT & REAL-TIME TRACKING */}
      {activeTab === "orders" && (
        <div className="space-y-6">
          {/* Section 9: Dashboard Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                Total Orders
              </span>
              <p className="font-display text-2xl font-black text-foreground">{orderStats.total}</p>
              <span className="text-[10px] text-muted-foreground">All placed orders</span>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 shadow-sm">
              <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block mb-1">
                Total Revenue
              </span>
              <p className="font-display text-2xl font-black text-sky-400">
                ₹{orderStats.revenue.toLocaleString()}
              </p>
              <span className="text-[10px] text-sky-400/80">Excl. cancelled orders</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-sm">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
                Pending
              </span>
              <p className="font-display text-2xl font-black text-amber-400">{orderStats.pending}</p>
              <span className="text-[10px] text-amber-400/80">Awaiting confirmation</span>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">
                Confirmed / In Progress
              </span>
              <p className="font-display text-2xl font-black text-indigo-400">{orderStats.confirmed}</p>
              <span className="text-[10px] text-indigo-400/80">Processing & assembly</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                Delivered
              </span>
              <p className="font-display text-2xl font-black text-emerald-400">{orderStats.delivered}</p>
              <span className="text-[10px] text-emerald-400/80">Completed deliveries</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 shadow-sm">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block mb-1">
                Cancelled
              </span>
              <p className="font-display text-2xl font-black text-rose-400">{orderStats.cancelled}</p>
              <span className="text-[10px] text-rose-400/80">Voided orders</span>
            </div>
          </div>

          {/* Section 8: Search, Filter, Sort and Global Actions */}
          <div className="bg-card rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
                    <Package className="h-5 w-5" />
                  </span>
                  <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight">
                    Orders Management
                  </h2>
                  <div className="flex items-center gap-1.5 ml-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Sync Active</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  View, filter, manage customer orders, update tracking stages, and export invoices.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchAllOrders(true)}
                  disabled={ordersLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer"
                  title="Refresh order records"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${ordersLoading ? "animate-spin text-sky-400" : ""}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => downloadAllOrdersExcel(filteredAndSortedOrders)}
                  disabled={orders.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                  title="Download all filtered orders as an Excel CSV file"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>

            {/* Controls Bar: Search, Status Filter, Payment Filter, Date Filter, Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-border/60">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer, Phone, Email, City..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Order Status Filter */}
              <div>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="all">All Order Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div>
                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="Pending">Pending Payment</option>
                  <option value="Paid">Paid</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              {/* Date Filter & Sort */}
              <div className="flex items-center gap-2">
                <select
                  value={orderDateFilter}
                  onChange={(e) => setOrderDateFilter(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="last7days">Last 7 Days</option>
                  <option value="last30days">Last 30 Days</option>
                </select>

                <select
                  value={orderSort}
                  onChange={(e) => setOrderSort(e.target.value as any)}
                  className="w-full px-2.5 py-2 rounded-xl bg-muted/30 border border-border text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Responsive Orders Table */}
          {ordersLoading && orders.length === 0 ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-border">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm font-medium">Fetching orders from database...</p>
            </div>
          ) : filteredAndSortedOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border p-8">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-40 text-muted-foreground" />
              <p className="font-semibold text-foreground text-sm mb-1">
                {orders.length === 0 ? "No customer orders found yet." : "No orders match your filter criteria."}
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {orders.length === 0
                  ? "When customers place orders, they will appear here automatically in real time without refreshing."
                  : "Try clearing search keywords or switching filters to view all orders."}
              </p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-bold">Order ID</th>
                      <th className="py-3.5 px-4 font-bold">Customer</th>
                      <th className="py-3.5 px-4 font-bold">Phone</th>
                      <th className="py-3.5 px-4 font-bold text-center">Products</th>
                      <th className="py-3.5 px-4 font-bold text-right">Total Amount</th>
                      <th className="py-3.5 px-4 font-bold">Payment</th>
                      <th className="py-3.5 px-4 font-bold">Order Status</th>
                      <th className="py-3.5 px-4 font-bold">Date</th>
                      <th className="py-3.5 px-4 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {paginatedOrders.map((order) => {
                      const displayId = order.orderId || order._id;
                      const customerName = order.customer?.name || order.shippingInfo?.name || "Customer";
                      const customerEmail = order.customer?.email || "";
                      const customerPhone = order.customer?.phone || order.shippingInfo?.phone || "N/A";
                      const currentStatus = order.orderStatus || order.status || "Pending";
                      const currentPayment = order.paymentStatus || "Pending";
                      const StatusIcon = statusConfig[currentStatus]?.icon || Clock;
                      const itemsCount = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || order.items?.length || 0;
                      const totalAmount = order.grandTotal ?? order.totalPrice ?? 0;
                      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Recent";

                      return (
                        <tr
                          key={order._id || displayId}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          {/* 1. Order ID */}
                          <td className="py-3.5 px-4 font-mono font-bold text-sky-400 whitespace-nowrap">
                            #{displayId}
                            {order.trackingId && (
                              <span className="block text-[10px] text-muted-foreground font-mono font-normal">
                                {order.trackingId}
                              </span>
                            )}
                          </td>

                          {/* 2. Customer */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-foreground block">{customerName}</span>
                            {customerEmail && (
                              <span className="text-[11px] text-muted-foreground block truncate max-w-[160px]">
                                {customerEmail}
                              </span>
                            )}
                          </td>

                          {/* 3. Phone */}
                          <td className="py-3.5 px-4 whitespace-nowrap font-medium text-foreground">
                            <a
                              href={`tel:${customerPhone}`}
                              className="text-sky-400 hover:underline flex items-center gap-1"
                              title="Click to call customer"
                            >
                              <Phone className="h-3 w-3 opacity-70" />
                              <span>{customerPhone}</span>
                            </a>
                          </td>

                          {/* 4. Products Count */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary border border-border text-xs font-semibold">
                              <Package className="h-3 w-3 text-muted-foreground" />
                              {itemsCount} {itemsCount === 1 ? "item" : "items"}
                            </span>
                          </td>

                          {/* 5. Total Amount */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <span className="font-display font-extrabold text-foreground text-sm sm:text-base">
                              ₹{totalAmount.toLocaleString()}
                            </span>
                          </td>

                          {/* 6. Payment */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="text-xs font-semibold block text-foreground truncate max-w-[120px]">
                              {order.paymentMethod || "COD"}
                            </span>
                            <span
                              className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                paymentStatusConfig[currentPayment]?.bg || "bg-muted"
                              } ${paymentStatusConfig[currentPayment]?.color || "text-foreground"} ${
                                paymentStatusConfig[currentPayment]?.border || "border-border"
                              }`}
                            >
                              {currentPayment}
                            </span>
                          </td>

                          {/* 7. Order Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${
                                statusConfig[currentStatus]?.bg || "bg-muted"
                              } ${statusConfig[currentStatus]?.color || "text-foreground"} ${
                                statusConfig[currentStatus]?.border || "border-border"
                              }`}
                            >
                              <StatusIcon className="h-3.5 w-3.5" />
                              <span>{currentStatus}</span>
                            </div>
                          </td>

                          {/* 8. Date */}
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs text-muted-foreground">
                            {dateStr}
                          </td>

                          {/* 9. Action */}
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedOrder(order)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                title="Open full customer and order details"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span>View Details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => downloadOrderExcel(order)}
                                className="p-1.5 rounded-lg border border-border hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors text-muted-foreground"
                                title="Download Excel invoice"
                              >
                                <FileSpreadsheet className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer with Pagination Controls */}
              <div className="p-4 bg-muted/20 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
                <div>
                  Showing{" "}
                  <span className="font-bold text-foreground">
                    {Math.min(filteredAndSortedOrders.length, (orderPage - 1) * ordersPerPage + 1)}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-foreground">
                    {Math.min(filteredAndSortedOrders.length, orderPage * ordersPerPage)}
                  </span>{" "}
                  of <span className="font-bold text-foreground">{filteredAndSortedOrders.length}</span> orders
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderPage((p) => Math.max(1, p - 1))}
                    disabled={orderPage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                  <span className="px-2 font-bold text-foreground">
                    Page {orderPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrderPage((p) => Math.min(totalPages, p + 1))}
                    disabled={orderPage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 7: Dedicated Order Details Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div
                className="bg-card w-full max-w-4xl max-h-[92vh] rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col relative"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-5 sm:p-6 border-b border-border bg-muted/30 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Order:</span>
                      <span className="font-mono text-base font-extrabold text-sky-400">
                        #{selectedOrder.orderId || selectedOrder._id}
                      </span>
                      {selectedOrder.trackingId && (
                        <span className="font-mono text-xs font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          {selectedOrder.trackingId}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created on: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : "Recent"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => printOrderInvoice(selectedOrder)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition-colors cursor-pointer"
                      title="Print formatted invoice"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>Print</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadOrderExcel(selectedOrder)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors cursor-pointer"
                      title="Download Excel invoice"
                    >
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                      <span>Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="p-1.5 rounded-xl bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
                  {/* Status Banner & Stage Selection */}
                  <div className="p-4 rounded-2xl bg-secondary/50 border border-border space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-0.5">
                          Current Order Status
                        </span>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              statusConfig[selectedOrder.orderStatus || selectedOrder.status || "Pending"]?.bg
                            } ${statusConfig[selectedOrder.orderStatus || selectedOrder.status || "Pending"]?.color} ${
                              statusConfig[selectedOrder.orderStatus || selectedOrder.status || "Pending"]?.border
                            }`}
                          >
                            <span>{selectedOrder.orderStatus || selectedOrder.status || "Pending"}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                              paymentStatusConfig[selectedOrder.paymentStatus || "Pending"]?.bg
                            } ${paymentStatusConfig[selectedOrder.paymentStatus || "Pending"]?.color} ${
                              paymentStatusConfig[selectedOrder.paymentStatus || "Pending"]?.border
                            }`}
                          >
                            <span>Payment: {selectedOrder.paymentStatus || "Pending"}</span>
                          </span>
                        </div>
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="flex items-center gap-2">
                        <Label className="text-xs font-bold text-muted-foreground">Change Status:</Label>
                        <select
                          value={selectedOrder.orderStatus || selectedOrder.status || "Pending"}
                          onChange={(e) => handleUpdateStatus(selectedOrder._id || selectedOrder.orderId || "", e.target.value)}
                          className="px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>

                    {/* Stage quick steps */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/60">
                      {[
                        { stage: 1, status: "Pending", label: "1. Order Placed" },
                        { stage: 2, status: "Confirmed", label: "2. Confirmed & Processing" },
                        { stage: 3, status: "Shipped", label: "3. Out for Delivery" },
                        { stage: 4, status: "Delivered", label: "4. Delivered" },
                      ].map((s) => {
                        const currentStatus = selectedOrder.orderStatus || selectedOrder.status || "Pending";
                        const active = (selectedOrder.trackingStage || 1) >= s.stage && currentStatus !== "Cancelled";
                        const isCurrent = (selectedOrder.trackingStage || 1) === s.stage && currentStatus !== "Cancelled";

                        return (
                          <button
                            key={s.stage}
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id || selectedOrder.orderId || "", s.status, s.stage)}
                            className={`p-2 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                              isCurrent
                                ? "bg-sky-500 text-white border-sky-400 shadow-sm font-bold"
                                : active
                                ? "bg-sky-500/10 text-sky-400 border-sky-500/30 hover:bg-sky-500/20"
                                : "bg-card text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            <span className="block text-[10px] opacity-70">Step {s.stage}</span>
                            <span className="truncate block">{s.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2-Column Grid: Customer Information & Order Summary */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    {/* Customer Information */}
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-sky-400" />
                        Customer Information
                      </h3>

                      <div className="space-y-1.5 text-xs">
                        <p className="font-bold text-base text-foreground">
                          {selectedOrder.customer?.name || selectedOrder.shippingInfo?.name || "Customer Name"}
                        </p>
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                          <a href={`tel:${selectedOrder.customer?.phone || selectedOrder.shippingInfo?.phone}`} className="text-sky-400 hover:underline">
                            {selectedOrder.customer?.phone || selectedOrder.shippingInfo?.phone || "N/A"}
                          </a>
                          {selectedOrder.customer?.alternatePhone && (
                            <span className="text-[11px] text-muted-foreground ml-1">
                              (Alt: {selectedOrder.customer.alternatePhone})
                            </span>
                          )}
                        </p>
                        {selectedOrder.customer?.email && (
                          <p className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                            <a href={`mailto:${selectedOrder.customer.email}`} className="text-sky-400 hover:underline">
                              {selectedOrder.customer.email}
                            </a>
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-border/60">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-sky-400 shrink-0" /> Delivery Address
                        </span>
                        <p className="text-xs font-medium text-foreground leading-relaxed">
                          {selectedOrder.shippingAddress?.address || selectedOrder.shippingInfo?.address || (
                            <>
                              {selectedOrder.shippingAddress?.address1}
                              {selectedOrder.shippingAddress?.address2 ? `, ${selectedOrder.shippingAddress.address2}` : ""}
                              <br />
                              {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                            </>
                          )}
                        </p>
                        {selectedOrder.shippingAddress?.notes && (
                          <p className="mt-2 text-xs italic text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/50">
                            Notes: "{selectedOrder.shippingAddress.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="p-4 rounded-2xl bg-muted/20 border border-border space-y-3 flex flex-col justify-between">
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                          <IndianRupee className="h-4 w-4 text-emerald-400" />
                          Order Summary
                        </h3>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Subtotal:</span>
                            <span className="font-semibold text-foreground">
                              ₹{(selectedOrder.subtotal ?? selectedOrder.grandTotal ?? selectedOrder.totalPrice ?? 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery Charges:</span>
                            <span className="font-semibold text-emerald-400">FREE</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Method:</span>
                            <span className="font-semibold text-foreground">
                              {selectedOrder.paymentMethod || "Cash on Delivery"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Payment Status:</span>
                            <select
                              value={selectedOrder.paymentStatus || "Pending"}
                              onChange={(e) => handleUpdatePaymentStatus(selectedOrder._id || selectedOrder.orderId || "", e.target.value as any)}
                              className="px-2 py-0.5 rounded-lg bg-card border border-border text-xs font-bold focus:outline-none"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Paid">Paid</option>
                              <option value="Failed">Failed</option>
                              <option value="Refunded">Refunded</option>
                            </select>
                          </div>
                          <div className="pt-2 border-t border-border flex justify-between items-center text-sm font-bold">
                            <span className="font-display">Grand Total:</span>
                            <span className="font-display text-lg text-sky-400">
                              ₹{(selectedOrder.grandTotal ?? selectedOrder.totalPrice ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Sensitive Actions */}
                      <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                        {(selectedOrder.orderStatus || selectedOrder.status) !== "Cancelled" ? (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(selectedOrder._id || selectedOrder.orderId || "", "Cancelled", 0)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Cancel Order</span>
                          </button>
                        ) : (
                          <span className="text-xs text-rose-400 font-bold">Order is Cancelled</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(selectedOrder._id || selectedOrder.orderId || "")}
                          className="text-xs text-muted-foreground hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          Delete Record
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ordered Products Table */}
                  <div className="rounded-2xl border border-border overflow-hidden">
                    <div className="p-3.5 bg-muted/40 border-b border-border flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-sky-400" />
                        Ordered Products ({selectedOrder.items?.length || 0})
                      </h4>
                      <span className="text-xs font-bold text-sky-400">
                        Total Units: {selectedOrder.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0}
                      </span>
                    </div>

                    <div className="divide-y divide-border/60">
                      {selectedOrder.items && selectedOrder.items.length > 0 ? (
                        selectedOrder.items.map((item, idx) => {
                          const itemSubtotal = item.subtotal ?? (item.price || 0) * (item.quantity || 1);
                          return (
                            <div key={idx} className="p-3.5 flex items-center justify-between gap-4 text-xs hover:bg-muted/20">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center shrink-0 overflow-hidden border border-border/50">
                                  {item.image ? (
                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <Package className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-foreground text-sm truncate">{item.name}</p>
                                  <p className="text-muted-foreground text-xs mt-0.5">
                                    Product ID: <span className="font-mono">{item.productId}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="font-mono font-bold text-foreground text-sm">
                                  ₹{itemSubtotal.toLocaleString()}
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                  {item.quantity || 1} × ₹{(item.price || 0).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="p-4 text-xs text-muted-foreground italic text-center">
                          No product items breakdown recorded.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-xl px-6 text-xs font-bold"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Section 6: Confirmation Dialog for Sensitive Actions */}
          {statusConfirmDialog.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div
                className="bg-card w-full max-w-md rounded-3xl border border-border p-6 shadow-2xl space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 text-rose-400">
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="h-6 w-6 text-rose-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">{statusConfirmDialog.title}</h3>
                    <p className="text-xs text-muted-foreground">Sensitive action requires confirmation</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {statusConfirmDialog.description}
                </p>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStatusConfirmDialog((p) => ({ ...p, isOpen: false }))}
                    className="rounded-xl text-xs font-bold"
                  >
                    No, Go Back
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      executeUpdateStatus(
                        statusConfirmDialog.orderId,
                        statusConfirmDialog.newStatus,
                        statusConfirmDialog.stage
                      )
                    }
                    className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                  >
                    Yes, Confirm Change
                  </Button>
                </div>
              </div>
            </div>
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

