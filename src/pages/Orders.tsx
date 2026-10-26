import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle2, Truck, XCircle, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalPrice: number;
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  createdAt: string;
  shippingInfo?: {
    name: string;
    phone: string;
    alternatePhone?: string;
    address: string;
    address1?: string;
    address2?: string;
    country?: string;
    state?: string;
    city?: string;
    pincode?: string;
    notes?: string;
  };
  trackingStage?: number;
  paymentMethod?: string;
  trackingId?: string;
  courier?: string;
  estimatedDeliveryDate?: string;
}

const statusConfig = {
  Pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", step: 1 },
  Processing: { icon: Package, color: "text-blue-500", bg: "bg-blue-500/10", step: 2 },
  Shipped: { icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10", step: 3 },
  Delivered: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10", step: 4 },
  Cancelled: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", step: 0 }
};

const trackingSteps = [
  { label: "Order Placed", step: 1 },
  { label: "Processing & Assembly", step: 2 },
  { label: "Out for Delivery", step: 3 },
  { label: "Delivered", step: 4 }
];

const Orders = () => {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) return;
      try {
        const res = await fetch("/api/orders/my-orders", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error(err);
        toast.error("Could not load your order history.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-muted-foreground font-medium">Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <ShoppingBag className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">No Orders Yet</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          You haven't placed any orders yet. Start building your dream machine today!
        </p>
        <Link to="/products">
          <Button size="lg" className="rounded-xl px-8 shadow-md">
            Start Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl font-extrabold tracking-tight mb-2">Order History & Live Tracking</h1>
          <p className="text-muted-foreground font-medium">Track your hardware shipment and view live delivery progress.</p>
        </motion.div>

        <div className="space-y-8">
          {orders.map((order, idx) => {
            const statusInfo = statusConfig[order.status] || statusConfig.Processing;
            const StatusIcon = statusInfo.icon;
            const currentStep = order.trackingStage !== undefined && order.trackingStage !== null 
              ? order.trackingStage 
              : statusInfo.step;
            const trackingNumber = order.trackingId || `TRK-GZ-${order._id.slice(-6).toUpperCase()}`;

            return (
              <motion.div 
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                <div className="p-6 md:p-8 space-y-6">
                  {/* Header info */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tracking Number</span>
                      <span className="font-mono text-sm font-bold text-sky-400">{trackingNumber}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</span>
                      <span className="text-sm font-semibold text-foreground">{order.paymentMethod || "Cash on Delivery"}</span>
                    </div>
                    <div className="flex flex-col gap-1 md:items-end">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimated Delivery</span>
                      <span className="text-sm font-bold text-emerald-400">{order.estimatedDeliveryDate || "3-5 Business Days"}</span>
                    </div>
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg}`}>
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-bold ${statusInfo.color}`}>{order.status}</span>
                    </div>
                  </div>

                  {/* Visual Live Order Tracking Progress Timeline */}
                  {order.status !== "Cancelled" && (
                    <div className="py-2 px-4 bg-secondary/40 rounded-2xl border border-border/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">Live Shipment Tracking Progress</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                        {trackingSteps.map((s) => {
                          const isDone = currentStep >= s.step;
                          return (
                            <div key={s.step} className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                isDone 
                                  ? "bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.4)]" 
                                  : "bg-muted text-muted-foreground border border-border"
                              }`}>
                                {isDone ? "✓" : s.step}
                              </div>
                              <div>
                                <p className={`text-xs font-bold ${isDone ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</p>
                                <p className="text-[10px] text-muted-foreground">{isDone ? "Completed" : "Pending"}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-8 pt-2">
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Purchased Items</h3>
                      <div className="space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center text-sm bg-muted/20 p-2.5 rounded-xl border border-border/40">
                             <span className="font-medium text-foreground">{item.name} <span className="text-muted-foreground font-semibold ml-1">x{item.quantity}</span></span>
                             <span className="font-bold text-sky-400">₹{(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      {order.shippingInfo && (
                        <div className="bg-muted/20 p-3 rounded-xl border border-border/40 text-xs space-y-1">
                          <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Shipping Address</p>
                          <p className="font-semibold text-foreground">
                            {order.shippingInfo.name} • {order.shippingInfo.phone}
                            {order.shippingInfo.alternatePhone && <span className="text-muted-foreground ml-1">(Alt: {order.shippingInfo.alternatePhone})</span>}
                          </p>
                          <p className="text-muted-foreground">
                            {order.shippingInfo.address1 
                              ? `${order.shippingInfo.address1}${order.shippingInfo.address2 ? `, ${order.shippingInfo.address2}` : ""}, ${order.shippingInfo.city ? `${order.shippingInfo.city}, ` : ""}${order.shippingInfo.state}, ${order.shippingInfo.country || "India"} - ${order.shippingInfo.pincode}`
                              : order.shippingInfo.address}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col md:items-end justify-between">
                       <div className="text-left md:text-right w-full">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Amount Paid</p>
                          <p className="font-display text-3xl font-black text-sky-400">₹{order.totalPrice.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">Courier: {order.courier || "SpeedPost Express"}</p>
                       </div>
                       <Button variant="outline" size="sm" className="mt-6 md:mt-0 w-full md:w-auto h-10 border-border hover:bg-muted font-bold rounded-xl" asChild>
                          <Link to={`/product/${order.items[0]?.productId || ''}`}>
                             View Product <ChevronRight className="h-4 w-4 ml-1" />
                          </Link>
                       </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Orders;
