export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal?: number;
}

export interface OrderCustomer {
  name: string;
  email: string;
  phone: string;
  alternatePhone?: string;
}

export interface OrderShippingAddress {
  address: string;
  address1?: string;
  address2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  notes?: string;
}

export interface Order {
  _id: string;
  orderId?: string;
  userId?: string;
  customer?: OrderCustomer;
  shippingAddress?: OrderShippingAddress;
  items: OrderItem[];
  subtotal?: number;
  deliveryCharges?: number;
  grandTotal?: number;
  paymentMethod: string;
  paymentStatus?: "Pending" | "Paid" | "Failed" | "Refunded";
  orderStatus?: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  trackingStage?: number;
  trackingId?: string;
  courier?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt?: string;

  // Backwards compatibility aliases
  status?: "Pending" | "Confirmed" | "Processing" | "Shipped" | "Delivered" | "Cancelled";
  totalPrice?: number;
  shippingInfo?: {
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
      (o) =>
        (order._id && o._id === order._id) ||
        (order.orderId && o.orderId === order.orderId) ||
        (order.trackingId && o.trackingId === order.trackingId)
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
      o._id === orderId || o.orderId === orderId || o.trackingId === orderId
        ? {
            ...o,
            orderStatus: status as any,
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

// Update payment status in local storage
export function updateLocalPaymentStatus(
  orderId: string,
  paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded"
): void {
  try {
    const current = getLocalOrders();
    const updated = current.map((o) =>
      o._id === orderId || o.orderId === orderId || o.trackingId === orderId
        ? { ...o, paymentStatus }
        : o
    );
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to update payment status in localStorage:", err);
  }
}

// Delete an order from local storage
export function deleteLocalOrder(orderId: string): void {
  try {
    const current = getLocalOrders();
    const updated = current.filter(
      (o) => o._id !== orderId && o.orderId !== orderId && o.trackingId !== orderId
    );
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to delete order from localStorage:", err);
  }
}

// Download Excel CSV for a single individual order
export function downloadOrderExcel(order: Order): void {
  const items = order.items || [];
  const lines: string[] = [];

  const customerName = order.customer?.name || order.shippingInfo?.name || "Customer";
  const customerEmail = order.customer?.email || "";
  const customerPhone = order.customer?.phone || order.shippingInfo?.phone || "";
  const customerAltPhone = order.customer?.alternatePhone || order.shippingInfo?.alternatePhone || "";
  const address1 = order.shippingAddress?.address1 || order.shippingInfo?.address1 || order.shippingAddress?.address || order.shippingInfo?.address || "";
  const address2 = order.shippingAddress?.address2 || order.shippingInfo?.address2 || "";
  const city = order.shippingAddress?.city || order.shippingInfo?.city || "";
  const state = order.shippingAddress?.state || order.shippingInfo?.state || "";
  const pincode = order.shippingAddress?.pincode || order.shippingInfo?.pincode || "";
  const notes = order.shippingAddress?.notes || order.shippingInfo?.notes || "";
  const fullAddress = order.shippingAddress?.address || order.shippingInfo?.address || `${address1}, ${city}, ${state} - ${pincode}`;
  const totalAmount = order.grandTotal ?? order.totalPrice ?? 0;
  const currentStatus = order.orderStatus || order.status || "Pending";
  const displayId = order.orderId || order._id;

  // Header Title
  lines.push(`"GADGETZONE - OFFICIAL CUSTOMER ORDER & INVOICE"`);
  lines.push(`"Exported Date & Time",${escapeCsv(new Date().toLocaleString())}`);
  lines.push("");

  // Order Details
  lines.push(`"=== 1. ORDER DETAILS ==="`);
  lines.push(`"Order ID",${escapeCsv(displayId)}`);
  lines.push(`"Tracking ID",${escapeCsv(order.trackingId || "N/A")}`);
  lines.push(`"Order Date",${escapeCsv(order.createdAt ? new Date(order.createdAt).toLocaleString() : new Date().toLocaleString())}`);
  lines.push(`"Order Status",${escapeCsv(currentStatus)}`);
  lines.push(`"Payment Method",${escapeCsv(order.paymentMethod || "Cash on Delivery")}`);
  lines.push(`"Payment Status",${escapeCsv(order.paymentStatus || "Pending")}`);
  lines.push(`"Courier Partner",${escapeCsv(order.courier || "SpeedPost Express")}`);
  lines.push("");

  // Customer & Shipping Details
  lines.push(`"=== 2. CUSTOMER & SHIPPING INFORMATION ==="`);
  lines.push(`"Customer Name",${escapeCsv(customerName)}`);
  lines.push(`"Customer Email",${escapeCsv(customerEmail)}`);
  lines.push(`"Contact Mobile",${escapeCsv(customerPhone)}`);
  lines.push(`"Alternate Mobile",${escapeCsv(customerAltPhone || "None")}`);
  lines.push(`"Address Line 1",${escapeCsv(address1)}`);
  lines.push(`"Address Line 2",${escapeCsv(address2)}`);
  lines.push(`"City",${escapeCsv(city)}`);
  lines.push(`"State",${escapeCsv(state)}`);
  lines.push(`"Postal Pincode",${escapeCsv(pincode)}`);
  lines.push(`"Complete Delivery Address",${escapeCsv(fullAddress)}`);
  lines.push(`"Customer Notes",${escapeCsv(notes || "None")}`);
  lines.push("");

  // Purchased Items Table
  lines.push(`"=== 3. ORDERED PRODUCTS ==="`);
  lines.push(`"Item #","Product / Component Name","Quantity","Price per Unit (INR)","Subtotal (INR)"`);

  items.forEach((item, index) => {
    const itemSub = item.subtotal ?? (item.price || 0) * (item.quantity || 1);
    lines.push(
      `${index + 1},${escapeCsv(item.name)},${item.quantity || 1},${item.price || 0},${itemSub}`
    );
  });
  lines.push("");

  // Financial Summary
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
  lines.push(`"=== 4. ORDER SUMMARY ==="`);
  lines.push(`"Total Product Units",${totalQuantity}`);
  lines.push(`"Subtotal (INR)",${order.subtotal ?? totalAmount}`);
  lines.push(`"Delivery Charges (INR)","FREE"`);
  lines.push(`"Grand Total (INR)",${totalAmount}`);

  // Trigger download with UTF-8 BOM (\uFEFF)
  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `GadgetZone_Order_${displayId}.csv`);
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
    `"Order ID","Tracking ID","Order Date","Customer Name","Email","Phone","Alternate Phone","Delivery Address","City","State","Pincode","Ordered Products","Product Units","Subtotal (INR)","Delivery Charges","Grand Total (INR)","Payment Method","Payment Status","Order Status","Customer Notes"`
  );

  orders.forEach((o) => {
    const itemsSummary = (o.items || [])
      .map((it) => `${it.name} (x${it.quantity || 1}) - Rs.${(it.price || 0) * (it.quantity || 1)}`)
      .join(" | ");

    const totalQty = (o.items || []).reduce((sum, it) => sum + (it.quantity || 1), 0);
    const dateStr = o.createdAt ? new Date(o.createdAt).toLocaleString() : "";
    const name = o.customer?.name || o.shippingInfo?.name || "Customer";
    const email = o.customer?.email || "";
    const phone = o.customer?.phone || o.shippingInfo?.phone || "";
    const altPhone = o.customer?.alternatePhone || o.shippingInfo?.alternatePhone || "";
    const addr = o.shippingAddress?.address || o.shippingInfo?.address || "";
    const city = o.shippingAddress?.city || o.shippingInfo?.city || "";
    const state = o.shippingAddress?.state || o.shippingInfo?.state || "";
    const pincode = o.shippingAddress?.pincode || o.shippingInfo?.pincode || "";
    const notes = o.shippingAddress?.notes || o.shippingInfo?.notes || "";
    const totalAmount = o.grandTotal ?? o.totalPrice ?? 0;
    const subtotal = o.subtotal ?? totalAmount;
    const status = o.orderStatus || o.status || "Pending";
    const paymentStatus = o.paymentStatus || "Pending";

    lines.push(
      [
        escapeCsv(o.orderId || o._id),
        escapeCsv(o.trackingId || ""),
        escapeCsv(dateStr),
        escapeCsv(name),
        escapeCsv(email),
        escapeCsv(phone),
        escapeCsv(altPhone),
        escapeCsv(addr),
        escapeCsv(city),
        escapeCsv(state),
        escapeCsv(pincode),
        escapeCsv(itemsSummary),
        totalQty,
        subtotal,
        0,
        totalAmount,
        escapeCsv(o.paymentMethod || "COD"),
        escapeCsv(paymentStatus),
        escapeCsv(status),
        escapeCsv(notes),
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

// Print Order Invoice in Browser
export function printOrderInvoice(order: Order): void {
  const customerName = order.customer?.name || order.shippingInfo?.name || "Valued Customer";
  const customerEmail = order.customer?.email || "";
  const customerPhone = order.customer?.phone || order.shippingInfo?.phone || "";
  const fullAddress = order.shippingAddress?.address || order.shippingInfo?.address || "Delivery Address";
  const displayId = order.orderId || order._id;
  const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const totalAmount = (order.grandTotal ?? order.totalPrice ?? 0).toLocaleString();
  const status = order.orderStatus || order.status || "Pending";

  const itemsHtml = (order.items || []).map((it, idx) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${idx + 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${it.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${it.quantity || 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">₹${(it.price || 0).toLocaleString()}</td>
      <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">₹${((it.price || 0) * (it.quantity || 1)).toLocaleString()}</td>
    </tr>
  `).join("");

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Invoice - ${displayId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1e293b; padding: 40px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0284c7; padding-bottom: 20px; }
          .brand { font-size: 24px; font-weight: 800; color: #0284c7; }
          .invoice-tag { font-size: 20px; font-weight: bold; }
          .meta-grid { display: flex; justify-content: space-between; margin: 30px 0; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th { background: #f8fafc; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #cbd5e1; }
          .totals { margin-left: auto; width: 300px; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .grand-total { font-size: 18px; font-weight: bold; color: #0284c7; border-top: 2px solid #cbd5e1; padding-top: 8px; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">GADGET ZONE</div>
          <div class="invoice-tag">TAX INVOICE / ORDER RECEIPT</div>
        </div>
        <div class="meta-grid">
          <div>
            <strong>BILLED & SHIPPED TO:</strong><br>
            <strong>${customerName}</strong><br>
            Phone: ${customerPhone}<br>
            Email: ${customerEmail}<br>
            Address: ${fullAddress}
          </div>
          <div style="text-align: right;">
            <strong>ORDER NUMBER:</strong> #${displayId}<br>
            <strong>DATE:</strong> ${dateStr}<br>
            <strong>PAYMENT:</strong> ${order.paymentMethod || "Cash on Delivery"}<br>
            <strong>STATUS:</strong> ${status}
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product Description</th>
              <th style="text-align: center;">Qty</th>
              <th style="text-align: right;">Unit Price</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        <div class="totals">
          <div class="total-row"><span>Subtotal:</span><span>₹${totalAmount}</span></div>
          <div class="total-row"><span>Shipping Charges:</span><span style="color: #059669;">FREE</span></div>
          <div class="total-row grand-total"><span>Grand Total:</span><span>₹${totalAmount}</span></div>
        </div>
        <div class="footer">
          Thank you for choosing Gadget Zone! For inquiries, email support@gzones.in.
        </div>
        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
}
