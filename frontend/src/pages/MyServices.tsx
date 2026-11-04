import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  MessageSquare,
  Printer,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export interface ServiceBookingItem {
  _id?: string;
  id?: string;
  bookingId: string;
  customerName: string;
  phone1: string;
  phone2?: string;
  address: string;
  serviceId?: string;
  serviceName: string;
  servicePrice?: string;
  bookingDate: string;
  preferredTime: string;
  purpose: string;
  status: "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
  assignedTechnician?: string;
  technicianNotes?: string;
  createdAt?: string;
  statusHistory?: Array<{ status: string; note: string; updatedAt: string }>;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; step: number }
> = {
  "Pending Review": {
    label: "Pending Review",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    step: 1,
  },
  Pending: {
    label: "Requested (Under Review)",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    step: 1,
  },
  Confirmed: {
    label: "Confirmed (Technician Assigned)",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    step: 2,
  },
  "In Progress": {
    label: "In Progress (Diagnostics / Repair)",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    step: 3,
  },
  Completed: {
    label: "Completed & Verified",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    step: 4,
  },
  Cancelled: {
    label: "Booking Cancelled",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    step: 0,
  },
};

const serviceWorkflowSteps = [
  { label: "1. Requested", step: 1 },
  { label: "2. Confirmed", step: 2 },
  { label: "3. In Repair", step: 3 },
  { label: "4. Completed", step: 4 },
];

const MyServices = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<ServiceBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let serverBookings: ServiceBookingItem[] = [];

      if (token) {
        try {
          const res = await fetch("/api/services/my-bookings", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) serverBookings = data;
          }
        } catch (e) {
          console.warn("Server service bookings unreachable:", e);
        }
      }

      // Also merge any local bookings stored on this machine
      let localBookings: ServiceBookingItem[] = [];
      try {
        const raw = localStorage.getItem("GadgetZone_service_bookings");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localBookings = parsed;
        }
      } catch (e) {
        console.warn("Local storage bookings parsing error:", e);
      }

      // De-duplicate by bookingId
      const map = new Map<string, ServiceBookingItem>();
      [...serverBookings, ...localBookings].forEach((b) => {
        if (b?.bookingId) map.set(b.bookingId, b);
      });

      const sorted = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setBookings(sorted);
    } catch (err) {
      console.error(err);
      toast.error("Could not load your service bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token, user]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Booking ID ${id} copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCancelBooking = async (booking: ServiceBookingItem) => {
    const targetId = booking._id || booking.id;
    if (!targetId) return;

    if (!window.confirm(`Are you sure you want to cancel service booking #${booking.bookingId}?`)) {
      return;
    }

    setCancellingId(targetId);
    try {
      const res = await fetch(`/api/services/bookings/${targetId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: "Cancelled by customer via My Services portal" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel booking.");

      toast.success(data.message || "Service booking cancelled.");

      // Update state
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === booking.bookingId ? { ...b, status: "Cancelled" } : b
        )
      );

      // Update local storage cache
      try {
        const raw = localStorage.getItem("GadgetZone_service_bookings");
        if (raw) {
          const parsed: ServiceBookingItem[] = JSON.parse(raw);
          const updated = parsed.map((b) =>
            b.bookingId === booking.bookingId ? { ...b, status: "Cancelled" } : b
          );
          localStorage.setItem("GadgetZone_service_bookings", JSON.stringify(updated));
        }
      } catch {}
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel service booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const handlePrintSlip = (booking: ServiceBookingItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print service slip.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Booking Slip - ${booking.bookingId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #111; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #38bdf8; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; }
          .brand { font-size: 20px; font-weight: 900; }
          .brand span { color: #38bdf8; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 999px; font-weight: 700; font-size: 12px; border: 1px solid #ccc; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
          th, td { text-align: left; padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
          th { background: #f8fafc; font-weight: 600; width: 30%; }
          .notes { background: #f1f5f9; padding: 12px; border-radius: 8px; border-left: 4px solid #38bdf8; margin-top: 14px; font-size: 12px; }
          .footer { margin-top: 30px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">GADGET<span>ZONE</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Tech Services & Hardware Repair Hub</div>
          </div>
          <div style="text-align: right;">
            <div class="title">SERVICE JOB SLIP</div>
            <div style="font-family: monospace; font-weight: 700; font-size: 14px; color: #0284c7;">#${booking.bookingId}</div>
          </div>
        </div>

        <table>
          <tr><th>Service Requested</th><td><strong>${booking.serviceName}</strong></td></tr>
          <tr><th>Current Status</th><td><strong>${booking.status}</strong></td></tr>
          <tr><th>Customer Name</th><td>${booking.customerName}</td></tr>
          <tr><th>Contact Phone</th><td>${booking.phone1} ${booking.phone2 ? " / " + booking.phone2 : ""}</td></tr>
          <tr><th>Service Address</th><td>${booking.address}</td></tr>
          <tr><th>Preferred Appointment</th><td><strong>${booking.bookingDate} at ${booking.preferredTime}</strong></td></tr>
          <tr><th>Estimated / Stated Price</th><td>${booking.servicePrice || "Quote on inspection"}</td></tr>
          <tr><th>Assigned Technician</th><td>${booking.assignedTechnician || "GadgetZone Service Team"}</td></tr>
          <tr><th>Reported Issue / Purpose</th><td>${booking.purpose}</td></tr>
          ${booking.technicianNotes ? `<tr><th>Technician Remarks</th><td>${booking.technicianNotes}</td></tr>` : ""}
          <tr><th>Booking Date</th><td>${booking.createdAt ? new Date(booking.createdAt).toLocaleString() : "Recent"}</td></tr>
        </table>

        <div class="notes">
          <strong>Customer Note:</strong> Our authorized hardware specialist will verify hardware integrity before performing repairs. For real-time updates or scheduling queries, call +91 9345600128 or email support@gzones.in.
        </div>

        <div class="footer">
          Gadget Zone • 100% Genuine Parts & Certified Technicians • Chennai, Tamil Nadu • https://gzones.in
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const getWhatsAppChatUrl = (b: ServiceBookingItem) => {
    const text = `Hello GadgetZone, I am checking status on my Service Booking *#${b.bookingId}* for *${b.serviceName}* scheduled on ${b.bookingDate} (${b.preferredTime}).`;
    return `https://wa.me/919345600128?text=${encodeURIComponent(text)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading your service bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background text-foreground">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400">
                <Wrench className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                Customer Care & Repairs
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              My Service Bookings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Track technician visits, hardware diagnostics, and real-time repair workflow progress.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBookings}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={() => navigate("/services")}
              className="gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              <Wrench className="h-3.5 w-3.5" /> Book Another Service
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {bookings.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 px-4 text-center bg-card/40 rounded-3xl border border-dashed border-border"
          >
            <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-5 shadow-inner">
              <Wrench className="h-10 w-10 stroke-[1.8]" />
            </div>
            <h2 className="font-display text-2xl font-bold mb-2 tracking-tight">
              No Service Bookings Found
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
              You haven't requested any tech services yet. We provide expert Custom PC Assembly, CCTV Installation, Printer Servicing, Data Recovery, and Chip-Level Laptop Repairs.
            </p>
            <Button
              onClick={() => navigate("/services")}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-primary/20"
            >
              Explore Available Services
            </Button>
          </motion.div>
        ) : (
          /* Bookings List */
          <div className="space-y-6">
            {bookings.map((booking, index) => {
              const cfg = statusConfig[booking.status] || statusConfig.Pending;
              const isCancelled = booking.status === "Cancelled";

              return (
                <motion.div
                  key={booking.bookingId || index}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl border border-border/80 shadow-md overflow-hidden hover:border-border transition-all duration-200"
                >
                  {/* Top Header */}
                  <div className="p-4 sm:p-5 bg-gradient-to-r from-muted/50 via-muted/20 to-transparent border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                            {booking.serviceName}
                          </h3>
                          <button
                            onClick={() => handleCopyId(booking.bookingId)}
                            className="inline-flex items-center gap-1 font-mono text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 px-2 py-0.5 rounded-md transition-colors"
                            title="Click to copy booking ID"
                          >
                            <span>#{booking.bookingId}</span>
                            {copiedId === booking.bookingId ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-60" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Booked on: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent"}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.color} ${cfg.bg} border ${cfg.border}`}
                      >
                        {isCancelled ? (
                          <XCircle className="h-3.5 w-3.5" />
                        ) : cfg.step === 4 ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                        <span>{cfg.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Visual Workflow Stepper (if not cancelled) */}
                  {!isCancelled && (
                    <div className="px-5 py-4 bg-muted/20 border-b border-border/60">
                      <div className="grid grid-cols-4 gap-2 relative">
                        {serviceWorkflowSteps.map((stepItem) => {
                          const isDone = cfg.step >= stepItem.step;
                          const isCurrent = cfg.step === stepItem.step;

                          return (
                            <div key={stepItem.step} className="flex flex-col items-center text-center">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all mb-1.5 ${
                                  isDone
                                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-2 ring-purple-400/40"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {isDone ? <Check className="h-4 w-4" /> : stepItem.step}
                              </div>
                              <span
                                className={`text-[10px] sm:text-xs font-semibold ${
                                  isCurrent
                                    ? "text-purple-400 font-bold"
                                    : isDone
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {stepItem.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Main Details Grid */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                      {/* Appointment */}
                      <div className="space-y-1 bg-background/50 p-3 rounded-xl border border-border/60">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-sky-400" />
                          <span>Appointment Slot</span>
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {booking.bookingDate}
                        </p>
                        <p className="text-muted-foreground text-[11px] font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {booking.preferredTime}
                        </p>
                      </div>

                      {/* Customer & Phone */}
                      <div className="space-y-1 bg-background/50 p-3 rounded-xl border border-border/60">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-400" />
                          <span>Contact Person</span>
                        </span>
                        <p className="font-bold text-foreground text-sm">
                          {booking.customerName}
                        </p>
                        <p className="text-muted-foreground text-[11px] font-mono">
                          {booking.phone1} {booking.phone2 ? `• ${booking.phone2}` : ""}
                        </p>
                      </div>

                      {/* Location / Address */}
                      <div className="space-y-1 bg-background/50 p-3 rounded-xl border border-border/60">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-rose-400" />
                          <span>Service Location</span>
                        </span>
                        <p className="font-medium text-foreground line-clamp-2" title={booking.address}>
                          {booking.address}
                        </p>
                      </div>

                      {/* Estimated Fee */}
                      <div className="space-y-1 bg-background/50 p-3 rounded-xl border border-border/60">
                        <span className="text-muted-foreground font-medium flex items-center gap-1.5">
                          <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                          <span>Pricing / Fee</span>
                        </span>
                        <p className="font-bold text-purple-400 text-sm">
                          {booking.servicePrice || "Quote on Inspection"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Pay upon completion & verification
                        </p>
                      </div>
                    </div>

                    {/* Problem Description */}
                    <div className="bg-muted/30 p-3.5 rounded-xl border border-border/70">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5 mb-1">
                        <MessageSquare className="h-3.5 w-3.5 text-primary" />
                        <span>Problem / Service Details Reported</span>
                      </span>
                      <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {booking.purpose}
                      </p>
                    </div>

                    {/* Technician Notes (if admin updated) */}
                    {booking.technicianNotes && (
                      <div className="bg-sky-500/10 border border-sky-500/30 p-3.5 rounded-xl space-y-1 animate-fade-in-up">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0" />
                          <span className="text-xs font-bold text-sky-300">
                            Technician Remark ({booking.assignedTechnician || "GadgetZone Specialist"})
                          </span>
                        </div>
                        <p className="text-xs text-sky-100/90 leading-relaxed pl-6">
                          {booking.technicianNotes}
                        </p>
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {/* Print Slip */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintSlip(booking)}
                          className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Print Slip</span>
                        </Button>

                        {/* WhatsApp Support */}
                        <a
                          href={getWhatsAppChatUrl(booking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold transition-colors shadow-sm"
                        >
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z" />
                          </svg>
                          <span>WhatsApp Desk</span>
                        </a>

                        {/* Call Button */}
                        <a
                          href="tel:+919345600128"
                          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors border border-border"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span>Call Specialist</span>
                        </a>
                      </div>

                      {/* Cancel Booking if Pending */}
                      {booking.status === "Pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={cancellingId === (booking._id || booking.id)}
                          onClick={() => handleCancelBooking(booking)}
                          className="h-8 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer font-semibold gap-1.5"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>
                            {cancellingId === (booking._id || booking.id)
                              ? "Cancelling..."
                              : "Cancel Request"}
                          </span>
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyServices;
