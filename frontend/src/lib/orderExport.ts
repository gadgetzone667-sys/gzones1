import { jsPDF } from "jspdf";

export interface BuildPart {
  category: string;
  categoryLabel?: string;
  id?: string;
  name: string;
  price: number;
  brand?: string;
  specs?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  subtotal?: number;
  type?: "product" | "build";
  parts?: BuildPart[];
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

// Retrieve local orders - Orders are now strictly managed by MongoDB backend
export function getLocalOrders(): Order[] {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {}
  return [];
}

// Deprecated: Orders are stored directly in MongoDB via /api/orders
export function saveLocalOrder(_order: Order): void {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {}
}

// Cross-domain storage bridge initiator for admin subdomain
export function initCrossDomainOrderBridge(callback?: (orders: Order[]) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const hostname = window.location.hostname.toLowerCase();
  const targetOrigin =
    hostname.includes("localhost") || hostname === "127.0.0.1"
      ? window.location.origin
      : "https://gzones.in";

  const bridgeUrl = `${targetOrigin}/storage-bridge.html`;

  let iframe = document.getElementById("gz-storage-bridge-iframe") as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "gz-storage-bridge-iframe";
    iframe.src = bridgeUrl;
    iframe.style.position = "absolute";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.left = "-9999px";
    iframe.style.top = "-9999px";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    document.body.appendChild(iframe);
  }

  const handleMessage = (event: MessageEvent) => {
    if (
      !event.origin.includes("gzones.in") &&
      !event.origin.includes("localhost") &&
      !event.origin.includes("127.0.0.1")
    ) {
      return;
    }

    if (event.data?.type === "GZ_BRIDGE_READY") {
      iframe?.contentWindow?.postMessage({ type: "GZ_GET_LOCAL_ORDERS" }, "*");
    } else if (
      event.data?.type === "GZ_LOCAL_ORDERS_DATA" &&
      typeof event.data.payload === "string"
    ) {
      try {
        const received = JSON.parse(event.data.payload);
        if (Array.isArray(received) && received.length > 0) {
          const current = getLocalOrders();
          const map = new Map<string, Order>();
          received.forEach((o: Order) => {
            const key = o.orderId || o.trackingId || o._id;
            if (key) map.set(key, o);
          });
          current.forEach((o: Order) => {
            const key = o.orderId || o.trackingId || o._id;
            if (key && !map.has(key)) map.set(key, o);
          });
          const merged = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );
          localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(merged));
          if (callback) callback(merged);
        }
      } catch (err) {
        console.warn("Error parsing bridged orders:", err);
      }
    }
  };

  window.addEventListener("message", handleMessage);

  if (iframe.contentWindow) {
    try {
      iframe.contentWindow.postMessage({ type: "GZ_GET_LOCAL_ORDERS" }, "*");
    } catch {}
  }

  return () => {
    window.removeEventListener("message", handleMessage);
  };
}

// Order status updates are performed directly via backend API (/api/orders/:id/status)
export function updateLocalOrderStatus(
  _orderId: string,
  _status: string,
  _trackingStage?: number
): void {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {}
}

// Payment status updates are performed directly via backend API (/api/orders/:id/payment-status)
export function updateLocalPaymentStatus(
  _orderId: string,
  _paymentStatus: "Pending" | "Paid" | "Failed" | "Refunded"
): void {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {}
}

// Order deletions are performed directly via backend API (/api/orders/:id)
export function deleteLocalOrder(_orderId: string): void {
  try {
    localStorage.removeItem(ORDERS_STORAGE_KEY);
  } catch {}
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

  const itemsHtml = (order.items || []).map((it, idx) => {
    let partsHtml = "";
    if (Array.isArray(it.parts) && it.parts.length > 0) {
      partsHtml = `
        <div style="margin-top: 6px; padding: 6px 10px; background: #f8fafc; border-left: 3px solid #0284c7; border-radius: 4px; font-size: 11px;">
          <div style="font-weight: 700; color: #0369a1; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;">Configured Components:</div>
          <table style="width: 100%; border-collapse: collapse; margin: 0; font-size: 11px;">
            ${it.parts.map(p => `
              <tr>
                <td style="padding: 2px 4px; font-weight: 600; color: #475569; width: 140px;">${p.categoryLabel || p.category?.toUpperCase() || "COMPONENT"}:</td>
                <td style="padding: 2px 4px; color: #0f172a;">${p.name}${p.specs ? ` (${p.specs})` : ""}</td>
                <td style="padding: 2px 4px; text-align: right; color: #0284c7; font-weight: 600;">₹${(p.price || 0).toLocaleString()}</td>
              </tr>
            `).join("")}
          </table>
        </div>
      `;
    }
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">${idx + 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top;">
          <div style="font-weight: 600; font-size: 13px;">${it.name}</div>
          ${partsHtml}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; vertical-align: top;">${it.quantity || 1}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; vertical-align: top;">₹${(it.price || 0).toLocaleString()}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold; vertical-align: top;">₹${((it.price || 0) * (it.quantity || 1)).toLocaleString()}</td>
      </tr>
    `;
  }).join("");

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

/**
 * Convert numeric amounts to words for formal Indian Tax Invoices
 */
function numberToWords(num: number): string {
  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 10) return single[n];
    if (n < 20) return teens[n - 10];
    const unit = n % 10;
    return tens[Math.floor(n / 10)] + (unit ? ' ' + single[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (hundred) res += single[hundred] + ' Hundred';
    if (hundred && rest) res += ' and ';
    if (rest) res += convertTwoDigits(rest);
    return res;
  }

  const intNum = Math.floor(Math.abs(num));
  if (intNum === 0) return 'Zero Rupees Only';

  const crore = Math.floor(intNum / 10000000);
  const lakh = Math.floor((intNum % 10000000) / 100000);
  const thousand = Math.floor((intNum % 100000) / 1000);
  const hundredPart = intNum % 1000;

  const parts: string[] = [];
  if (crore) parts.push(convertTwoDigits(crore) + ' Crore');
  if (lakh) parts.push(convertTwoDigits(lakh) + ' Lakh');
  if (thousand) parts.push(convertTwoDigits(thousand) + ' Thousand');
  if (hundredPart) parts.push(convertThreeDigits(hundredPart));

  return parts.join(' ') + ' Rupees Only';
}

/**
 * Generate and download high-resolution GST Tax Invoice PDF
 */
export function downloadOrderPdf(order: Order): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Color Palette
  const primaryColor: [number, number, number] = [14, 116, 144]; // Deep cyan #0e7490
  const darkColor: [number, number, number] = [15, 23, 42];      // Slate 900 #0f172a
  const mutedColor: [number, number, number] = [100, 116, 139];  // Slate 500 #64748b
  const lightBg: [number, number, number] = [248, 250, 252];     // Slate 50
  const borderLight: [number, number, number] = [226, 232, 240]; // Slate 200

  // 1. Top Decorative Brand Bar
  doc.setFillColor(...primaryColor);
  doc.rect(margin, 12, contentWidth, 2, 'F');

  // Brand Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text('GADGET ZONE', margin, 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedColor);
  doc.text('PREMIUM GAMING PCs & HARDWARE HUB', margin, 29);

  // Right Side: Tax Invoice Title & Number
  const displayId = order.orderId || order._id || 'GZ-ORDER';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...darkColor);
  doc.text('TAX INVOICE', pageWidth - margin, 23, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...primaryColor);
  doc.text(`INVOICE NO: INV-${displayId}`, pageWidth - margin, 29, { align: 'right' });

  // 2. Company Info & Metadata Row
  let currentY = 36;
  doc.setDrawColor(...borderLight);
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;

  // Supplier / Seller Info (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkColor);
  doc.text('SOLD BY / SELLER DETAILS:', margin, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('GADGET ZONE (Retail & Tech Hub)', margin, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.text('No.5, 1st Street, Jayaram Nagar, Nerkundram', margin, currentY + 8.5);
  doc.text('Chennai, Tamil Nadu - 600107, India', margin, currentY + 12);
  doc.text('Phone: +91 9345600128 | Email: gadgetzone667@gmail.com', margin, currentY + 15.5);
  doc.text('GSTIN: 33AAACG1234F1Z5  |  State: Tamil Nadu (Code: 33)', margin, currentY + 19);

  // Invoice & Order Meta (Right Box)
  const metaX = 125;
  doc.setFillColor(...lightBg);
  doc.roundedRect(metaX - 2, currentY - 1, pageWidth - margin - metaX + 2, 22, 1.5, 1.5, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(metaX - 2, currentY - 1, pageWidth - margin - metaX + 2, 22, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  doc.text('Date of Invoice:', metaX, currentY + 3.5);
  doc.setFont('helvetica', 'normal');
  doc.text(orderDate, pageWidth - margin - 2, currentY + 3.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Order ID:', metaX, currentY + 7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${displayId}`, pageWidth - margin - 2, currentY + 7.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Tracking ID:', metaX, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(order.trackingId || 'TRK-PENDING', pageWidth - margin - 2, currentY + 11.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Method:', metaX, currentY + 15.5);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentMethod || 'Cash on Delivery (COD)', pageWidth - margin - 2, currentY + 15.5, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.text('Payment Status:', metaX, currentY + 19.5);
  doc.setFont('helvetica', 'normal');
  doc.text(order.paymentStatus || 'Pending on Delivery', pageWidth - margin - 2, currentY + 19.5, { align: 'right' });

  // 3. Buyer / Delivery Destination Info Box
  currentY += 26;
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'S');

  const customerName = order.customer?.name || order.shippingInfo?.name || 'Customer';
  const customerPhone = order.customer?.phone || order.shippingInfo?.phone || 'N/A';
  const customerEmail = order.customer?.email || 'N/A';
  const shippingAddress = order.shippingAddress?.address || order.shippingInfo?.address || 'Standard Shipping Address';
  const shippingState = order.shippingAddress?.state || order.shippingInfo?.state || 'Tamil Nadu';
  const shippingCity = order.shippingAddress?.city || order.shippingInfo?.city || 'Chennai';
  const shippingPin = order.shippingAddress?.pincode || order.shippingInfo?.pincode || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...darkColor);
  doc.text('BILL TO & SHIP TO (CUSTOMER DETAILS):', margin + 3, currentY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(customerName, margin + 3, currentY + 8.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  const cleanAddr = `${shippingAddress}${shippingCity && !shippingAddress.includes(shippingCity) ? ', ' + shippingCity : ''} - ${shippingPin}`;
  const splitAddr = doc.splitTextToSize(cleanAddr, 105);
  doc.text(splitAddr, margin + 3, currentY + 12.5);

  // Contact details on the right of Bill To box
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Contact Mobile:', margin + 115, currentY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(customerPhone, margin + 145, currentY + 4);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Email Address:', margin + 115, currentY + 8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  doc.text(customerEmail, margin + 145, currentY + 8.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text('Place of Supply:', margin + 115, currentY + 12.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...mutedColor);
  const isIntraState = shippingState.toLowerCase().includes('tamil nadu') || shippingState.toLowerCase().includes('tn');
  doc.text(`${shippingState} ${isIntraState ? '(State Code: 33)' : ''}`, margin + 145, currentY + 12.5);

  // 4. Products Table
  currentY += 23;

  const colX = {
    idx: margin + 2,
    desc: margin + 10,
    hsn: margin + 85,
    qty: margin + 107,
    unitBase: margin + 124,
    gstRate: margin + 146,
    total: pageWidth - margin - 2
  };

  doc.setFillColor(...primaryColor);
  doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('#', colX.idx, currentY + 4.8);
  doc.text('DESCRIPTION OF GOODS', colX.desc, currentY + 4.8);
  doc.text('HSN/SAC', colX.hsn, currentY + 4.8);
  doc.text('QTY', colX.qty, currentY + 4.8, { align: 'center' });
  doc.text('TAXABLE (Rs.)', colX.unitBase, currentY + 4.8, { align: 'right' });
  doc.text('GST (18%)', colX.gstRate, currentY + 4.8, { align: 'right' });
  doc.text('TOTAL (Rs.)', colX.total, currentY + 4.8, { align: 'right' });

  currentY += 7;

  // Items Rows
  const items = order.items && order.items.length > 0 ? order.items : [
    { productId: "1", name: 'Hardware Component', price: order.grandTotal || 0, quantity: 1 }
  ];

  const grandTotal = order.grandTotal ?? order.totalPrice ?? 0;

  items.forEach((item, index) => {
    const qty = item.quantity || 1;
    const itemTotalGross = (item.price || 0) * qty;

    // Proper Indian GST inclusive reverse calculation:
    // Taxable Base = Total / 1.18
    const itemTaxable = Math.round((itemTotalGross / 1.18) * 100) / 100;
    const itemGst = Math.round((itemTotalGross - itemTaxable) * 100) / 100;

    // Alternating row background
    if (index % 2 === 1) {
      doc.setFillColor(...lightBg);
      doc.rect(margin, currentY, contentWidth, 8, 'F');
    }

    doc.setDrawColor(...borderLight);
    doc.line(margin, currentY + 8, pageWidth - margin, currentY + 8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...darkColor);

    doc.text(String(index + 1), colX.idx, currentY + 5.2);

    // Truncate or wrap item name if long
    const cleanName = item.name || 'Component';
    const splitName = doc.splitTextToSize(cleanName, 72);
    doc.text(splitName[0], colX.desc, currentY + 5.2);

    // HSN Code
    const hsn = cleanName.toLowerCase().includes('headphone') || cleanName.toLowerCase().includes('audio') ? '8518' : '8471';
    doc.setTextColor(...mutedColor);
    doc.text(hsn, colX.hsn, currentY + 5.2);

    // Qty
    doc.setTextColor(...darkColor);
    doc.text(String(qty), colX.qty, currentY + 5.2, { align: 'center' });

    // Taxable Value
    doc.text(itemTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.unitBase, currentY + 5.2, { align: 'right' });

    // GST Amount
    doc.text(itemGst.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.gstRate, currentY + 5.2, { align: 'right' });

    // Total Amount
    doc.setFont('helvetica', 'bold');
    doc.text(itemTotalGross.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.total, currentY + 5.2, { align: 'right' });

    currentY += 8;

    // Render itemized parts if this item is a custom PC build
    if (Array.isArray(item.parts) && item.parts.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...primaryColor);
      doc.text('CONFIGURED BUILD SPECIFICATIONS:', colX.desc + 2, currentY + 3);
      currentY += 4.5;

      item.parts.forEach((p) => {
        if (currentY > 265) {
          doc.addPage();
          currentY = 20;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...darkColor);
        const pLabel = `${p.categoryLabel || p.category?.toUpperCase() || 'PART'}: ${p.name}`;
        doc.text(`• ${pLabel.slice(0, 65)}`, colX.desc + 4, currentY + 3);
        doc.setTextColor(...mutedColor);
        doc.text(`Rs. ${(p.price || 0).toLocaleString()}`, colX.total, currentY + 3, { align: 'right' });
        currentY += 4;
      });
      currentY += 2;
    }
  });

  // Accurate overall GST Calculation matching Grand Total
  const totalTaxableAmount = Math.round((grandTotal / 1.18) * 100) / 100;
  const totalGstAmount = Math.round((grandTotal - totalTaxableAmount) * 100) / 100;

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isIntraState) {
    cgstAmount = Math.round((totalGstAmount / 2) * 100) / 100;
    sgstAmount = Math.round((totalGstAmount - cgstAmount) * 100) / 100;
  } else {
    igstAmount = totalGstAmount;
  }

  // 5. GST Breakdown & Financial Totals Box
  currentY += 4;
  const summaryBoxY = currentY;

  // Left Side: Amount in Words & Terms Box
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, summaryBoxY, 100, 42, 1.5, 1.5, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(margin, summaryBoxY, 100, 42, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);
  doc.text('TOTAL AMOUNT IN WORDS:', margin + 3, summaryBoxY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  const words = numberToWords(grandTotal);
  const splitWords = doc.splitTextToSize(words, 94);
  doc.text(splitWords, margin + 3, summaryBoxY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);
  doc.text('TERMS & CONDITIONS:', margin + 3, summaryBoxY + 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...mutedColor);
  doc.text('1. 7 Days Replacement guarantee for manufacturing defects.', margin + 3, summaryBoxY + 25.5);
  doc.text('2. All items carry official manufacturer warranty per serial numbers.', margin + 3, summaryBoxY + 29.5);
  doc.text('3. Subject to Chennai jurisdiction. View full terms at gzones.in/terms', margin + 3, summaryBoxY + 33.5);
  doc.text('4. This is a computer generated invoice and requires no physical signature.', margin + 3, summaryBoxY + 37.5);

  // Right Side: Calculation Totals Table
  const calcX = margin + 104;
  const calcWidth = contentWidth - 104;
  const calcRight = pageWidth - margin - 3;

  doc.setFillColor(...lightBg);
  doc.roundedRect(calcX, summaryBoxY, calcWidth, 42, 1.5, 1.5, 'F');
  doc.setDrawColor(...borderLight);
  doc.roundedRect(calcX, summaryBoxY, calcWidth, 42, 1.5, 1.5, 'S');

  let calcRowY = summaryBoxY + 5;

  // Subtotal (Taxable Value)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...darkColor);
  doc.text('Taxable Value (Base Price):', calcX + 3, calcRowY);
  doc.text(`Rs. ${totalTaxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, calcRight, calcRowY, { align: 'right' });

  // GST Breakdown (CGST + SGST or IGST)
  calcRowY += 4.5;
  if (isIntraState) {
    doc.text('Central GST (CGST @ 9%):', calcX + 3, calcRowY);
    doc.text(`Rs. ${cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, calcRight, calcRowY, { align: 'right' });

    calcRowY += 4.5;
    doc.text('State GST (SGST @ 9%):', calcX + 3, calcRowY);
    doc.text(`Rs. ${sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, calcRight, calcRowY, { align: 'right' });
  } else {
    doc.text('Integrated GST (IGST @ 18%):', calcX + 3, calcRowY);
    doc.text(`Rs. ${igstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, calcRight, calcRowY, { align: 'right' });
    calcRowY += 4.5;
  }

  // Delivery Charges
  calcRowY += 4.5;
  doc.text('Delivery / Shipping:', calcX + 3, calcRowY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105); // emerald 600
  doc.text('FREE', calcRight, calcRowY, { align: 'right' });

  // Divider
  calcRowY += 3;
  doc.setDrawColor(...borderLight);
  doc.line(calcX + 2, calcRowY, calcX + calcWidth - 2, calcRowY);

  // Grand Total Highlight
  calcRowY += 6;
  doc.setFillColor(...primaryColor);
  doc.roundedRect(calcX + 2, calcRowY - 4.5, calcWidth - 4, 9, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('GRAND TOTAL (Inc. GST):', calcX + 5, calcRowY + 1.5);
  doc.text(`Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, calcRight - 2, calcRowY + 1.5, { align: 'right' });

  // 6. Signatory & Bottom Footer
  currentY = summaryBoxY + 48;
  doc.setDrawColor(...borderLight);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.text('For queries or support regarding this invoice, contact: support@gzones.in | +91 9345600128', margin, currentY + 4.5);
  doc.text('Authorized Signatory for GADGET ZONE', pageWidth - margin, currentY + 4.5, { align: 'right' });

  // Trigger browser download of PDF
  doc.save(`GadgetZone_Invoice_${displayId}.pdf`);
}
