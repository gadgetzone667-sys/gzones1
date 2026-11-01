import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Package, Clock, CheckCircle2, Truck, XCircle, ChevronRight, ShoppingBag, FileSpreadsheet } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { getLocalOrders, downloadOrderExcel, type Order } from "../lib/orderExport";

const statusConfig = {
  Pending: { icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10", step: 1 },
  Confirmed: { icon: CheckCircle2, color: "text-sky-500", bg: "bg-sky-500/10", step: 1 },
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
  const { token, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const local = getLocalOrders();
        let serverOrders: Order[] = [];

        if (token) {
          try {
            const res = await fetch("/api/orders/my-orders", {
              headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) serverOrders = data;
            }
          } catch (e) {
            console.warn("Server orders unreachable, reading local orders:", e);
          }
        }

        const mergedMap = new Map<string, Order>();
        serverOrders.forEach((o) => {
          const key = o.trackingId || o._id;
          if (key) mergedMap.set(key, o);
        });

        // Filter local orders relevant to this user or all if guest/admin
        local.forEach((o) => {
          const key = o.trackingId || o._id;
          if (key && !mergedMap.has(key)) {
            // Include order if user matches or email matches or guest
            if (!user || !o.userId || o.userId === "guest" || o.userId === user.id || o.customer?.email === user.email) {
              mergedMap.set(key, o);
            }
          }
        });

        const all = Array.from(mergedMap.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        setOrders(all);
      } catch (err) {
        console.error(err);
        toast.error("Could not load your order history.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token, user]);

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
            const effectiveStatus = (order.orderStatus || order.status || "Pending") as keyof typeof statusConfig;
            const statusInfo = statusConfig[effectiveStatus] || statusConfig.Pending;
            const StatusIcon = statusInfo.icon;
            const currentStep = order.trackingStage !== undefined && order.trackingStage !== null 
              ? order.trackingStage 
              : statusInfo.step;
            const trackingNumber = order.trackingId || order.orderId || `TRK-GZ-${order._id.slice(-6).toUpperCase()}`;

            const customerName = order.customer?.name || order.shippingInfo?.name;
            const customerPhone = order.customer?.phone || order.shippingInfo?.phone;
            const altPhone = order.customer?.alternatePhone || order.shippingInfo?.alternatePhone;
            const addressStr = order.shippingAddress
              ? `${order.shippingAddress.address || order.shippingAddress.address1 || ""}${order.shippingAddress.address2 ? `, ${order.shippingAddress.address2}` : ""}, ${order.shippingAddress.city ? `${order.shippingAddress.city}, ` : ""}${order.shippingAddress.state}, ${order.shippingAddress.country || "India"} - ${order.shippingAddress.pincode}`
              : order.shippingInfo?.address1 
                ? `${order.shippingInfo.address1}${order.shippingInfo.address2 ? `, ${order.shippingInfo.address2}` : ""}, ${order.shippingInfo.city ? `${order.shippingInfo.city}, ` : ""}${order.shippingInfo.state}, ${order.shippingInfo.country || "India"} - ${order.shippingInfo.pincode}`
                : order.shippingInfo?.address;

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
                      <span className={`text-sm font-bold ${statusInfo.color}`}>{effectiveStatus}</span>
                    </div>
                  </div>

                  {/* Visual Live Order Tracking Progress Timeline */}
                  {effectiveStatus !== "Cancelled" && (
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

                      {(customerName || addressStr) && (
                        <div className="bg-muted/20 p-3 rounded-xl border border-border/40 text-xs space-y-1">
                          <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Shipping Address</p>
                          {customerName && (
                            <p className="font-semibold text-foreground">
                              {customerName} {customerPhone && `• ${customerPhone}`}
                              {altPhone && <span className="text-muted-foreground ml-1">(Alt: {altPhone})</span>}
                            </p>
                          )}
                          {addressStr && (
                            <p className="text-muted-foreground">
                              {addressStr}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col md:items-end justify-between">
                       <div className="text-left md:text-right w-full">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Amount Paid</p>
                          <p className="font-display text-3xl font-black text-sky-400">₹{(order.grandTotal ?? order.totalPrice ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1">Courier: {order.courier || "SpeedPost Express"}</p>
                       </div>
                       <div className="mt-6 md:mt-0 flex flex-wrap items-center gap-2 w-full md:w-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => downloadOrderExcel(order)}
                            className="h-10 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-xl flex items-center gap-1.5"
                            title="Download invoice in Excel format"
                          >
                            <FileSpreadsheet className="h-4 w-4" /> Download Invoice (Excel)
                          </Button>
                          <Button variant="outline" size="sm" className="h-10 border-border hover:bg-muted font-bold rounded-xl" asChild>
                             <Link to={`/product/${order.items[0]?.productId || ''}`}>
                                View Product <ChevronRight className="h-4 w-4 ml-1" />
                             </Link>
                          </Button>
                       </div>
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
