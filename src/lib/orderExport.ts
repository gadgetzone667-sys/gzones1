export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  userId?: string;
  customerEmail?: string;
  items: OrderItem[];
  totalPrice: number;
  shippingInfo: {
    name: string;
    firstName?: string;
    lastName?: string;
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
  status: "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  trackingStage?: number;
  trackingId?: string;
  courier?: string;
  estimatedDeliveryDate?: string;
  paymentMethod: string;
  createdAt: string;
}

const ORDERS_STORAGE_KEY = "GadgetZone_all_orders";

// Helper to escape values for CSV / Excel
function escapeCsv(value: any): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

// Retrieve local orders
export function getLocalOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save or update an order in local storage
export function saveLocalOrder(order: Order): void {
  try {
    const current = getLocalOrders();
    const existingIndex = current.findIndex(
      (o) => o._id === order._id || (o.trackingId && o.trackingId === order.trackingId)
    );

    if (existingIndex >= 0) {
      current[existingIndex] = { ...current[existingIndex], ...order };
    } else {
      current.unshift(order);
    }

    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn("Failed to persist order in localStorage:", err);
  }
}

// Update order status in local storage
export function updateLocalOrderStatus(
  orderId: string,
  status: string,
  trackingStage?: number
): void {
  try {
    const current = getLocalOrders();
    const updated = current.map((o) =>
      o._id === orderId || o.trackingId === orderId
        ? {
            ...o,
            status: status as any,
            trackingStage: trackingStage !== undefined ? trackingStage : o.trackingStage,
          }
        : o
    );
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to update order status in localStorage:", err);
  }
}

// Delete an order from local storage
export function deleteLocalOrder(orderId: string): void {
  try {
    const current = getLocalOrders();
    const updated = current.filter((o) => o._id !== orderId && o.trackingId !== orderId);
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete order from localStorage:", err);
  }
}

// Download Excel CSV for a single individual order
export function downloadOrderExcel(order: Order): void {
  const items = order.items || [];
  const lines: string[] = [];

  // Header Title
  lines.push(`"GADGETZONE - OFFICIAL CUSTOMER ORDER & INVOICE"`);
  lines.push(`"Exported Date & Time",${escapeCsv(new Date().toLocaleString())}`);
  lines.push("");

  // Order Details
  lines.push(`"=== 1. ORDER DETAILS ==="`);
  lines.push(`"Order ID",${escapeCsv(order._id)}`);
  lines.push(`"Tracking ID",${escapeCsv(order.trackingId || "N/A")}`);
  lines.push(`"Order Date",${escapeCsv(order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString())}`);
  lines.push(`"Order Status",${escapeCsv(order.status || "Pending")}`);
  lines.push(`"Tracking Stage",${escapeCsv(`Stage ${order.trackingStage || 1}`)}`);
  lines.push(`"Payment Method",${escapeCsv(order.paymentMethod || "Cash on Delivery (COD)")}`);
  lines.push(`"Courier Partner",${escapeCsv(order.courier || "SpeedPost Express")}`);
  lines.push(`"Est. Delivery",${escapeCsv(order.estimatedDeliveryDate || "3-5 Business Days")}`);
  lines.push("");

  // Customer & Shipping Details
  lines.push(`"=== 2. CUSTOMER & SHIPPING INFORMATION ==="`);
  lines.push(`"Customer Name",${escapeCsv(order.shippingInfo?.name || "N/A")}`);
  lines.push(`"Contact Mobile",${escapeCsv(order.shippingInfo?.phone || "N/A")}`);
  lines.push(`"Alternate Mobile",${escapeCsv(order.shippingInfo?.alternatePhone || "None")}`);
  lines.push(`"Address Line 1",${escapeCsv(order.shippingInfo?.address1 || order.shippingInfo?.address || "N/A")}`);
  lines.push(`"Address Line 2",${escapeCsv(order.shippingInfo?.address2 || "")}`);
  lines.push(`"City",${escapeCsv(order.shippingInfo?.city || "")}`);
  lines.push(`"State",${escapeCsv(order.shippingInfo?.state || "")}`);
  lines.push(`"Country",${escapeCsv(order.shippingInfo?.country || "India")}`);
  lines.push(`"Pincode",${escapeCsv(order.shippingInfo?.pincode || "")}`);
  lines.push(`"Complete Address",${escapeCsv(order.shippingInfo?.address || "")}`);
  lines.push(`"Delivery Instructions / Notes",${escapeCsv(order.shippingInfo?.notes || "None")}`);
  lines.push("");

  // Purchased Items Table
  lines.push(`"=== 3. ORDERED HARDWARE / ITEMS ==="`);
  lines.push(`"Item #","Product / Component Name","Quantity","Price per Unit (INR)","Total Item Price (INR)"`);

  items.forEach((item, index) => {
    const itemTotal = (item.price || 0) * (item.quantity || 1);
    lines.push(
      `${index + 1},${escapeCsv(item.name)},${item.quantity || 1},${item.price || 0},${itemTotal}`
    );
  });
  lines.push("");

  // Financial Summary
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  lines.push(`"=== 4. FINANCIAL SUMMARY ==="`);
  lines.push(`"Total Items Count",${totalQuantity}`);
  lines.push(`"Shipping & Delivery Charges","FREE"`);
  lines.push(`"Grand Total Amount (INR)",${order.totalPrice || 0}`);

  // Trigger download with UTF-8 BOM (\uFEFF) for immediate Excel compatibility
  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const fileId = order.trackingId || order._id || "Order";
  link.setAttribute("href", url);
  link.setAttribute("download", `GadgetZone_Order_${fileId}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Download Excel CSV for all orders combined (Master Sheet)
export function downloadAllOrdersExcel(orders: Order[]): void {
  const lines: string[] = [];

  lines.push(`"GADGETZONE - ALL CUSTOMER ORDERS MASTER EXPORT"`);
  lines.push(`"Export Timestamp",${escapeCsv(new Date().toLocaleString())}`);
  lines.push(`"Total Orders Count",${orders.length}`);
  lines.push("");

  // Column Headers
  lines.push(
    `"Order ID","Tracking ID","Order Date","Customer Name","Phone","Alternate Phone","Delivery Address","City","State","Pincode","Country","Ordered Items Breakdown","Total Item Units","Total Amount (INR)","Payment Method","Order Status","Tracking Stage","Customer Notes"`
  );

  orders.forEach((o) => {
    const itemsSummary = (o.items || [])
      .map((it) => `${it.name} (x${it.quantity || 1}) - Rs.${(it.price || 0) * (it.quantity || 1)}`)
      .join(" | ");

    const totalQty = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString() : "";
    const addr = o.shippingInfo?.address1
      ? `${o.shippingInfo.address1}${o.shippingInfo.address2 ? `, ${o.shippingInfo.address2}` : ""}`
      : o.shippingInfo?.address || "";

    lines.push(
      [
        escapeCsv(o._id),
        escapeCsv(o.trackingId || ""),
        escapeCsv(dateStr),
        escapeCsv(o.shippingInfo?.name || ""),
        escapeCsv(o.shippingInfo?.phone || ""),
        escapeCsv(o.shippingInfo?.alternatePhone || ""),
        escapeCsv(addr),
        escapeCsv(o.shippingInfo?.city || ""),
        escapeCsv(o.shippingInfo?.state || ""),
        escapeCsv(o.shippingInfo?.pincode || ""),
        escapeCsv(o.shippingInfo?.country || "India"),
        escapeCsv(itemsSummary),
        totalQty,
        o.totalPrice || 0,
        escapeCsv(o.paymentMethod || "COD"),
        escapeCsv(o.status || "Pending"),
        escapeCsv(`Stage ${o.trackingStage || 1}`),
        escapeCsv(o.shippingInfo?.notes || ""),
      ].join(",")
    );
  });

  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateTag = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `GadgetZone_Orders_Master_${dateTag}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

