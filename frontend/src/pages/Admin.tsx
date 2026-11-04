import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import { useReviews } from "../context/ReviewContext";
import type { Product } from "../data/products";
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
  FileText,
  Eye,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Building2,
  Boxes,
  CheckSquare,
  Wifi,
  Laptop,
  Database,
  Monitor,
  Server,
  HardDrive,
  Headphones,
  CheckCircle,
  CalendarCheck,
  Images,
  Sparkles,
  Play,
  Check,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateLocalOrderStatus,
  updateLocalPaymentStatus,
  deleteLocalOrder,
  downloadOrderPdf,
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


const SERVICE_ICONS_MAP: Record<string, any> = {
  Wrench,
  Camera,
  Wifi,
  Laptop,
  Database,
  Printer,
  Monitor,
  Server,
  Cpu,
  ShieldCheck,
  HardDrive,
  Headphones,
};

function getAdminServiceIcon(name: string): any {
  if (!name) return Wrench;
  const match = Object.keys(SERVICE_ICONS_MAP).find(
    (k) => k.toLowerCase() === name.trim().toLowerCase()
  );
  return match ? SERVICE_ICONS_MAP[match] : Wrench;
}

const SERVICE_ICON_OPTIONS = [
  { value: "Wrench", label: "Hardware & PC Build (Wrench)" },
  { value: "Camera", label: "CCTV & Security (Camera)" },
  { value: "Wifi", label: "Networking & Wi-Fi (Wifi)" },
  { value: "Laptop", label: "Laptop & Chip-Level Fix (Laptop)" },
  { value: "Database", label: "Data Recovery & Backup (Database)" },
  { value: "Printer", label: "Printer Repair & Service (Printer)" },
  { value: "Monitor", label: "Display & Monitor (Monitor)" },
  { value: "Server", label: "Server & Infrastructure (Server)" },
  { value: "Cpu", label: "Processor & Tuning (Cpu)" },
  { value: "ShieldCheck", label: "Antivirus & Protection (ShieldCheck)" },
  { value: "HardDrive", label: "SSD & Storage Upgrade (HardDrive)" },
  { value: "Headphones", label: "Audio & Peripherals (Headphones)" },
];

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
    "products" | "services" | "service-bookings" | "components" | "orders" | "reviews"
  >("products");

  // Service Bookings State
  const [serviceBookings, setServiceBookings] = useState<any[]>([]);
  const [serviceBookingsLoading, setServiceBookingsLoading] = useState(false);
  const [serviceBookingsFilter, setServiceBookingsFilter] = useState<string>("All");
  const [serviceBookingsSearch, setServiceBookingsSearch] = useState<string>("");
  const [viewingBookingDetails, setViewingBookingDetails] = useState<any | null>(null);
  const [assigningEngineerModal, setAssigningEngineerModal] = useState<{
    id: string;
    bookingId: string;
    engineerName: string;
  } | null>(null);
  const [cancellingBookingModal, setCancellingBookingModal] = useState<{
    id: string;
    bookingId: string;
    reason: string;
  } | null>(null);
  const [editingAdminNotesModal, setEditingAdminNotesModal] = useState<{
    id: string;
    bookingId: string;
    adminNotes: string;
  } | null>(null);

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

  // Section: Placed Build PC Orders & Bulk Order Management
  const [buildOrdersSearch, setBuildOrdersSearch] = useState("");
  const [buildOrdersStatus, setBuildOrdersStatus] = useState("all");
  const [buildOrdersTypeFilter, setBuildOrdersTypeFilter] = useState<"all" | "bulk" | "individual">("all");
  const [selectedBuildOrderIds, setSelectedBuildOrderIds] = useState<string[]>([]);
  const [bulkBatchStatus, setBulkBatchStatus] = useState<string>("Confirmed");
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false);


  // Modal for placing bulk custom PC orders
  const [showBulkOrderModal, setShowBulkOrderModal] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkBuildQty, setBulkBuildQty] = useState<number>(5);
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState<number>(0);
  const [bulkAssemblyNotes, setBulkAssemblyNotes] = useState("");
  const [bulkSelections, setBulkSelections] = useState<{
    processor: any | null;
    motherboard: any | null;
    ram: any | null;
    storage: any | null;
    gpu: any | null;
    psu: any | null;
    cooling: any | null;
    case: any | null;
  }>({
    processor: null,
    motherboard: null,
    ram: null,
    storage: null,
    gpu: null,
    psu: null,
    cooling: null,
    case: null,
  });
  const [bulkCustomer, setBulkCustomer] = useState({
    name: "",
    company: "",
    gstin: "",
    phone: "",
    email: "",
    address: "",
    city: "Chennai",
    state: "Tamil Nadu",
    pincode: "600107",
    paymentMethod: "Bank Transfer (NEFT/RTGS)",
    paymentStatus: "Paid",
    orderStatus: "Confirmed",
  });

  const buildOrders = useMemo(() => {
    return orders.filter((o) =>
      Boolean(o.isBulkOrder) ||
      (Number(o.bulkQuantity) > 1) ||
      o.items?.some(
        (i) =>
          i.type === "build" ||
          i.productId?.startsWith("build-") ||
          i.name?.toLowerCase().includes("build") ||
          (Array.isArray(i.parts) && i.parts.length > 0)
      )
    );
  }, [orders]);

  const filteredBuildOrders = useMemo(() => {
    return buildOrders.filter((order) => {
      const q = buildOrdersSearch.toLowerCase().trim();
      const isBulk = Boolean(order.isBulkOrder) || (Number(order.bulkQuantity) > 1);

      if (buildOrdersTypeFilter === "bulk" && !isBulk) return false;
      if (buildOrdersTypeFilter === "individual" && isBulk) return false;

      const matchesSearch =
        !q ||
        (order.orderId && order.orderId.toLowerCase().includes(q)) ||
        (order._id && order._id.toLowerCase().includes(q)) ||
        (order.customer?.name && order.customer.name.toLowerCase().includes(q)) ||
        (order.customer?.company && order.customer.company.toLowerCase().includes(q)) ||
        (order.customer?.gstin && order.customer.gstin.toLowerCase().includes(q)) ||
        (order.customer?.phone && order.customer.phone.includes(q)) ||
        (order.customer?.email && order.customer.email.toLowerCase().includes(q)) ||
        order.items?.some(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            it.parts?.some(
              (p) =>
                p.name.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
            )
        );

      const currentStatus = order.orderStatus || order.status || "Pending";
      const matchesStatus =
        buildOrdersStatus === "all" ||
        currentStatus.toLowerCase() === buildOrdersStatus.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [buildOrders, buildOrdersSearch, buildOrdersStatus, buildOrdersTypeFilter]);

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
  interface ProductFormData {
    name: string;
    brand: string;
    category: string;
    price: string;
    originalPrice: string;
    description: string;
    image: string;
    images: string[];
    featuresText: string;
    processor: string;
    ram: string;
    storage: string;
    gpu: string;
    display: string;
    os: string;
    warranty: string;
    stock: string;
  }

  const DEFAULT_NEW_PRODUCT: ProductFormData = {
    name: "",
    brand: "",
    category: "",
    price: "",
    originalPrice: "",
    description: "",
    image: "",
    images: [],
    featuresText: "",
    processor: "",
    ram: "",
    storage: "",
    gpu: "",
    display: "",
    os: "",
    warranty: "",
    stock: "",
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProductFormData>(DEFAULT_NEW_PRODUCT);
  const [showAdd, setShowAdd] = useState(false);
  const [newProduct, setNewProduct] = useState<ProductFormData>(DEFAULT_NEW_PRODUCT);

  // Compress uploaded images client-side to ensure fast, crisp uploads without memory lag
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_DIM = 1200;
          let w = img.width;
          let h = img.height;
          if (w > MAX_DIM || h > MAX_DIM) {
            if (w > h) {
              h = Math.round((h * MAX_DIM) / w);
              w = MAX_DIM;
            } else {
              w = Math.round((w * MAX_DIM) / h);
              h = MAX_DIM;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Multi-image upload: allows selecting 5, 10 or more images simultaneously in one go
  const handleMultipleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    appendImages: (newUrls: string[]) => void
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const imgFiles = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (imgFiles.length === 0) {
      toast.error('Please select valid image files (PNG, JPG, WebP, etc.).');
      return;
    }
    const toastId = toast.loading(`Uploading ${imgFiles.length} photo(s)...`);
    try {
      const dataUrls = await Promise.all(imgFiles.map(compressImage));
      const valid = dataUrls.filter(Boolean);
      appendImages(valid);
      toast.success(`Successfully uploaded ${valid.length} photo(s)!`, { id: toastId });
    } catch {
      toast.error('Failed to process some images.', { id: toastId });
    }
    e.target.value = '';
  };

  // Services Edit State
  const [services, setServices] = useState<AdminService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editServiceForm, setEditServiceForm] = useState({
    name: "",
    price: "",
    description: "",
    icon: "Wrench",
    features: "",
  });
  const [showAddService, setShowAddService] = useState(false);
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    description: "",
    icon: "Wrench",
    features: "",
  });

  // Components Edit State
  const [componentsGrouped, setComponentsGrouped] = useState<Record<string, AdminComponent[]>>({});
  const [componentsLoading, setComponentsLoading] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [editComponentForm, setEditComponentForm] = useState({ name: "", price: "", specs: "" });
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [newComponent, setNewComponent] = useState({
    name: "",
    category: "processor",
    price: "",
    brand: "",
    specs: "",
  });

  useEffect(() => {
    if (activeTab === "reviews") fetchReviews();
    if (activeTab === "orders") fetchAllOrders();
    if (activeTab === "services") {
      fetchAdminServices();
      fetchAdminServiceBookings(true);
    }
    if (activeTab === "service-bookings") {
      fetchAdminServiceBookings();
      const interval = setInterval(() => {
        fetchAdminServiceBookings(true);
      }, 15000);
      return () => clearInterval(interval);
    }
    if (activeTab === "components") {
      fetchAdminComponents();
      fetchAllOrders();
    }
  }, [activeTab]);

  const fetchAdminServices = async () => {
    setServicesLoading(true);
    try {
      const res = await fetch("/api/services");
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        setServices([]);
      }
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  };

  const fetchAdminServiceBookings = async (silent = false) => {
    if (!token) return;
    if (!silent) setServiceBookingsLoading(true);
    try {
      const res = await fetch("/api/services/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load service bookings");
      const data = await res.json();
      if (Array.isArray(data)) {
        setServiceBookings(data);
      }
    } catch (err: any) {
      console.warn("Service bookings load error:", err);
      if (!silent) toast.error(err.message || "Failed to load service bookings.");
    } finally {
      if (!silent) setServiceBookingsLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (
    id: string,
    newStatus: string,
    notes?: string,
    engineer?: string,
    cancellationReason?: string
  ) => {
    try {
      const res = await fetch(`/api/services/bookings/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          bookingStatus: newStatus,
          ...(notes !== undefined ? { adminNotes: notes, technicianNotes: notes } : {}),
          ...(engineer !== undefined ? { assignedEngineer: engineer, assignedTechnician: engineer } : {}),
          ...(cancellationReason ? { cancellationReason } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      toast.success(data.message || `Booking status updated to ${newStatus}.`);
      setServiceBookings((prev) =>
        prev.map((b) => (b._id === id ? { ...b, ...data.booking } : b))
      );
      if (viewingBookingDetails && viewingBookingDetails._id === id) {
        setViewingBookingDetails((prev: any) => ({ ...prev, ...data.booking }));
      }
    } catch (err: any) {
      toast.error(err.message || "Error updating booking status.");
    }
  };

  const handleSaveAssignedEngineer = async () => {
    if (!assigningEngineerModal) return;
    try {
      const res = await fetch(`/api/services/bookings/${assigningEngineerModal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedEngineer: assigningEngineerModal.engineerName,
          assignedTechnician: assigningEngineerModal.engineerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to assign engineer");
      toast.success(data.message || `Engineer ${assigningEngineerModal.engineerName} assigned.`);
      setServiceBookings((prev) =>
        prev.map((b) => (b._id === assigningEngineerModal.id ? { ...b, ...data.booking } : b))
      );
      if (viewingBookingDetails && viewingBookingDetails._id === assigningEngineerModal.id) {
        setViewingBookingDetails((prev: any) => ({ ...prev, ...data.booking }));
      }
      setAssigningEngineerModal(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to assign engineer.");
    }
  };

  const handleSaveCancelBooking = async () => {
    if (!cancellingBookingModal) return;
    try {
      const res = await fetch(`/api/services/bookings/${cancellingBookingModal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "Cancelled",
          bookingStatus: "Cancelled",
          cancellationReason: cancellingBookingModal.reason || "Cancelled by administrator",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel booking");
      toast.success("Service booking cancelled.");
      setServiceBookings((prev) =>
        prev.map((b) => (b._id === cancellingBookingModal.id ? { ...b, ...data.booking } : b))
      );
      if (viewingBookingDetails && viewingBookingDetails._id === cancellingBookingModal.id) {
        setViewingBookingDetails((prev: any) => ({ ...prev, ...data.booking }));
      }
      setCancellingBookingModal(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel booking.");
    }
  };

  const handleSaveAdminNotes = async () => {
    if (!editingAdminNotesModal) return;
    try {
      const res = await fetch(`/api/services/bookings/${editingAdminNotesModal.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          adminNotes: editingAdminNotesModal.adminNotes,
          technicianNotes: editingAdminNotesModal.adminNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save admin notes");
      toast.success("Admin notes saved.");
      setServiceBookings((prev) =>
        prev.map((b) => (b._id === editingAdminNotesModal.id ? { ...b, ...data.booking } : b))
      );
      if (viewingBookingDetails && viewingBookingDetails._id === editingAdminNotesModal.id) {
        setViewingBookingDetails((prev: any) => ({ ...prev, ...data.booking }));
      }
      setEditingAdminNotesModal(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to save notes.");
    }
  };

  const handleDeleteBooking = async (id: string, bookingId: string) => {
    if (!window.confirm(`Are you sure you want to delete service booking #${bookingId}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/services/bookings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete booking");
      toast.success(data.message || "Booking deleted.");
      setServiceBookings((prev) => prev.filter((b) => b._id !== id));
    } catch (err: any) {
      toast.error(err.message || "Error deleting booking.");
    }
  };

  const printServiceJobCard = (b: any) => {
    const w = window.open("", "_blank");
    if (!w) return;
    const phone = b.primaryPhone || b.phone1 || "N/A";
    const altPhone = b.alternatePhone || b.phone2 ? ` / ${b.alternatePhone || b.phone2}` : "";
    const dateStr = b.preferredDate || b.bookingDate || "N/A";
    const statusStr = b.bookingStatus || b.status || "Pending Review";
    const purposeStr = b.bookingPurpose || b.purpose || "N/A";
    const engineerStr = b.assignedEngineer || b.assignedTechnician || "GadgetZone Service Team";
    const notesStr = b.adminNotes || b.technicianNotes || "";

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Job Sheet - ${b.bookingId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 32px; color: #0f172a; }
          .hdr { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #8b5cf6; padding-bottom: 12px; margin-bottom: 20px; }
          .hdr h1 { margin: 0; font-size: 20px; color: #4338ca; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; font-size: 12px; }
          .box strong { display: block; color: #64748b; font-size: 10px; text-transform: uppercase; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
          th { background: #f1f5f9; width: 30%; }
          .sig { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; }
          .sig div { border-top: 1px solid #94a3b8; width: 200px; text-align: center; padding-top: 6px; }
        </style>
      </head>
      <body>
        <div class="hdr">
          <div>
            <h1>GADGET ZONE SERVICE JOB SHEET</h1>
            <div style="font-size: 11px; color: #64748b;">Enterprise Hardware Services & Repairs • support@gzones.in</div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 16px; font-weight: 800; color: #7c3aed;">#${b.bookingId}</div>
            <div style="font-size: 11px; color: #64748b;">Status: <strong>${statusStr}</strong></div>
          </div>
        </div>
        <div class="grid">
          <div class="box">
            <strong>Customer Information</strong>
            <div style="font-size: 13px; font-weight: 700;">${b.customerName}</div>
            <div>Phone: ${phone}${altPhone}</div>
            ${b.userEmail ? `<div>Email: ${b.userEmail}</div>` : ""}
            <div>Location: ${b.address}</div>
          </div>
          <div class="box">
            <strong>Service & Appointment</strong>
            <div style="font-size: 13px; font-weight: 700;">${b.serviceName}</div>
            <div>Date: ${dateStr} | Time: ${b.preferredTime || "Flexible"}</div>
            <div>Fee / Stated Price: ${b.servicePrice || "Quote on inspection"}</div>
            <div>Assigned Engineer: ${engineerStr}</div>
          </div>
        </div>
        <div class="box" style="margin-bottom: 16px;">
          <strong>Reported Problem / Service Scope</strong>
          <div style="font-size: 12px; white-space: pre-wrap;">${purposeStr}</div>
        </div>
        ${notesStr ? `
        <div class="box" style="margin-bottom: 16px; border-left: 4px solid #8b5cf6;">
          <strong>Admin / Technician Remarks</strong>
          <div>${notesStr}</div>
        </div>` : ""}
        ${b.cancellationReason ? `
        <div class="box" style="margin-bottom: 16px; border-left: 4px solid #ef4444; color: #b91c1c;">
          <strong>Cancellation Reason</strong>
          <div>${b.cancellationReason}</div>
        </div>` : ""}
        <div class="sig">
          <div>Customer Signature</div>
          <div>Authorized Service Engineer</div>
        </div>
      </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  };

  const openCustomerWhatsApp = (b: any) => {
    const raw = (b.primaryPhone || b.phone1 || "").replace(/\D/g, "");
    if (!raw) {
      toast.error("No phone number available for this booking.");
      return;
    }
    const phoneWithCountry = raw.length === 10 ? `91${raw}` : raw;
    const currentStatus = b.bookingStatus || b.status || "Pending Review";
    const dateStr = b.preferredDate || b.bookingDate || "scheduled date";
    const text = `Hello ${b.customerName || "Customer"}, this is regarding your Gadget Zone service booking *#${b.bookingId}* for *${b.serviceName}*. Current status: *${currentStatus}*. Scheduled on ${dateStr} (${b.preferredTime || "Flexible slot"}).`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(text)}`, "_blank");
  };


  const fetchAdminComponents = async () => {
    setComponentsLoading(true);
    try {
      const res = await fetch("/api/components");
      if (!res.ok) throw new Error("Failed to fetch PC components");
      const data = await res.json();
      if (data && typeof data === "object") {
        setComponentsGrouped(data);
      } else {
        setComponentsGrouped({});
      }
    } catch {
      setComponentsGrouped({});
    } finally {
      setComponentsLoading(false);
    }
  };

  const fetchAllOrders = useCallback(async (showLoading = true) => {
    if (showLoading) setOrdersLoading(true);
    try {
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
          console.warn("Backend orders unreachable:", e);
        }
      }

      // Orders are strictly verified from MongoDB database
      const all = [...serverOrders].sort(
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
    const pImages = Array.isArray(p.images) && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
    const pFeatures = Array.isArray(p.features) ? p.features.join("\n") : "";
    const pSpecs = p.specs || {};
    setEditForm({
      name: p.name || "",
      brand: p.brand || "",
      category: p.category || "",
      price: String(p.price || ""),
      originalPrice: String(p.originalPrice || ""),
      description: p.description || "",
      image: p.image || pImages[0] || "",
      images: pImages,
      featuresText: pFeatures,
      processor: pSpecs.Processor || pSpecs["Processor Name"] || "",
      ram: pSpecs.RAM || pSpecs["RAM Capacity"] || "",
      storage: pSpecs.Storage || pSpecs["SSD Capacity"] || "",
      gpu: pSpecs.Graphics || pSpecs["Graphic Processor"] || "",
      display: pSpecs.Display || pSpecs["Display Size"] || "",
      os: pSpecs.OS || pSpecs["Operating System"] || "",
      warranty: p.warranty || pSpecs.Warranty || "",
      stock: String(p.stock !== undefined ? p.stock : 10),
    });
  };

  const saveEdit = async (id: string) => {
    try {
      const parsedFeatures = editForm.featuresText
        .split("\n")
        .map((f) => f.trim().replace(/^[\s•\-\*]+/, ""))
        .filter(Boolean);

      const specsObj: Record<string, string> = {};
      if (editForm.processor.trim()) specsObj.Processor = editForm.processor.trim();
      if (editForm.ram.trim()) specsObj.RAM = editForm.ram.trim();
      if (editForm.storage.trim()) specsObj.Storage = editForm.storage.trim();
      if (editForm.gpu.trim()) specsObj.Graphics = editForm.gpu.trim();
      if (editForm.display.trim()) specsObj.Display = editForm.display.trim();
      if (editForm.os.trim()) specsObj.OS = editForm.os.trim();
      if (editForm.warranty.trim()) specsObj.Warranty = editForm.warranty.trim();

      const finalImages = editForm.images.length > 0 ? editForm.images : (editForm.image ? [editForm.image] : []);
      const primaryImage = finalImages[0] || editForm.image;

      await updateProduct(id, {
        name: editForm.name,
        brand: editForm.brand,
        category: editForm.category,
        price: Number(editForm.price),
        originalPrice: editForm.originalPrice ? Number(editForm.originalPrice) : undefined,
        description: editForm.description,
        image: primaryImage,
        images: finalImages,
        features: parsedFeatures,
        specs: specsObj,
        warranty: editForm.warranty.trim() || "1 Year Onsite Hardware Service",
        stock: Number(editForm.stock) || 10,
      });
      setEditingId(null);
      toast.success("Product details, 5+ photos, and specifications updated successfully!");
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
    if (!newProduct.name.trim() || !newProduct.price) {
      toast.error("Please enter a product name and price.");
      return;
    }
    try {
      const parsedFeatures = newProduct.featuresText
        .split("\n")
        .map((f) => f.trim().replace(/^[\s•\-\*]+/, ""))
        .filter(Boolean);

      const specsObj: Record<string, string> = {};
      if (newProduct.processor.trim()) specsObj.Processor = newProduct.processor.trim();
      if (newProduct.ram.trim()) specsObj.RAM = newProduct.ram.trim();
      if (newProduct.storage.trim()) specsObj.Storage = newProduct.storage.trim();
      if (newProduct.gpu.trim()) specsObj.Graphics = newProduct.gpu.trim();
      if (newProduct.display.trim()) specsObj.Display = newProduct.display.trim();
      if (newProduct.os.trim()) specsObj.OS = newProduct.os.trim();
      if (newProduct.warranty.trim()) specsObj.Warranty = newProduct.warranty.trim();

      const finalImages = newProduct.images.length > 0
        ? newProduct.images
        : newProduct.image
        ? [newProduct.image]
        : [];

      const primaryImage = finalImages[0] || "";

      await addProduct({
        name: newProduct.name.trim(),
        brand: newProduct.brand.trim(),
        category: newProduct.category.trim() || "General",
        price: Number(newProduct.price),
        originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
        description: newProduct.description.trim(),
        image: primaryImage,
        images: finalImages,
        features: parsedFeatures,
        specs: specsObj,
        warranty: newProduct.warranty.trim() || "Standard Warranty",
        stock: Number(newProduct.stock) || 0,
        rating: 5.0,
        reviewCount: 0,
        featured: false,
      });

      setNewProduct(DEFAULT_NEW_PRODUCT);
      setShowAdd(false);
      toast.success("Product created successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add product.");
    }
  };

  // --- Service Functions ---
  const startEditService = (s: AdminService) => {
    setEditingServiceId(s.id);
    setEditServiceForm({
      name: s.name,
      price: s.price,
      description: s.description,
      icon: s.icon || "Wrench",
      features: Array.isArray(s.features) ? s.features.join("\n") : "",
    });
  };

  const saveServiceEdit = async (id: string) => {
    try {
      const parsedFeatures = editServiceForm.features
        .split("\n")
        .map((f) => f.replace(/^[\s•\-\*]+/, "").trim())
        .filter(Boolean);

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
          icon: editServiceForm.icon,
          features: parsedFeatures,
        }),
      });
      if (!res.ok) throw new Error("Failed to update service");
      toast.success("Service details and provided features updated.");
      setEditingServiceId(null);
      fetchAdminServices();
    } catch {
      toast.error("Failed to update service.");
    }
  };

  const handleAddService = async () => {
    if (!newService.name.trim() || !newService.price.trim()) {
      toast.error("Service name and pricing are required.");
      return;
    }
    try {
      const parsedFeatures = newService.features
        .split("\n")
        .map((f) => f.replace(/^[\s•\-\*]+/, "").trim())
        .filter(Boolean);

      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newService.name.trim(),
          price: newService.price.trim(),
          description: newService.description.trim(),
          icon: newService.icon || "Wrench",
          features: parsedFeatures,
        }),
      });
      if (!res.ok) throw new Error("Failed to add service");
      toast.success("New Service created successfully.");
      setNewService({ name: "", price: "", description: "", icon: "Wrench", features: "" });
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

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponent.name.trim() || !newComponent.price) {
      toast.error("Component name and price are required.");
      return;
    }
    try {
      const res = await fetch("/api/components", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newComponent.name.trim(),
          category: newComponent.category,
          price: Number(newComponent.price),
          brand: newComponent.brand.trim(),
          specs: newComponent.specs.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to add component");
      toast.success("Component added to PC Builder database successfully!");
      setNewComponent({ name: "", category: "processor", price: "", brand: "", specs: "" });
      setShowAddComponent(false);
      fetchAdminComponents();
    } catch (err: any) {
      toast.error(err.message || "Failed to add component.");
    }
  };

  const deleteComponent = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this component from the catalog?")) return;
    try {
      const res = await fetch(`/api/components/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete component");
      toast.success("Component removed.");
      fetchAdminComponents();
    } catch {
      toast.error("Failed to delete component.");
    }
  };


  const handleBulkBatchStatusUpdate = async () => {
    if (selectedBuildOrderIds.length === 0) {
      toast.error("Please select at least one build order.");
      return;
    }
    setBulkStatusUpdating(true);
    try {
      const res = await fetch("/api/orders/bulk-status", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderIds: selectedBuildOrderIds,
          status: bulkBatchStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update orders");
      toast.success(data.message || `Updated ${selectedBuildOrderIds.length} orders to ${bulkBatchStatus}!`);
      setSelectedBuildOrderIds([]);
      await fetchAllOrders(false);
    } catch (err: any) {
      toast.error(err.message || "Error updating bulk order status.");
    } finally {
      setBulkStatusUpdating(false);
    }
  };

  const handleBulkPrintInvoices = () => {
    if (selectedBuildOrderIds.length === 0) {
      toast.error("Please select orders to print.");
      return;
    }
    const ordersToPrint = buildOrders.filter((o) =>
      selectedBuildOrderIds.includes(o._id || o.orderId || "")
    );
    ordersToPrint.forEach((ord) => printOrderInvoice(ord));
    toast.success(`Sent ${ordersToPrint.length} invoices to printer preview.`);
  };

  const handleBulkDownloadPdfs = () => {
    if (selectedBuildOrderIds.length === 0) {
      toast.error("Please select orders to download.");
      return;
    }
    const ordersToDownload = buildOrders.filter((o) =>
      selectedBuildOrderIds.includes(o._id || o.orderId || "")
    );
    ordersToDownload.forEach((ord, idx) => {
      setTimeout(() => downloadOrderPdf(ord), idx * 250);
    });
    toast.success(`Downloading ${ordersToDownload.length} GST Invoices...`);
  };

  const handlePlaceBulkBuildOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPartsList = Object.entries(bulkSelections)
      .filter(([_, comp]) => Boolean(comp))
      .map(([cat, comp]) => ({
        category: cat,
        categoryLabel: cat.toUpperCase(),
        name: comp.name,
        price: Number(comp.price) || 0,
        specs: comp.specs || "",
      }));

    if (selectedPartsList.length === 0) {
      toast.error("Please choose at least 1 hardware component for this custom build.");
      return;
    }

    if (!bulkCustomer.name.trim() || !bulkCustomer.phone.trim()) {
      toast.error("Client name and contact phone are required.");
      return;
    }

    const qty = Math.max(1, Number(bulkBuildQty) || 1);
    const unitPrice = selectedPartsList.reduce((sum, p) => sum + p.price, 0);
    const rawSubtotal = unitPrice * qty;
    const discountAmt = Math.round((rawSubtotal * (Number(bulkDiscountPercent) || 0)) / 100);
    const grandTotal = Math.max(0, rawSubtotal - discountAmt);

    setBulkSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isBulkOrder: true,
          bulkQuantity: qty,
          customer: {
            name: bulkCustomer.name.trim(),
            company: bulkCustomer.company.trim(),
            gstin: bulkCustomer.gstin.trim(),
            email: bulkCustomer.email.trim() || "orders@gadgetzone.in",
            phone: bulkCustomer.phone.trim(),
          },
          shippingAddress: {
            address: bulkCustomer.address.trim() || "Commercial Delivery Depot",
            city: bulkCustomer.city.trim() || "Chennai",
            state: bulkCustomer.state.trim() || "Tamil Nadu",
            pincode: bulkCustomer.pincode.trim() || "600107",
          },
          items: [
            {
              type: "build",
              productId: `build-bulk-${Date.now()}`,
              name: `Custom Bulk PC Build (${qty} Systems)${bulkCustomer.company ? ` - ${bulkCustomer.company}` : ""}`,
              price: Math.round(grandTotal / qty),
              quantity: qty,
              parts: selectedPartsList,
            },
          ],
          subtotal: grandTotal,
          grandTotal: grandTotal,
          paymentMethod: bulkCustomer.paymentMethod,
          paymentStatus: bulkCustomer.paymentStatus,
          orderStatus: bulkCustomer.orderStatus,
          notes: bulkAssemblyNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to place bulk build order");

      toast.success(`Bulk PC Order placed successfully! Order ID: #${data.order?.orderId || data.orderId || "NEW"}`);
      setShowBulkOrderModal(false);
      // Reset form
      setBulkSelections({
        processor: null,
        motherboard: null,
        ram: null,
        storage: null,
        gpu: null,
        psu: null,
        cooling: null,
        case: null,
      });
      setBulkBuildQty(5);
      setBulkDiscountPercent(0);
      setBulkAssemblyNotes("");
      await fetchAllOrders(false);
    } catch (err: any) {
      toast.error(err.message || "Error submitting bulk build order.");
    } finally {
      setBulkSubmitting(false);
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
              <ShieldCheck className="h-3 w-3 text-purple-400" /> Management Console
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
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-border mb-8 overflow-x-auto no-scrollbar gap-1 sm:gap-2 pb-1">
        {[
          { id: "products", label: "Products" },
          { id: "services", label: "Services", icon: Wrench },
          {
            id: "service-bookings",
            label: "Service Bookings",
            icon: CalendarCheck,
            badge: serviceBookings.filter((b) => (b.bookingStatus || b.status) === "Pending" || (b.bookingStatus || b.status) === "Pending Review").length,
          },
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
              <span>{tab.label}</span>
              {Boolean(tab.badge && tab.badge > 0) && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCTS PRICING & EDITING */}
      {activeTab === "products" && (
        <>
          {showAdd && (
            <div className="rounded-2xl border border-primary/20 bg-card/90 backdrop-blur-md p-6 mb-8 space-y-6 animate-fade-in-up shadow-xl shadow-purple-950/20">
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                    <Package className="h-5 w-5 text-primary" /> Add New Product
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Upload 5+ photos at the same time directly from your device, configure specifications, and point-wise highlights.
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* 1. Basic Product Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span>1. Product Basics & Pricing</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs font-semibold">Product Title / Name *</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. HP 15s Intel Core i5 12th Gen Thin & Light Laptop"
                      className="bg-background/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Brand</Label>
                    <Input
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct((p) => ({ ...p, brand: e.target.value }))}
                      placeholder="e.g. HP, Dell, ASUS"
                      className="bg-background/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Category</Label>
                    <Input
                      value={newProduct.category}
                      onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. Laptops, Desktops"
                      className="bg-background/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold flex items-center gap-1">
                      <IndianRupee className="h-3 w-3 text-emerald-400" /> Selling Price (₹) *
                    </Label>
                    <Input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))}
                      placeholder="49999"
                      className="bg-background/80"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold">Original / MRP Price (₹)</Label>
                    <Input
                      type="number"
                      value={newProduct.originalPrice}
                      onChange={(e) => setNewProduct((p) => ({ ...p, originalPrice: e.target.value }))}
                      placeholder="68990"
                      className="bg-background/80"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Multi-Image Showcase (Upload 5+ Photos At The Same Time) */}
              <div className="space-y-3 border-t border-border/40 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Images className="h-4 w-4 text-purple-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      2. Product Photos (Select 5+ at once)
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        newProduct.images.length >= 5
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          : newProduct.images.length > 0
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {newProduct.images.length} Photo{newProduct.images.length !== 1 ? "s" : ""} Added
                    </span>
                  </div>

                  {/* Prominent Multi-Photo Upload Button */}
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-md">
                    <Upload className="h-4 w-4" />
                    <span>Upload Photos (Select 5+ at once)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleMultipleImageUpload(e, (urls) =>
                          setNewProduct((p) => {
                            const combined = [...p.images, ...urls];
                            return {
                              ...p,
                              images: combined,
                              image: p.image || combined[0] || "",
                            };
                          })
                        )
                      }
                    />
                  </label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Hold Ctrl (Windows) or Cmd (Mac) in your file dialog to select 5 or more photos at the same time. The first photo (#1) is the main catalog cover.
                </p>

                {/* Thumbnail Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 p-3 bg-muted/20 rounded-xl border border-border min-h-[120px]">
                  {newProduct.images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-border/80 bg-background/60 aspect-square flex flex-col items-center justify-center shadow-sm"
                    >
                      <img
                        src={imgUrl}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      {idx === 0 ? (
                        <span className="absolute top-1.5 left-1.5 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-purple-600 text-white shadow">
                          #1 Cover
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setNewProduct((p) => {
                              const next = [...p.images];
                              const [selected] = next.splice(idx, 1);
                              next.unshift(selected);
                              return { ...p, images: next, image: next[0] };
                            });
                          }}
                          className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] bg-black/80 hover:bg-purple-600 text-white font-bold py-1 rounded text-center"
                        >
                          Set Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setNewProduct((p) => {
                            const next = p.images.filter((_, i) => i !== idx);
                            return { ...p, images: next, image: next[0] || "" };
                          });
                        }}
                        className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white p-1 rounded-full shadow hover:bg-destructive/90"
                        title="Remove photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add More Photos Dropzone */}
                  <label className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl aspect-square flex flex-col items-center justify-center cursor-pointer bg-background/40 hover:bg-primary/5 transition-all p-2 text-center group">
                    <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary mb-1 transition-colors" />
                    <span className="text-[11px] font-bold text-foreground">Add Photos</span>
                    <span className="text-[9px] text-muted-foreground">Select multiple (5+)</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleMultipleImageUpload(e, (urls) =>
                          setNewProduct((p) => {
                            const combined = [...p.images, ...urls];
                            return {
                              ...p,
                              images: combined,
                              image: p.image || combined[0] || "",
                            };
                          })
                        )
                      }
                    />
                  </label>
                </div>
              </div>

              {/* 3. Product Highlights (Point-Wise) */}
              <div className="space-y-2 border-t border-border/40 pt-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    3. Key Feature Highlights (1 Point Per Line)
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Each line appears on the right side of the customer product page with a checkmark icon.
                </p>
                <Textarea
                  value={newProduct.featuresText}
                  onChange={(e) => setNewProduct((p) => ({ ...p, featuresText: e.target.value }))}
                  placeholder="Enter point-wise highlights (one bullet per line)..."
                  rows={4}
                  className="bg-background/80 font-mono text-xs"
                />
              </div>

              {/* 4. Technical Specifications Grid */}
              <div className="space-y-3 border-t border-border/40 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <Cpu className="h-4 w-4 text-sky-400" />
                  <span>4. Technical Specifications (Specifications Table)</span>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Processor</Label>
                    <Input
                      value={newProduct.processor}
                      onChange={(e) => setNewProduct((p) => ({ ...p, processor: e.target.value }))}
                      placeholder="e.g. Intel Core i5 12th Gen"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">RAM</Label>
                    <Input
                      value={newProduct.ram}
                      onChange={(e) => setNewProduct((p) => ({ ...p, ram: e.target.value }))}
                      placeholder="e.g. 8 GB DDR4"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Storage (SSD)</Label>
                    <Input
                      value={newProduct.storage}
                      onChange={(e) => setNewProduct((p) => ({ ...p, storage: e.target.value }))}
                      placeholder="e.g. 500 GB NVMe SSD"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Graphics Card</Label>
                    <Input
                      value={newProduct.gpu}
                      onChange={(e) => setNewProduct((p) => ({ ...p, gpu: e.target.value }))}
                      placeholder="e.g. 1080 Graphic Card"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Display</Label>
                    <Input
                      value={newProduct.display}
                      onChange={(e) => setNewProduct((p) => ({ ...p, display: e.target.value }))}
                      placeholder='e.g. 15.6" Full HD (1920x1080)'
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Operating System</Label>
                    <Input
                      value={newProduct.os}
                      onChange={(e) => setNewProduct((p) => ({ ...p, os: e.target.value }))}
                      placeholder="e.g. Windows 11 Home 64-bit"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Warranty</Label>
                    <Input
                      value={newProduct.warranty}
                      onChange={(e) => setNewProduct((p) => ({ ...p, warranty: e.target.value }))}
                      placeholder="e.g. 1 Year Onsite Hardware Service"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold">Available Stock</Label>
                    <Input
                      type="number"
                      value={newProduct.stock}
                      onChange={(e) => setNewProduct((p) => ({ ...p, stock: e.target.value }))}
                      placeholder="Stock count"
                      className="bg-background/80 text-xs h-8"
                    />
                  </div>
                </div>
              </div>

              {/* 5. Detailed Description */}
              <div className="space-y-1 border-t border-border/40 pt-4">
                <Label className="text-xs font-semibold">Product Description</Label>
                <Textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Enter full product description..."
                  rows={3}
                  className="bg-background/80 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button onClick={handleAdd} className="gap-2 font-bold px-6">
                  <Save className="h-4 w-4" /> Save & Publish Product
                </Button>
                <Button variant="outline" onClick={() => setShowAdd(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-8">
            {products.length === 0 && !showAdd && (
              <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-card/40 my-6">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-60" />
                <h3 className="font-bold text-lg mb-1">No products in catalog</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
                  Your store catalog is currently empty. Click the button below to add a product.
                </p>
                <Button onClick={() => setShowAdd(true)} className="rounded-xl gap-1.5 font-bold">
                  <Plus className="h-4 w-4" /> Add Product
                </Button>
              </div>
            )}

            {Object.entries(
              products.reduce((acc, current) => {
                const cat = current.category || "Uncategorized";
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(current);
                return acc;
              }, {} as Record<string, Product[]>)
            ).map(([category, catProducts]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center justify-between px-2 mt-6 mb-3">
                  <h2 className="text-xl font-bold uppercase tracking-wider text-muted-foreground">
                    {category} ({catProducts.length})
                  </h2>
                </div>

                {catProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    className="rounded-2xl border bg-card p-5 animate-fade-in-up transition-all hover:border-primary/40 shadow-sm"
                    style={{ animationDelay: `${0.03 * idx}s` }}
                  >
                    {editingId === p.id ? (
                      /* EDIT PRODUCT FORM */
                      <div className="space-y-5">
                        <div className="flex items-center justify-between border-b border-border/60 pb-3">
                          <h3 className="font-bold text-base flex items-center gap-2">
                            <Pencil className="h-4 w-4 text-primary" /> Edit Product: {p.name}
                          </h3>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => saveEdit(p.id)} className="gap-1.5 font-bold">
                              <Save className="h-3.5 w-3.5" /> Save Changes
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="space-y-1 sm:col-span-2">
                            <Label className="text-xs font-semibold">Product Title</Label>
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Brand</Label>
                            <Input
                              value={editForm.brand}
                              onChange={(e) => setEditForm((f) => ({ ...f, brand: e.target.value }))}
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Category</Label>
                            <Input
                              value={editForm.category}
                              onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold flex items-center gap-1">
                              <IndianRupee className="h-3 w-3 text-emerald-400" /> Selling Price (₹)
                            </Label>
                            <Input
                              type="number"
                              value={editForm.price}
                              onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value }))}
                              className="text-xs h-8"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs font-semibold">Original / MRP Price (₹)</Label>
                            <Input
                              type="number"
                              value={editForm.originalPrice}
                              onChange={(e) => setEditForm((f) => ({ ...f, originalPrice: e.target.value }))}
                              className="text-xs h-8"
                            />
                          </div>
                        </div>

                        {/* Multi-Image Upload (Select 5+ at once) */}
                        <div className="space-y-2 border-t border-border/40 pt-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Images className="h-4 w-4 text-purple-400" />
                              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Product Photos ({editForm.images.length} Photos)
                              </Label>
                            </div>
                            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all shadow-sm">
                              <Upload className="h-3 w-3" />
                              <span>Upload Photos (Select 5+ at once)</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleMultipleImageUpload(e, (urls) =>
                                    setEditForm((f) => {
                                      const combined = [...f.images, ...urls];
                                      return {
                                        ...f,
                                        images: combined,
                                        image: f.image || combined[0] || "",
                                      };
                                    })
                                  )
                                }
                              />
                            </label>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 p-2 bg-muted/20 rounded-xl border border-border min-h-[100px]">
                            {editForm.images.map((imgUrl, idx) => (
                              <div
                                key={idx}
                                className="relative group rounded-lg overflow-hidden border border-border aspect-square flex items-center justify-center bg-background"
                              >
                                <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                                {idx === 0 ? (
                                  <span className="absolute top-1 left-1 text-[8px] font-extrabold px-1 py-0.2 rounded bg-purple-600 text-white shadow">
                                    #1 Cover
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditForm((f) => {
                                        const next = [...f.images];
                                        const [selected] = next.splice(idx, 1);
                                        next.unshift(selected);
                                        return { ...f, images: next, image: next[0] };
                                      });
                                    }}
                                    className="absolute bottom-1 left-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] bg-black/80 hover:bg-purple-600 text-white font-bold py-0.5 rounded text-center"
                                  >
                                    Set Cover
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditForm((f) => {
                                      const next = f.images.filter((_, i) => i !== idx);
                                      return { ...f, images: next, image: next[0] || "" };
                                    });
                                  }}
                                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-white p-0.5 rounded-full shadow"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}

                            <label className="border-2 border-dashed border-border hover:border-primary rounded-lg aspect-square flex flex-col items-center justify-center cursor-pointer bg-background/50 hover:bg-primary/5 transition-all p-1 text-center">
                              <Upload className="h-5 w-5 text-muted-foreground mb-0.5" />
                              <span className="text-[10px] font-bold">Add Photos</span>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleMultipleImageUpload(e, (urls) =>
                                    setEditForm((f) => {
                                      const combined = [...f.images, ...urls];
                                      return {
                                        ...f,
                                        images: combined,
                                        image: f.image || combined[0] || "",
                                      };
                                    })
                                  )
                                }
                              />
                            </label>
                          </div>
                        </div>

                        {/* Highlights */}
                        <div className="space-y-1 border-t border-border/40 pt-3">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Key Feature Highlights (1 point per line)
                          </Label>
                          <Textarea
                            value={editForm.featuresText}
                            onChange={(e) => setEditForm((f) => ({ ...f, featuresText: e.target.value }))}
                            rows={3}
                            className="bg-background/80 font-mono text-xs"
                          />
                        </div>

                        {/* Specs */}
                        <div className="space-y-2 border-t border-border/40 pt-3">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Cpu className="h-3.5 w-3.5 text-sky-400" /> Technical Specifications
                          </Label>
                          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
                            <Input
                              value={editForm.processor}
                              onChange={(e) => setEditForm((f) => ({ ...f, processor: e.target.value }))}
                              placeholder="Processor"
                              className="text-xs h-8"
                            />
                            <Input
                              value={editForm.ram}
                              onChange={(e) => setEditForm((f) => ({ ...f, ram: e.target.value }))}
                              placeholder="RAM"
                              className="text-xs h-8"
                            />
                            <Input
                              value={editForm.storage}
                              onChange={(e) => setEditForm((f) => ({ ...f, storage: e.target.value }))}
                              placeholder="Storage"
                              className="text-xs h-8"
                            />
                            <Input
                              value={editForm.gpu}
                              onChange={(e) => setEditForm((f) => ({ ...f, gpu: e.target.value }))}
                              placeholder="Graphics Card"
                              className="text-xs h-8"
                            />
                            <Input
                              value={editForm.display}
                              onChange={(e) => setEditForm((f) => ({ ...f, display: e.target.value }))}
                              placeholder="Display"
                              className="text-xs h-8"
                            />
                            <Input
                              value={editForm.os}
                              onChange={(e) => setEditForm((f) => ({ ...f, os: e.target.value }))}
                              placeholder="Operating System"
                              className="text-xs h-8"
                            />
                            <Input
                              value={editForm.warranty}
                              onChange={(e) => setEditForm((f) => ({ ...f, warranty: e.target.value }))}
                              placeholder="Warranty"
                              className="text-xs h-8"
                            />
                            <Input
                              type="number"
                              value={editForm.stock}
                              onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))}
                              placeholder="Stock"
                              className="text-xs h-8"
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1 border-t border-border/40 pt-3">
                          <Label className="text-xs font-semibold">Description</Label>
                          <Textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                            rows={2}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      /* PRODUCT CARD (NON-EDITING) */
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative shrink-0">
                            {p.image || (Array.isArray(p.images) && p.images[0]) ? (
                              <img
                                src={p.image || p.images![0]}
                                alt={p.name}
                                className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover border border-border shadow-sm"
                              />
                            ) : (
                              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl bg-muted/40 border border-border flex flex-col items-center justify-center text-muted-foreground">
                                <Camera className="h-6 w-6 stroke-1" />
                                <span className="text-[9px] mt-0.5">No Photo</span>
                              </div>
                            )}
                            {Array.isArray(p.images) && p.images.length > 1 && (
                              <span className="absolute bottom-1 right-1 bg-black/80 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full border border-white/20">
                                📸 {p.images.length}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {p.brand && (
                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                                  {p.brand}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground font-medium">
                                {p.category}
                              </span>
                            </div>

                            <h3 className="font-bold text-sm sm:text-base text-foreground truncate max-w-md">
                              {p.name}
                            </h3>

                            {/* Spec Pills */}
                            <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                              {p.specs?.Processor && (
                                <span className="bg-muted/60 px-1.5 py-0.5 rounded border text-[10px]">
                                  ⚡ {p.specs.Processor}
                                </span>
                              )}
                              {p.specs?.RAM && (
                                <span className="bg-muted/60 px-1.5 py-0.5 rounded border text-[10px]">
                                  🧠 {p.specs.RAM}
                                </span>
                              )}
                              {p.specs?.Storage && (
                                <span className="bg-muted/60 px-1.5 py-0.5 rounded border text-[10px]">
                                  💾 {p.specs.Storage}
                                </span>
                              )}
                              {p.specs?.Graphics && (
                                <span className="bg-muted/60 px-1.5 py-0.5 rounded border text-[10px]">
                                  🎮 {p.specs.Graphics}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                          <div className="text-right">
                            <div className="font-mono font-extrabold text-emerald-400 text-lg">
                              ₹{p.price.toLocaleString()}
                            </div>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <div className="text-xs text-muted-foreground line-through">
                                ₹{p.originalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1.5 text-xs font-semibold"
                              onClick={() => startEdit(p)}
                              title="Edit Full Product & Photos"
                            >
                              <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => handleDelete(p.id)}
                              title="Delete Product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
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
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wrench className="h-6 w-6 text-purple-400" />
                <span>Services Management & Pricing</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Add and edit repair, CCTV, and tech services. Configure icons and point-wise provided services shown to customers.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchAdminServices();
                  toast.success("Services reloaded.");
                }}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddService(!showAddService)}
                className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer text-xs font-semibold"
              >
                {showAddService ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showAddService ? "Cancel" : "Add New Service"}
              </Button>
            </div>
          </div>

          {/* Form: Add New Service */}
          {showAddService && (
            <div className="rounded-2xl border border-purple-500/30 bg-card p-6 shadow-md animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4 text-purple-400" />
                  <span>Create New Service</span>
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddService(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Service Name *</Label>
                  <Input
                    value={newService.name}
                    onChange={(e) => setNewService((s) => ({ ...s, name: e.target.value }))}
                    placeholder="e.g. Printer Repair & Service"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Pricing (e.g. From ₹799) *</Label>
                  <Input
                    value={newService.price}
                    onChange={(e) => setNewService((s) => ({ ...s, price: e.target.value }))}
                    placeholder="e.g. From ₹799"
                    className="h-9"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Service Icon *</Label>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const SelectedIcon = getAdminServiceIcon(newService.icon);
                      return (
                        <div className="w-9 h-9 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                          <SelectedIcon className="h-5 w-5" />
                        </div>
                      );
                    })()}
                    <select
                      value={newService.icon}
                      onChange={(e) => setNewService((s) => ({ ...s, icon: e.target.value }))}
                      className="w-full h-9 px-2.5 rounded-lg bg-secondary text-foreground text-xs border border-border focus:outline-none focus:ring-1 focus:ring-purple-500 font-medium"
                    >
                      {SERVICE_ICON_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Short Description *</Label>
                <Textarea
                  value={newService.description}
                  onChange={(e) => setNewService((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Provide a concise 1-2 sentence overview of what this service covers..."
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Provided Services / Features (Point-Wise, 1 per line) *</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground">Each line becomes an individual bullet with check icon</span>
                </div>
                <Textarea
                  value={newService.features}
                  onChange={(e) => setNewService((s) => ({ ...s, features: e.target.value }))}
                  placeholder={"• Free comprehensive diagnostic inspection\n• Original branded replacement parts\n• 48-hour quick turnaround guarantee\n• 90-day post-service warranty coverage"}
                  rows={4}
                  className="text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddService(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleAddService}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> Create Service
                </Button>
              </div>
            </div>
          )}

          {/* Services List */}
          {servicesLoading ? (
            <div className="py-20 text-center bg-card rounded-2xl border border-border">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Fetching services...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="py-16 text-center bg-card rounded-2xl border border-border">
              <Wrench className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="font-semibold text-base">No Services Found</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Click "Add New Service" above to add your first tech repair or installation offering.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {services.map((s, idx) => {
                const ServiceIcon = getAdminServiceIcon(s.icon);
                const isEditing = editingServiceId === s.id;
                const featuresList = Array.isArray(s.features) ? s.features.filter(Boolean) : [];

                return (
                  <div
                    key={s.id || idx}
                    className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:border-purple-500/30 animate-fade-in-up"
                    style={{ animationDelay: `${0.04 * idx}s` }}
                  >
                    {isEditing ? (
                      /* Edit Mode Form */
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                          <h4 className="font-bold text-sm text-purple-400 flex items-center gap-2">
                            <Pencil className="h-4 w-4" />
                            <span>Edit Service: {s.name}</span>
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingServiceId(null)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Service Name</Label>
                            <Input
                              value={editServiceForm.name}
                              onChange={(e) =>
                                setEditServiceForm((f) => ({ ...f, name: e.target.value }))
                              }
                              className="h-8 font-semibold"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Pricing Text</Label>
                            <Input
                              value={editServiceForm.price}
                              onChange={(e) =>
                                setEditServiceForm((f) => ({ ...f, price: e.target.value }))
                              }
                              className="h-8"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">Service Icon</Label>
                            <div className="flex items-center gap-2">
                              {(() => {
                                const IconPreview = getAdminServiceIcon(editServiceForm.icon);
                                return (
                                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                                    <IconPreview className="h-4 w-4" />
                                  </div>
                                );
                              })()}
                              <select
                                value={editServiceForm.icon}
                                onChange={(e) =>
                                  setEditServiceForm((f) => ({ ...f, icon: e.target.value }))
                                }
                                className="w-full h-8 px-2 rounded-lg bg-secondary text-foreground text-xs border border-border"
                              >
                                {SERVICE_ICON_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Short Description</Label>
                          <Textarea
                            value={editServiceForm.description}
                            onChange={(e) =>
                              setEditServiceForm((f) => ({ ...f, description: e.target.value }))
                            }
                            rows={2}
                            className="text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-semibold text-purple-400 flex items-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Provided Services / Features (Point-Wise, 1 per line)</span>
                          </Label>
                          <Textarea
                            value={editServiceForm.features}
                            onChange={(e) =>
                              setEditServiceForm((f) => ({ ...f, features: e.target.value }))
                            }
                            rows={4}
                            className="text-xs font-mono"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2 border-t border-border">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingServiceId(null)}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => saveServiceEdit(s.id)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1 font-semibold"
                          >
                            <Save className="h-3.5 w-3.5 mr-1" /> Save Changes
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode Card with Icon + Title + Description + Point-Wise Features */
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Service Icon Badge */}
                          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner shrink-0 mt-0.5">
                            <ServiceIcon className="h-6 w-6 stroke-[2]" />
                          </div>

                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-bold text-base text-foreground tracking-tight">
                                {s.name}
                              </h3>
                              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                                {s.icon || "Wrench"}
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {s.description}
                            </p>

                            {/* Provided Services (Point-Wise) */}
                            {featuresList.length > 0 && (
                              <div className="pt-2 mt-2 border-t border-border/50">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                                  Provided Services / Key Highlights ({featuresList.length} points):
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs">
                                  {featuresList.map((feat, fIdx) => (
                                    <div key={fIdx} className="flex items-start gap-1.5 text-foreground/90 font-medium">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                      <span className="leading-snug">{feat}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Price and Action Buttons */}
                        <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                          <span className="font-display font-extrabold text-emerald-400 text-lg sm:text-xl">
                            {s.price}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-2.5 text-xs font-semibold gap-1 border-purple-500/30 text-purple-400 hover:bg-purple-500/10 cursor-pointer"
                              onClick={() => startEditService(s)}
                              title="Edit Service Details, Icon & Features"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                              onClick={() => handleDeleteService(s.id)}
                              title="Delete Service"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

            {/* TAB: SERVICE BOOKINGS MANAGEMENT */}
      {activeTab === "service-bookings" && (
        <div className="space-y-6 animate-fade-in-up">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  <CalendarCheck className="h-3 w-3 text-purple-400" /> Service Desk
                </span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Sync (15s auto-refresh)
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <span>Customer Service Bookings</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Manage incoming customer repair & installation requests, confirm appointments, assign engineers, and update live progress.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchAdminServiceBookings();
                  toast.success("Service bookings reloaded.");
                }}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab("services")}
                className="gap-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold border border-border cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5" /> Manage Services Catalog
              </Button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card p-4 rounded-xl border border-border space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">Total Bookings</span>
              <p className="text-2xl font-black text-foreground">{serviceBookings.length}</p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-amber-400 uppercase">Pending Review</span>
              <p className="text-2xl font-black text-amber-400">
                {serviceBookings.filter((b) => {
                  const s = b.bookingStatus || b.status;
                  return s === "Pending Review" || s === "Pending";
                }).length}
              </p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-purple-400 uppercase">In Progress</span>
              <p className="text-2xl font-black text-purple-400">
                {serviceBookings.filter((b) => (b.bookingStatus || b.status) === "In Progress").length}
              </p>
            </div>
            <div className="bg-card p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
              <span className="text-[11px] font-semibold text-emerald-400 uppercase">Completed</span>
              <p className="text-2xl font-black text-emerald-400">
                {serviceBookings.filter((b) => (b.bookingStatus || b.status) === "Completed").length}
              </p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID (#GZ-SRV-...), customer, phone, or service..."
                value={serviceBookingsSearch}
                onChange={(e) => setServiceBookingsSearch(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {["All", "Pending", "Confirmed", "In Progress", "Completed", "Cancelled"].map((st) => {
                const count = serviceBookings.filter((b) => {
                  const bStatus = b.bookingStatus || b.status;
                  if (st === "All") return true;
                  if (st === "Pending") return bStatus === "Pending" || bStatus === "Pending Review";
                  return bStatus === st;
                }).length;
                return (
                  <button
                    key={st}
                    onClick={() => setServiceBookingsFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 ${
                      serviceBookingsFilter === st
                        ? "bg-purple-600 text-white border-purple-500 shadow-sm"
                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                    }`}
                  >
                    <span>{st}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        serviceBookingsFilter === st
                          ? "bg-white/20 text-white font-bold"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bookings Table */}
          {serviceBookingsLoading ? (
            <div className="py-20 text-center text-muted-foreground">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-purple-400" />
              <p className="text-xs">Loading customer service bookings...</p>
            </div>
          ) : (() => {
            const filtered = serviceBookings.filter((b) => {
              const currentStatus = b.bookingStatus || b.status;
              if (serviceBookingsFilter !== "All") {
                if (serviceBookingsFilter === "Pending") {
                  if (currentStatus !== "Pending" && currentStatus !== "Pending Review") return false;
                } else if (currentStatus !== serviceBookingsFilter) {
                  return false;
                }
              }
              if (serviceBookingsSearch.trim()) {
                const q = serviceBookingsSearch.toLowerCase();
                const matchId = (b.bookingId || "").toLowerCase().includes(q);
                const matchName = (b.customerName || "").toLowerCase().includes(q);
                const matchPhone1 = (b.primaryPhone || b.phone1 || "").toLowerCase().includes(q);
                const matchPhone2 = (b.alternatePhone || b.phone2 || "").toLowerCase().includes(q);
                const matchService = (b.serviceName || "").toLowerCase().includes(q);
                const matchAddress = (b.address || "").toLowerCase().includes(q);
                const matchPurpose = (b.bookingPurpose || b.purpose || "").toLowerCase().includes(q);
                const matchEngineer = (b.assignedEngineer || b.assignedTechnician || "").toLowerCase().includes(q);
                if (!matchId && !matchName && !matchPhone1 && !matchPhone2 && !matchService && !matchAddress && !matchPurpose && !matchEngineer) {
                  return false;
                }
              }
              return true;
            });

            if (filtered.length === 0) {
              return (
                <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border p-8">
                  <CalendarCheck className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <h4 className="text-base font-bold mb-1">No Service Bookings Found</h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {serviceBookingsSearch || serviceBookingsFilter !== "All"
                      ? "No bookings match your current search or status filter."
                      : "When customers book repairs or installations on the website, they will appear here with instant workflow controls."}
                  </p>
                </div>
              );
            }

            return (
              <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse min-w-[950px]">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-3 px-3.5">Booking ID</th>
                        <th className="py-3 px-3.5">Customer</th>
                        <th className="py-3 px-3.5">Service & Price</th>
                        <th className="py-3 px-3.5">Schedule Slot</th>
                        <th className="py-3 px-3.5">Booking Date</th>
                        <th className="py-3 px-3.5">Status</th>
                        <th className="py-3 px-3.5">Assigned Engineer</th>
                        <th className="py-3 px-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filtered.map((b) => {
                        const status = b.bookingStatus || b.status || "Pending Review";
                        const isPending = status === "Pending Review" || status === "Pending";
                        const isConfirmed = status === "Confirmed";
                        const isInProgress = status === "In Progress";
                        const isCompleted = status === "Completed";
                        const isCancelled = status === "Cancelled";

                        return (
                          <tr key={b._id} className="hover:bg-muted/20 transition-colors">
                            {/* Booking ID */}
                            <td className="py-3 px-3.5 align-top whitespace-nowrap">
                              <span className="font-mono font-bold text-sky-400 block text-xs">
                                #{b.bookingId}
                              </span>
                            </td>

                            {/* Customer Name, Phones, Address */}
                            <td className="py-3 px-3.5 align-top max-w-[200px]">
                              <span className="font-bold text-foreground block truncate">
                                {b.customerName}
                              </span>
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                <a
                                  href={`tel:${b.primaryPhone || b.phone1}`}
                                  className="text-emerald-400 hover:underline text-[11px] font-mono font-semibold"
                                  title="Click to call primary phone"
                                >
                                  {b.primaryPhone || b.phone1}
                                </a>
                                {(b.alternatePhone || b.phone2) && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    • {b.alternatePhone || b.phone2}
                                  </span>
                                )}
                              </div>
                              <p
                                className="text-[10px] text-muted-foreground truncate mt-0.5"
                                title={b.address}
                              >
                                {b.address}
                              </p>
                            </td>

                            {/* Service Name & Price */}
                            <td className="py-3 px-3.5 align-top max-w-[190px]">
                              <span className="font-semibold text-foreground block truncate">
                                {b.serviceName}
                              </span>
                              <span className="text-emerald-400 font-extrabold text-[11px] block mt-0.5">
                                {b.servicePrice ? (b.servicePrice.startsWith("₹") ? b.servicePrice : `₹${b.servicePrice}`) : "Quote on Site"}
                              </span>
                              {(b.bookingPurpose || b.purpose) && (
                                <p
                                  className="text-[10px] text-muted-foreground/80 truncate mt-0.5"
                                  title={b.bookingPurpose || b.purpose}
                                >
                                  {b.bookingPurpose || b.purpose}
                                </p>
                              )}
                              {b.rating ? (
                                <div
                                  className="flex items-center gap-1 mt-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit"
                                  title={b.reviewComment || "Customer Rating"}
                                >
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span>{b.rating} / 5</span>
                                </div>
                              ) : null}
                            </td>

                            {/* Preferred Date & Time */}
                            <td className="py-3 px-3.5 align-top whitespace-nowrap">
                              <span className="text-foreground font-medium block">
                                📅 {b.preferredDate || b.bookingDate || "Flexible"}
                              </span>
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                ⏰ {b.preferredTime || "Anytime"}
                              </span>
                            </td>

                            {/* Booking Date (Creation) */}
                            <td className="py-3 px-3.5 align-top whitespace-nowrap text-muted-foreground text-[11px]">
                              {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent"}
                            </td>

                            {/* Status */}
                            <td className="py-3 px-3.5 align-top whitespace-nowrap">
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                                  <Clock className="h-3 w-3" /> Pending Review
                                </span>
                              )}
                              {isConfirmed && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                                  <Check className="h-3 w-3" /> Confirmed
                                </span>
                              )}
                              {isInProgress && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400">
                                  <Wrench className="h-3 w-3" /> In Progress
                                </span>
                              )}
                              {isCompleted && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" /> Completed
                                </span>
                              )}
                              {isCancelled && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                                  <XCircle className="h-3 w-3" /> Cancelled
                                </span>
                              )}
                            </td>

                            {/* Assigned Engineer */}
                            <td className="py-3 px-3.5 align-top max-w-[140px]">
                              <button
                                onClick={() =>
                                  setAssigningEngineerModal({
                                    id: b._id,
                                    bookingId: b.bookingId,
                                    engineerName: b.assignedEngineer || b.assignedTechnician || "",
                                  })
                                }
                                className="text-left w-full hover:opacity-80 transition-opacity"
                                title="Click to assign or change engineer"
                              >
                                {b.assignedEngineer || b.assignedTechnician ? (
                                  <span className="text-xs font-semibold text-purple-300 block truncate">
                                    {b.assignedEngineer || b.assignedTechnician}
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground/60 italic underline">
                                    + Assign Engineer
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Actions Column */}
                            <td className="py-3 px-3.5 align-top text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                {/* View Details Button */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setViewingBookingDetails(b)}
                                  className="h-7 px-2 text-[11px] font-semibold gap-1 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 cursor-pointer"
                                  title="View full booking & customer details"
                                >
                                  <Eye className="h-3 w-3" /> View
                                </Button>

                                {/* Workflow Quick Progression */}
                                {isPending && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateBookingStatus(b._id, "Confirmed")}
                                    className="h-7 px-2 text-[11px] font-bold gap-1 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer"
                                    title="Confirm Booking"
                                  >
                                    <Check className="h-3 w-3" /> Confirm
                                  </Button>
                                )}

                                {isConfirmed && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateBookingStatus(b._id, "In Progress")}
                                    className="h-7 px-2 text-[11px] font-bold gap-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                                    title="Start Service"
                                  >
                                    <Play className="h-3 w-3" /> Start
                                  </Button>
                                )}

                                {isInProgress && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateBookingStatus(b._id, "Completed")}
                                    className="h-7 px-2 text-[11px] font-bold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                    title="Complete Service"
                                  >
                                    <CheckCircle2 className="h-3 w-3" /> Complete
                                  </Button>
                                )}

                                {/* Admin Notes */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setEditingAdminNotesModal({
                                      id: b._id,
                                      bookingId: b.bookingId,
                                      adminNotes: b.adminNotes || b.technicianNotes || "",
                                    })
                                  }
                                  className="h-7 w-7 p-0 text-amber-400 hover:bg-amber-500/10 cursor-pointer"
                                  title="Admin Internal Notes"
                                >
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>

                                {/* Assign Engineer Icon */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setAssigningEngineerModal({
                                      id: b._id,
                                      bookingId: b.bookingId,
                                      engineerName: b.assignedEngineer || b.assignedTechnician || "",
                                    })
                                  }
                                  className="h-7 w-7 p-0 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                                  title="Assign Engineer"
                                >
                                  <UserCheck className="h-3.5 w-3.5" />
                                </Button>

                                {/* Cancel Booking (if active) */}
                                {!isCompleted && !isCancelled && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() =>
                                      setCancellingBookingModal({
                                        id: b._id,
                                        bookingId: b.bookingId,
                                        reason: "",
                                      })
                                    }
                                    className="h-7 w-7 p-0 text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                    title="Cancel Booking"
                                  >
                                    <XCircle className="h-3.5 w-3.5" />
                                  </Button>
                                )}

                                {/* Print */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => printServiceJobCard(b)}
                                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
                                  title="Print Service Job Sheet"
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Button>

                                {/* Direct WhatsApp */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openCustomerWhatsApp(b)}
                                  className="h-7 w-7 p-0 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
                                  title="Message customer on WhatsApp"
                                >
                                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                                  </svg>
                                </Button>

                                {/* Delete */}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteBooking(b._id, b.bookingId)}
                                  className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                                  title="Delete booking"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}
        </div>
      )}


      {/* TAB 3: PC BUILDER COMPONENTS & PLACED BUILD PC ORDERS */}
      {activeTab === "components" && (
        <div className="space-y-8">
          {/* Header & Quick Stats */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Cpu className="h-6 w-6 text-sky-400" />
                <span>PC Builder & Custom Build Orders</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Monitor customer custom PC builds with instant GST invoice printing & PDF download, place & manage bulk multi-unit builds, and maintain the hardware catalog.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchAllOrders();
                  fetchAdminComponents();
                  toast.success("Build orders & hardware data refreshed.");
                }}
                className="gap-1.5 cursor-pointer text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Refresh
              </Button>

              <Button
                size="sm"
                onClick={() => setShowBulkOrderModal(true)}
                className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white cursor-pointer text-xs font-bold shadow-sm"
              >
                <Boxes className="h-3.5 w-3.5" />
                Place Bulk Build Order
              </Button>
              <Button
                size="sm"
                onClick={() => setShowAddComponent(!showAddComponent)}
                className="gap-1.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer text-xs font-semibold"
              >
                {showAddComponent ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                {showAddComponent ? "Cancel" : "Add Hardware Part"}
              </Button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">Total PC Builds</span>
              <span className="text-2xl font-bold font-display text-sky-400">{buildOrders.length}</span>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">Bulk Orders</span>
              <span className="text-2xl font-bold font-display text-purple-400">
                {buildOrders.filter((o) => Boolean(o.isBulkOrder) || (Number(o.bulkQuantity) > 1)).length}
              </span>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">In Production</span>
              <span className="text-2xl font-bold font-display text-indigo-400">
                {buildOrders.filter((o) => ["Confirmed", "Processing", "Shipped"].includes(o.orderStatus || o.status || "")).length}
              </span>
            </div>
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
              <span className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider block">Hardware Parts</span>
              <span className="text-2xl font-bold font-display text-emerald-400">
                {Object.values(componentsGrouped).reduce((sum, list) => sum + list.length, 0)}
              </span>
            </div>
          </div>

          {/* SECTION A: PLACED BUILD PC ORDERS TABLE */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                    <span>Placed Build PC Orders</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      {filteredBuildOrders.length} {filteredBuildOrders.length === 1 ? "Order" : "Orders"}
                    </span>
                  </h3>
                </div>

                {/* Search Box */}
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by customer, company, GSTIN, ID..."
                    value={buildOrdersSearch}
                    onChange={(e) => setBuildOrdersSearch(e.target.value)}
                    className="pl-9 h-9 text-xs"
                  />
                  {buildOrdersSearch && (
                    <button
                      onClick={() => setBuildOrdersSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Order Type & Status Filter Bars */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground shrink-0">Type:</span>
                  <button
                    onClick={() => setBuildOrdersTypeFilter("all")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                      buildOrdersTypeFilter === "all"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    All Builds ({buildOrders.length})
                  </button>
                  <button
                    onClick={() => setBuildOrdersTypeFilter("bulk")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      buildOrdersTypeFilter === "bulk"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Boxes className="h-3 w-3" />
                    Bulk Orders ({buildOrders.filter((o) => Boolean(o.isBulkOrder) || (Number(o.bulkQuantity) > 1)).length})
                  </button>
                  <button
                    onClick={() => setBuildOrdersTypeFilter("individual")}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all shrink-0 cursor-pointer ${
                      buildOrdersTypeFilter === "individual"
                        ? "bg-sky-600 text-white shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    Single Builds ({buildOrders.filter((o) => !o.isBulkOrder && (!o.bulkQuantity || Number(o.bulkQuantity) <= 1)).length})
                  </button>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground shrink-0">Status:</span>
                  {["all", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setBuildOrdersStatus(st)}
                      className={`px-2.5 py-1 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                        buildOrdersStatus.toLowerCase() === st.toLowerCase()
                          ? "bg-sky-600 text-white shadow-sm"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {st === "all" ? "All" : st}
                      {st === "all"
                        ? ` (${buildOrders.length})`
                        : ` (${buildOrders.filter((o) => (o.orderStatus || o.status || "Pending").toLowerCase() === st.toLowerCase()).length})`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Floating Bulk Operations Toolbar */}
              {selectedBuildOrderIds.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-sky-500/15 via-purple-500/15 to-sky-500/15 border border-sky-500/30 p-3 rounded-xl animate-fade-in shadow-sm">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-sky-400" />
                    <span className="text-xs font-bold text-foreground">
                      {selectedBuildOrderIds.length} {selectedBuildOrderIds.length === 1 ? "order" : "orders"} selected
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={bulkBatchStatus}
                      onChange={(e) => setBulkBatchStatus(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-lg bg-secondary border border-border text-foreground font-semibold focus:outline-none"
                    >
                      <option value="Confirmed">Mark as Confirmed</option>
                      <option value="Processing">Mark as In Assembly (Processing)</option>
                      <option value="Shipped">Mark as Shipped</option>
                      <option value="Delivered">Mark as Delivered</option>
                      <option value="Cancelled">Mark as Cancelled</option>
                    </select>
                    <Button
                      size="sm"
                      disabled={bulkStatusUpdating}
                      onClick={handleBulkBatchStatusUpdate}
                      className="h-8 px-3 text-xs bg-sky-600 hover:bg-sky-700 text-white font-semibold cursor-pointer"
                    >
                      {bulkStatusUpdating ? "Updating..." : "Apply Status to Selected"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkPrintInvoices}
                      className="h-8 px-2.5 text-xs gap-1 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                      title="Print invoices for all selected orders"
                    >
                      <Printer className="h-3.5 w-3.5" /> Print Selected
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBulkDownloadPdfs}
                      className="h-8 px-2.5 text-xs gap-1 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                      title="Download GST PDFs for all selected orders"
                    >
                      <FileText className="h-3.5 w-3.5" /> Download PDFs
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedBuildOrderIds([])}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Orders Table Body */}
            {filteredBuildOrders.length === 0 ? (
              <div className="py-16 text-center px-4">
                <Cpu className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h4 className="font-semibold text-base text-foreground mb-1">No Placed Build PC Orders Found</h4>
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
                  {buildOrdersSearch || buildOrdersStatus !== "all" || buildOrdersTypeFilter !== "all"
                    ? "No build orders match your current filters. Try resetting search or type filter."
                    : "When customers select their parts and place an order, or when you create a bulk order, it will appear here with one-click Print and GST Tax Invoice PDF download."}
                </p>
                <div className="mt-4 flex items-center justify-center gap-2">
                  {(buildOrdersSearch || buildOrdersStatus !== "all" || buildOrdersTypeFilter !== "all") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setBuildOrdersSearch("");
                        setBuildOrdersStatus("all");
                        setBuildOrdersTypeFilter("all");
                      }}
                      className="text-xs"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => setShowBulkOrderModal(true)}
                    className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
                  >
                    <Boxes className="h-3.5 w-3.5" /> Place First Bulk Order
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border text-muted-foreground uppercase text-[10px] tracking-wider font-semibold">
                      <th className="py-3 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredBuildOrders.length > 0 &&
                            filteredBuildOrders.every((o) =>
                              selectedBuildOrderIds.includes(o._id || o.orderId || "")
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              const allIds = filteredBuildOrders
                                .map((o) => o._id || o.orderId || "")
                                .filter(Boolean);
                              setSelectedBuildOrderIds(allIds);
                            } else {
                              setSelectedBuildOrderIds([]);
                            }
                          }}
                          className="rounded border-border cursor-pointer accent-sky-500"
                          title="Select all orders"
                        />
                      </th>
                      <th className="py-3 px-4">Order ID & Date</th>
                      <th className="py-3 px-4">Customer / Institutional Details</th>
                      <th className="py-3 px-4 min-w-[280px]">Configured Build Components</th>
                      <th className="py-3 px-4">Amount & Quantity</th>
                      <th className="py-3 px-4">Order Status</th>
                      <th className="py-3 px-4 text-right min-w-[200px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredBuildOrders.map((order) => {
                      const orderIdKey = order._id || order.orderId || "GZ-BUILD";
                      const orderIdDisplay = order.orderId || order._id || "GZ-BUILD";
                      const isSelected = selectedBuildOrderIds.includes(orderIdKey);
                      const isBulk = Boolean(order.isBulkOrder) || (Number(order.bulkQuantity) > 1);
                      const bulkQty = order.bulkQuantity || 1;
                      const dateDisplay = order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent";
                      const customerName = order.customer?.name || order.shippingInfo?.name || "Customer";
                      const customerCompany = order.customer?.company || "";
                      const customerGstin = order.customer?.gstin || "";
                      const customerPhone = order.customer?.phone || order.shippingInfo?.phone || "";
                      const customerEmail = order.customer?.email || "";
                      const customerCity = order.shippingAddress?.city || order.shippingInfo?.city || "";
                      const customerState = order.shippingAddress?.state || order.shippingInfo?.state || "";
                      const currentStatus = order.orderStatus || order.status || "Pending";
                      const grandTotal = order.grandTotal ?? order.totalPrice ?? 0;

                      // Find the build item
                      const buildItem =
                        order.items?.find((i) => i.type === "build" || (i.parts && i.parts.length > 0)) ||
                        order.items?.[0];

                      return (
                        <tr
                          key={orderIdKey}
                          className={`hover:bg-muted/20 transition-colors ${
                            isSelected ? "bg-sky-500/5" : ""
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3.5 px-3 align-top text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBuildOrderIds((prev) => [...prev, orderIdKey]);
                                } else {
                                  setSelectedBuildOrderIds((prev) => prev.filter((id) => id !== orderIdKey));
                                }
                              }}
                              className="rounded border-border cursor-pointer accent-sky-500"
                            />
                          </td>

                          {/* Order ID & Date */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-mono font-bold text-sky-400 block text-xs">
                              #{orderIdDisplay}
                            </span>
                            <span className="text-[11px] text-muted-foreground block mt-0.5">
                              {dateDisplay}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground font-medium">
                                {order.paymentMethod || "COD"}
                              </span>
                              {isBulk && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                  <Boxes className="h-2.5 w-2.5" /> Bulk ({bulkQty})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Customer */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="font-semibold text-foreground text-xs">{customerName}</div>
                            {customerCompany && (
                              <div className="text-[11px] font-medium text-sky-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="h-3 w-3 shrink-0" />
                                <span className="truncate max-w-[170px]">{customerCompany}</span>
                              </div>
                            )}
                            {customerGstin && (
                              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                GSTIN: <span className="text-foreground font-semibold">{customerGstin}</span>
                              </div>
                            )}
                            {customerPhone && (
                              <a
                                href={`tel:${customerPhone}`}
                                className="text-muted-foreground hover:text-sky-400 text-[11px] flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="h-3 w-3" /> {customerPhone}
                              </a>
                            )}
                            {customerEmail && (
                              <div className="text-muted-foreground text-[11px] flex items-center gap-1 mt-0.5 truncate max-w-[160px]">
                                <Mail className="h-3 w-3 shrink-0" /> {customerEmail}
                              </div>
                            )}
                            {(customerCity || customerState) && (
                              <div className="text-muted-foreground text-[10px] flex items-center gap-1 mt-0.5">
                                <MapPin className="h-3 w-3 shrink-0" /> {customerCity}{customerCity && customerState ? ", " : ""}{customerState}
                              </div>
                            )}
                          </td>

                          {/* Configured Build Components */}
                          <td className="py-3.5 px-4 align-top">
                            {buildItem?.parts && buildItem.parts.length > 0 ? (
                              <div className="space-y-1.5 max-w-md">
                                <div className="flex items-center gap-1.5">
                                  <Cpu className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                                  <span className="font-bold text-foreground text-xs truncate">
                                    {buildItem.name}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                                    {buildItem.parts.length} Parts
                                  </span>
                                </div>
                                <div className="grid grid-cols-1 gap-1 bg-muted/40 p-2 rounded-lg border border-border/50 text-[11px]">
                                  {buildItem.parts.map((p, pIdx) => (
                                    <div key={pIdx} className="flex justify-between items-center gap-2">
                                      <span className="font-semibold text-muted-foreground text-[10px] uppercase w-24 shrink-0 truncate">
                                        {p.categoryLabel || p.category}:
                                      </span>
                                      <span className="text-foreground truncate flex-1 font-medium">
                                        {p.name}
                                      </span>
                                      <span className="font-mono text-primary font-semibold text-[10px] shrink-0">
                                        ₹{(p.price || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-semibold text-foreground text-xs">
                                  {buildItem?.name || "Custom PC Build"}
                                </span>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  Qty: {buildItem?.quantity || bulkQty} • Unit: ₹{(buildItem?.price || 0).toLocaleString()}
                                </p>
                              </div>
                            )}
                          </td>

                          {/* Total Amount & Quantity */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-display font-bold text-sm text-emerald-400 block">
                              ₹{grandTotal.toLocaleString()}
                            </span>
                            {isBulk && bulkQty > 1 ? (
                              <span className="text-[10px] text-muted-foreground block mt-0.5">
                                ₹{Math.round(grandTotal / bulkQty).toLocaleString()} × {bulkQty} Units
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">
                                1 Unit • Incl. 18% GST
                              </span>
                            )}
                          </td>

                          {/* Order Status */}
                          <td className="py-3.5 px-4 align-top">
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                handleUpdateStatus(order._id || order.orderId || "", e.target.value)
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                                currentStatus === "Pending"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                  : currentStatus === "Confirmed"
                                  ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                  : currentStatus === "Processing"
                                  ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                                  : currentStatus === "Shipped"
                                  ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                                  : currentStatus === "Delivered"
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Processing">Processing</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          {/* Actions: Print & Download Buttons */}
                          <td className="py-3.5 px-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Print Button */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => printOrderInvoice(order)}
                                className="h-8 px-2.5 text-xs font-semibold gap-1.5 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 cursor-pointer"
                                title="Print formatted invoice"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Print</span>
                              </Button>

                              {/* Download PDF Button */}
                              <Button
                                size="sm"
                                onClick={() => downloadOrderPdf(order)}
                                className="h-8 px-2.5 text-xs font-semibold gap-1.5 bg-sky-600 hover:bg-sky-700 text-white cursor-pointer shadow-sm"
                                title="Download official GST Tax Invoice PDF"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Download</span>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* MODAL / PANEL: PLACE BULK CUSTOM PC ORDER */}
          {showBulkOrderModal && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-card border border-border rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto animate-fade-in-up">
                {/* Modal Header */}
                <div className="p-5 border-b border-border flex items-center justify-between bg-gradient-to-r from-purple-900/30 via-background to-sky-900/30">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
                      <Boxes className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                        <span>Place Bulk Custom PC Order</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Institutional / Enterprise
                        </span>
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Configure multi-unit custom PC builds for labs, gaming cafes, or corporate offices with live pricing, B2B GST billing, and instant invoice generation.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBulkOrderModal(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handlePlaceBulkBuildOrder} className="p-5 space-y-6 max-h-[80vh] overflow-y-auto text-xs">
                  {/* Step 1: 8-Part Hardware Selection */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="h-4 w-4" />
                        <span>1. Configure Custom Build Components</span>
                      </h4>
                      <span className="text-[11px] text-muted-foreground font-medium">
                        Unit System Price:{" "}
                        <strong className="text-emerald-400 font-mono text-sm">
                          ₹{Object.values(bulkSelections)
                            .reduce((sum, item) => sum + (Number(item?.price) || 0), 0)
                            .toLocaleString()}
                        </strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { key: "processor", label: "Processor (CPU)" },
                        { key: "motherboard", label: "Motherboard" },
                        { key: "ram", label: "Memory (RAM)" },
                        { key: "storage", label: "Storage (SSD/HDD)" },
                        { key: "gpu", label: "Graphics Card (GPU)" },
                        { key: "psu", label: "Power Supply (PSU)" },
                        { key: "cooling", label: "CPU Cooler" },
                        { key: "case", label: "Cabinet / Case" },
                      ].map(({ key, label }) => {
                        const parts = componentsGrouped[key] || [];
                        const currentSelection = (bulkSelections as any)[key];

                        return (
                          <div key={key} className="space-y-1 bg-muted/30 p-2.5 rounded-xl border border-border/60">
                            <Label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center justify-between">
                              <span>{label}</span>
                              {currentSelection && (
                                <span className="font-mono text-emerald-400 font-bold text-[10px]">
                                  ₹{Number(currentSelection.price || 0).toLocaleString()}
                                </span>
                              )}
                            </Label>
                            <select
                              value={currentSelection?.id || ""}
                              onChange={(e) => {
                                const selectedId = e.target.value;
                                if (!selectedId) {
                                  setBulkSelections((prev) => ({ ...prev, [key]: null }));
                                } else {
                                  const found = parts.find((p) => String(p.id) === selectedId);
                                  setBulkSelections((prev) => ({ ...prev, [key]: found || null }));
                                }
                              }}
                              disabled={parts.length === 0}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium truncate disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {parts.length === 0
                                  ? `-- No ${label} in stock (0 available) --`
                                  : `-- Choose ${label} (${parts.length} available) --`}
                              </option>
                              {parts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} (₹{p.price.toLocaleString()})
                                </option>
                              ))}
                            </select>
                            {currentSelection?.specs && (
                              <p className="text-[10px] text-muted-foreground truncate" title={currentSelection.specs}>
                                {currentSelection.specs}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Commercials & Quantity */}
                  <div className="bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 p-4 rounded-xl border border-border/80 space-y-3">
                    <h4 className="font-bold text-sm text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Boxes className="h-4 w-4" />
                      <span>2. Volume, Discount & Grand Total</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity of Systems *</Label>
                        <Input
                          type="number"
                          min="1"
                          max="500"
                          value={bulkBuildQty}
                          onChange={(e) => setBulkBuildQty(Math.max(1, parseInt(e.target.value) || 1))}
                          className="h-9 font-semibold"
                          required
                        />
                        <span className="text-[10px] text-muted-foreground block">
                          Minimum 1 system (e.g. 5, 10, 20 for lab / cafe)
                        </span>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Volume Discount (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          value={bulkDiscountPercent}
                          onChange={(e) => setBulkDiscountPercent(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))}
                          className="h-9 font-semibold"
                          placeholder="e.g. 5"
                        />
                        <span className="text-[10px] text-muted-foreground block">
                          Applied across entire order
                        </span>
                      </div>

                      {/* Financial Summary Card */}
                      <div className="bg-background/80 p-3 rounded-lg border border-border/80 flex flex-col justify-between">
                        <div className="space-y-0.5 text-[11px]">
                          {(() => {
                            const unitPrice = Object.values(bulkSelections).reduce(
                              (sum, item) => sum + (Number(item?.price) || 0),
                              0
                            );
                            const rawSubtotal = unitPrice * bulkBuildQty;
                            const discountAmt = Math.round((rawSubtotal * bulkDiscountPercent) / 100);
                            const finalTotal = Math.max(0, rawSubtotal - discountAmt);
                            const baseTaxable = Math.round((finalTotal / 1.18) * 100) / 100;
                            const gst18 = Math.round((finalTotal - baseTaxable) * 100) / 100;

                            return (
                              <>
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Subtotal ({bulkBuildQty} Units):</span>
                                  <span>₹{rawSubtotal.toLocaleString()}</span>
                                </div>
                                {discountAmt > 0 && (
                                  <div className="flex justify-between text-rose-400">
                                    <span>Discount ({bulkDiscountPercent}%):</span>
                                    <span>-₹{discountAmt.toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="flex justify-between text-muted-foreground text-[10px]">
                                  <span>Taxable Value:</span>
                                  <span>₹{baseTaxable.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground text-[10px]">
                                  <span>18% GST (CGST+SGST):</span>
                                  <span>₹{gst18.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between font-bold text-foreground text-xs pt-1 border-t border-border mt-1">
                                  <span className="text-sky-400">Grand Total:</span>
                                  <span className="text-emerald-400 font-mono text-sm">
                                    ₹{finalTotal.toLocaleString()}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3: Client & Institutional Details */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-sm text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      <span>3. Client & Institutional Billing Details</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Client Contact Name *</Label>
                        <Input
                          placeholder="e.g. Rajesh Kumar"
                          value={bulkCustomer.name}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, name: e.target.value }))}
                          className="h-8"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Company / Institution Name</Label>
                        <Input
                          placeholder="e.g. Apex Gaming Lounge / SRM Tech Lab"
                          value={bulkCustomer.company}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, company: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Client GSTIN (Tax ID)</Label>
                        <Input
                          placeholder="e.g. 33AABCT1332L1Z4"
                          value={bulkCustomer.gstin}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, gstin: e.target.value.toUpperCase() }))}
                          className="h-8 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Contact Phone *</Label>
                        <Input
                          placeholder="e.g. 9876543210"
                          value={bulkCustomer.phone}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, phone: e.target.value }))}
                          className="h-8"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Contact Email</Label>
                        <Input
                          type="email"
                          placeholder="e.g. accounts@institution.edu"
                          value={bulkCustomer.email}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, email: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Method</Label>
                        <select
                          value={bulkCustomer.paymentMethod}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, paymentMethod: e.target.value }))}
                          className="w-full h-8 px-2.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none"
                        >
                          <option value="Bank Transfer (NEFT/RTGS)">Bank Transfer (NEFT/RTGS)</option>
                          <option value="Purchase Order (Net 30)">Purchase Order (Net 30)</option>
                          <option value="Cheque / DD">Cheque / Demand Draft</option>
                          <option value="UPI / Online">UPI / Online Gateway</option>
                          <option value="Cash on Delivery">Cash on Delivery</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Payment Status</Label>
                        <select
                          value={bulkCustomer.paymentStatus}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, paymentStatus: e.target.value }))}
                          className="w-full h-8 px-2.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none"
                        >
                          <option value="Paid">Paid / Advance Received</option>
                          <option value="Pending">Payment Pending</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Initial Order Status</Label>
                        <select
                          value={bulkCustomer.orderStatus}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, orderStatus: e.target.value }))}
                          className="w-full h-8 px-2.5 rounded-lg bg-background text-foreground text-xs border border-border focus:outline-none"
                        >
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">In Assembly (Processing)</option>
                          <option value="Pending">Pending</option>
                        </select>
                      </div>
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <Label className="text-xs">Delivery City & State</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="City"
                            value={bulkCustomer.city}
                            onChange={(e) => setBulkCustomer((p) => ({ ...p, city: e.target.value }))}
                            className="h-8"
                          />
                          <Input
                            placeholder="State"
                            value={bulkCustomer.state}
                            onChange={(e) => setBulkCustomer((p) => ({ ...p, state: e.target.value }))}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label className="text-xs">Street Delivery Address</Label>
                        <Input
                          placeholder="e.g. Block B, Tech Park, Velachery Main Road"
                          value={bulkCustomer.address}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, address: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Pincode</Label>
                        <Input
                          placeholder="e.g. 600042"
                          value={bulkCustomer.pincode}
                          onChange={(e) => setBulkCustomer((p) => ({ ...p, pincode: e.target.value }))}
                          className="h-8"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                        <Label className="text-xs">Assembly & Benchmarking Instructions (Optional)</Label>
                        <Input
                          placeholder="e.g. Install Ubuntu 24.04 LTS, dual-channel RAM check, 24-hr Cinebench stress test before dispatch"
                          value={bulkAssemblyNotes}
                          onChange={(e) => setBulkAssemblyNotes(e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowBulkOrderModal(false)}
                      className="cursor-pointer text-xs"
                    >
                      Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        type="submit"
                        disabled={bulkSubmitting}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold cursor-pointer text-xs gap-1.5 shadow-md"
                      >
                        <Boxes className="h-4 w-4" />
                        {bulkSubmitting ? "Creating Bulk Order..." : "Confirm & Place Bulk Order"}
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* SECTION B: ADD NEW HARDWARE COMPONENT FORM (COLLAPSIBLE) */}
          {showAddComponent && (
            <div className="rounded-2xl border bg-card p-6 shadow-sm animate-fade-in-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Plus className="h-4 w-4 text-sky-400" />
                  <span>Add New Hardware Component to PC Builder</span>
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAddComponent(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <form onSubmit={handleAddComponent} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Component Name *</Label>
                    <Input
                      placeholder="e.g. AMD Ryzen 7 7800X3D"
                      value={newComponent.name}
                      onChange={(e) => setNewComponent((p) => ({ ...p, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Category *</Label>
                    <select
                      value={newComponent.category}
                      onChange={(e) => setNewComponent((p) => ({ ...p, category: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-secondary text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="processor">Processor (CPU)</option>
                      <option value="motherboard">Motherboard</option>
                      <option value="ram">Memory (RAM)</option>
                      <option value="storage">Storage (SSD/HDD)</option>
                      <option value="gpu">Graphics Card (GPU)</option>
                      <option value="psu">Power Supply (PSU)</option>
                      <option value="cooling">CPU Cooler / Cooling</option>
                      <option value="case">Cabinet / Case</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Price (₹) *</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 36999"
                      value={newComponent.price}
                      onChange={(e) => setNewComponent((p) => ({ ...p, price: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Brand</Label>
                    <Input
                      placeholder="e.g. AMD, Intel, ASUS, Corsair"
                      value={newComponent.brand}
                      onChange={(e) => setNewComponent((p) => ({ ...p, brand: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Specifications / Highlights</Label>
                    <Input
                      placeholder="e.g. 8 Cores, 16 Threads, up to 5.0GHz, 104MB Cache"
                      value={newComponent.specs}
                      onChange={(e) => setNewComponent((p) => ({ ...p, specs: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddComponent(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                  >
                    Save Component to Database
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* SECTION C: PC BUILDER HARDWARE CATALOG & LIVE PRICING */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-foreground">Hardware Catalog & Live Price Editor</h3>
                <p className="text-xs text-muted-foreground">
                  Click the pencil icon on any component to adjust its price and specs in real-time. Products added under "Products" matching hardware categories also appear here automatically.
                </p>
              </div>
            </div>

            {componentsLoading ? (
              <div className="py-20 text-center bg-card rounded-2xl border border-border">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground text-sm">Fetching components database...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(componentsGrouped).map(([category, parts]) => (
                  <div key={category} className="space-y-3 bg-card p-5 rounded-2xl border border-border shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-border">
                      <h4 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        <span>{category}</span>
                      </h4>
                      <span className="text-xs font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                        {parts.length} {parts.length === 1 ? "item" : "items"}
                      </span>
                    </div>

                    {parts.length === 0 ? (
                      <div className="py-4 text-center text-xs text-muted-foreground/60 italic bg-background/30 rounded-xl border border-dashed border-border/60">
                        No components added to {category} yet. Click "Add New Hardware Component" above to add real products.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {parts.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-xl border border-border/70 bg-background/50 p-3.5 hover:border-primary/40 transition-colors"
                        >
                          {editingComponentId === c.id ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <h5 className="font-semibold text-xs flex-1 truncate">{c.name}</h5>
                                <Button size="sm" onClick={() => saveComponentEdit(c.id)} className="h-7 text-xs">
                                  <Save className="h-3 w-3 mr-1" /> Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingComponentId(null)}
                                  className="h-7 text-xs"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-[10px]">Price (₹)</Label>
                                  <Input
                                    type="number"
                                    value={editComponentForm.price}
                                    onChange={(e) =>
                                      setEditComponentForm((f) => ({ ...f, price: e.target.value }))
                                    }
                                    className="h-8 text-xs"
                                  />
                                </div>
                                <div>
                                  <Label className="text-[10px]">Specifications</Label>
                                  <Input
                                    value={editComponentForm.specs}
                                    onChange={(e) =>
                                      setEditComponentForm((f) => ({ ...f, specs: e.target.value }))
                                    }
                                    className="h-8 text-xs"
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-foreground truncate">
                                  {c.brand ? `[${c.brand}] ` : ""}{c.name}
                                </div>
                                {c.specs && (
                                  <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                    {c.specs}
                                  </p>
                                )}
                              </div>
                              <span className="font-mono font-bold text-emerald-400 shrink-0 text-sm">
                                ₹{c.price.toLocaleString()}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground cursor-pointer"
                                  onClick={() => startEditComponent(c)}
                                  title="Edit Component Price"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-muted-foreground hover:text-rose-400 cursor-pointer"
                                  onClick={() => deleteComponent(c.id)}
                                  title="Remove Component"
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
                ))}
              </div>
            )}
          </div>
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
                      onClick={() => downloadOrderPdf(selectedOrder)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-bold transition-colors cursor-pointer"
                      title="Download GST Invoice PDF"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </button>

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
      {/* MODAL 1: VIEW FULL SERVICE BOOKING DETAILS */}
      {viewingBookingDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-5 animate-fade-in-up my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-extrabold text-sky-400">
                    #{viewingBookingDetails.bookingId}
                  </span>
                  {(() => {
                    const st = viewingBookingDetails.bookingStatus || viewingBookingDetails.status || "Pending Review";
                    if (st === "Pending Review" || st === "Pending") {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                          <Clock className="h-3 w-3" /> Pending Review
                        </span>
                      );
                    }
                    if (st === "Confirmed") {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                          <Check className="h-3 w-3" /> Confirmed
                        </span>
                      );
                    }
                    if (st === "In Progress") {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400">
                          <Wrench className="h-3 w-3" /> In Progress
                        </span>
                      );
                    }
                    if (st === "Completed") {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </span>
                      );
                    }
                    return (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 border border-rose-500/30 text-rose-400">
                        <XCircle className="h-3 w-3" /> Cancelled
                      </span>
                    );
                  })()}
                </div>
                <h3 className="font-bold text-lg text-foreground">
                  {viewingBookingDetails.serviceName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  Submitted on {viewingBookingDetails.createdAt ? new Date(viewingBookingDetails.createdAt).toLocaleString("en-IN") : "Recent"}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setViewingBookingDetails(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Info Card */}
              <div className="bg-muted/30 border border-border/80 rounded-xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5" /> Customer Details
                </span>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Customer Name</span>
                  <span className="text-sm font-bold text-foreground">{viewingBookingDetails.customerName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Primary Phone</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <a
                      href={`tel:${viewingBookingDetails.primaryPhone || viewingBookingDetails.phone1}`}
                      className="text-xs font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <Phone className="h-3 w-3" />
                      {viewingBookingDetails.primaryPhone || viewingBookingDetails.phone1}
                    </a>
                    <button
                      onClick={() => openCustomerWhatsApp(viewingBookingDetails)}
                      className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 cursor-pointer"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
                {(viewingBookingDetails.alternatePhone || viewingBookingDetails.phone2) && (
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Alternate Phone</span>
                    <a
                      href={`tel:${viewingBookingDetails.alternatePhone || viewingBookingDetails.phone2}`}
                      className="text-xs font-mono text-muted-foreground hover:underline"
                    >
                      {viewingBookingDetails.alternatePhone || viewingBookingDetails.phone2}
                    </a>
                  </div>
                )}
                <div>
                  <span className="text-[10px] text-muted-foreground block">Service Address</span>
                  <div className="text-xs text-foreground/90 flex items-start gap-1.5 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span>{viewingBookingDetails.address}</span>
                  </div>
                </div>
              </div>

              {/* Service & Appointment Card */}
              <div className="bg-muted/30 border border-border/80 rounded-xl p-4 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block border-b border-border/50 pb-1.5 flex items-center gap-1.5">
                  <CalendarCheck className="h-3.5 w-3.5" /> Appointment & Service
                </span>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Service Name</span>
                  <span className="text-xs font-semibold text-foreground">{viewingBookingDetails.serviceName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Service Price</span>
                  <span className="text-sm font-black text-emerald-400">
                    {viewingBookingDetails.servicePrice ? (viewingBookingDetails.servicePrice.startsWith("₹") ? viewingBookingDetails.servicePrice : `₹${viewingBookingDetails.servicePrice}`) : "Quote on Site"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Preferred Date</span>
                    <span className="text-xs font-medium text-foreground">
                      📅 {viewingBookingDetails.preferredDate || viewingBookingDetails.bookingDate}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Preferred Time</span>
                    <span className="text-xs font-medium text-foreground">
                      ⏰ {viewingBookingDetails.preferredTime || "Flexible"}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Assigned Engineer</span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-semibold text-sky-400">
                      {viewingBookingDetails.assignedEngineer || viewingBookingDetails.assignedTechnician || "Unassigned"}
                    </span>
                    <button
                      onClick={() => {
                        setAssigningEngineerModal({
                          id: viewingBookingDetails._id,
                          bookingId: viewingBookingDetails.bookingId,
                          engineerName: viewingBookingDetails.assignedEngineer || viewingBookingDetails.assignedTechnician || "",
                        });
                      }}
                      className="text-[10px] text-purple-400 hover:underline font-semibold cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Reported Problem / Purpose */}
            <div className="bg-muted/20 border border-border/80 rounded-xl p-4 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Booking Purpose / Customer Problem Description
              </span>
              <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {viewingBookingDetails.bookingPurpose || viewingBookingDetails.purpose}
              </p>
            </div>

            {/* Admin Notes */}
            <div className="bg-muted/20 border border-border/80 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Admin & Technician Notes (Internal)
                </span>
                <button
                  onClick={() => {
                    setEditingAdminNotesModal({
                      id: viewingBookingDetails._id,
                      bookingId: viewingBookingDetails.bookingId,
                      adminNotes: viewingBookingDetails.adminNotes || viewingBookingDetails.technicianNotes || "",
                    });
                  }}
                  className="text-[10px] text-purple-400 hover:underline font-semibold cursor-pointer"
                >
                  Edit Notes
                </button>
              </div>
              <p className="text-xs text-sky-300/90 whitespace-pre-wrap">
                {viewingBookingDetails.adminNotes || viewingBookingDetails.technicianNotes || "No internal admin notes entered yet."}
              </p>
            </div>

            {/* Customer Rating & Feedback */}
            {viewingBookingDetails.rating ? (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> Customer Service Rating
                  </span>
                  <span className="text-xs font-black text-amber-400">
                    {viewingBookingDetails.rating} / 5 Stars
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <Star
                      key={starVal}
                      className={`h-4 w-4 ${
                        starVal <= viewingBookingDetails.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>
                {viewingBookingDetails.reviewComment && (
                  <p className="text-xs text-amber-200 italic pt-1">
                    "{viewingBookingDetails.reviewComment}"
                  </p>
                )}
                {viewingBookingDetails.reviewedAt && (
                  <span className="text-[10px] text-muted-foreground block">
                    Reviewed on {new Date(viewingBookingDetails.reviewedAt).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ) : null}

            {/* Cancellation reason if cancelled */}
            {viewingBookingDetails.cancellationReason && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                  Cancellation Reason
                </span>
                <p className="text-xs text-rose-300">
                  {viewingBookingDetails.cancellationReason}
                </p>
              </div>
            )}

            {/* Status History Audit Log */}
            {Array.isArray(viewingBookingDetails.statusHistory) && viewingBookingDetails.statusHistory.length > 0 && (
              <div className="bg-muted/15 border border-border/60 rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Status History & Audit Trail
                </span>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {viewingBookingDetails.statusHistory.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                      <span className="font-semibold text-foreground/90">{item.status}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {item.changedAt ? new Date(item.changedAt).toLocaleString("en-IN") : ""} • {item.changedBy || "System"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with Workflow Action Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="flex flex-wrap items-center gap-2">
                {/* Workflow Transitions */}
                {((viewingBookingDetails.bookingStatus || viewingBookingDetails.status) === "Pending Review" ||
                  (viewingBookingDetails.bookingStatus || viewingBookingDetails.status) === "Pending") && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateBookingStatus(viewingBookingDetails._id, "Confirmed")}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Confirm Booking
                  </Button>
                )}

                {(viewingBookingDetails.bookingStatus || viewingBookingDetails.status) === "Confirmed" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateBookingStatus(viewingBookingDetails._id, "In Progress")}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" /> Start Service
                  </Button>
                )}

                {(viewingBookingDetails.bookingStatus || viewingBookingDetails.status) === "In Progress" && (
                  <Button
                    size="sm"
                    onClick={() => handleUpdateBookingStatus(viewingBookingDetails._id, "Completed")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete Service
                  </Button>
                )}

                {/* Cancel action if not completed and not cancelled */}
                {(viewingBookingDetails.bookingStatus || viewingBookingDetails.status) !== "Completed" &&
                  (viewingBookingDetails.bookingStatus || viewingBookingDetails.status) !== "Cancelled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCancellingBookingModal({
                        id: viewingBookingDetails._id,
                        bookingId: viewingBookingDetails.bookingId,
                        reason: "",
                      });
                    }}
                    className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs gap-1 cursor-pointer"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Cancel Booking
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => printServiceJobCard(viewingBookingDetails)}
                  className="text-xs gap-1.5 cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Sheet
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setViewingBookingDetails(null)}
                  className="text-xs cursor-pointer"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN ENGINEER */}
      {assigningEngineerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-purple-400" />
                <span>Assign Service Engineer (#{assigningEngineerModal.bookingId})</span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setAssigningEngineerModal(null)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Engineer / Technician Name *</Label>
                <Input
                  value={assigningEngineerModal.engineerName}
                  onChange={(e) =>
                    setAssigningEngineerModal((p) => p && { ...p, engineerName: e.target.value })
                  }
                  placeholder="e.g. Ramesh Kumar (Hardware Specialist)"
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground block">Quick Select:</span>
                <div className="flex flex-wrap gap-1.5">
                  {["Ramesh K. (Hardware)", "Suresh V. (Laptops & Displays)", "Anand M. (CCTV & Networking)", "Kavitha S. (Printers & Data)"].map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => setAssigningEngineerModal((p) => p && { ...p, engineerName: tech })}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-secondary text-foreground hover:bg-purple-500/20 border border-border cursor-pointer"
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssigningEngineerModal(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAssignedEngineer}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Save Engineer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CANCEL BOOKING WITH REASON */}
      {cancellingBookingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-rose-500/40 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2 text-rose-400">
                <XCircle className="h-4 w-4" />
                <span>Cancel Booking (#{cancellingBookingModal.bookingId})</span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setCancellingBookingModal(null)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Are you sure you want to cancel this booking? This will set the booking status to <strong>Cancelled</strong>.
              </p>

              <div className="space-y-1">
                <Label className="text-xs">Cancellation Reason (Optional)</Label>
                <Textarea
                  value={cancellingBookingModal.reason}
                  onChange={(e) =>
                    setCancellingBookingModal((p) => p && { ...p, reason: e.target.value })
                  }
                  placeholder="e.g. Customer cancelled via phone / Spare parts unavailable / Out of service area"
                  rows={3}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCancellingBookingModal(null)}
                className="text-xs"
              >
                Keep Booking
              </Button>
              <Button
                size="sm"
                onClick={handleSaveCancelBooking}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: INTERNAL ADMIN NOTES */}
      {editingAdminNotesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                <span>Internal Admin Notes (#{editingAdminNotesModal.bookingId})</span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditingAdminNotesModal(null)}
                className="h-7 w-7 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Notes saved here are visible to administrators and technicians to track inspection logs, repair updates, and customer communications.
              </p>

              <div className="space-y-1">
                <Label className="text-xs">Admin Notes</Label>
                <Textarea
                  value={editingAdminNotesModal.adminNotes}
                  onChange={(e) =>
                    setEditingAdminNotesModal((p) => p && { ...p, adminNotes: e.target.value })
                  }
                  placeholder="e.g. Spoke to customer on phone. Confirmed visit for Thursday 2 PM. Replacement motherboard ready."
                  rows={4}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingAdminNotesModal(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAdminNotes}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
              >
                Save Notes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

