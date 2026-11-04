import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import {
  Wrench,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  RefreshCw,
  FileText,
  Star,
  UserCheck,
  Send,
  Copy,
  Check,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import { toast } from "sonner";

export interface ServiceBookingItem {
  _id?: string;
  id?: string;
  bookingId: string;
  customerName: string;
  primaryPhone?: string;
  phone1: string;
  alternatePhone?: string;
  phone2?: string;
  address: string;
  serviceId?: string;
  serviceName: string;
  servicePrice?: string;
  preferredDate?: string;
  bookingDate: string;
  preferredTime: string;
  bookingPurpose?: string;
  purpose: string;
  bookingStatus?: string;
  status: "Pending Review" | "Pending" | "Confirmed" | "In Progress" | "Completed" | "Cancelled";
  assignedEngineer?: string;
  assignedTechnician?: string;
  adminNotes?: string;
  technicianNotes?: string;
  cancellationReason?: string;
  rating?: number | null;
  reviewComment?: string;
  reviewedAt?: string | null;
  createdAt?: string;
  statusHistory?: Array<{ status: string; note: string; updatedAt: string }>;
}

const statusConfig: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string; step: number }
> = {
  "Pending Review": {
    label: "Pending Review",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    step: 1,
  },
  Pending: {
    label: "Pending Review",
    icon: Clock,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    step: 1,
  },
  Confirmed: {
    label: "Booking Confirmed",
    icon: CheckCircle2,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    step: 2,
  },
  "In Progress": {
    label: "In Diagnostics / Repair",
    icon: Wrench,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    step: 3,
  },
  Completed: {
    label: "Completed & Verified",
    icon: CheckCircle2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    step: 4,
  },
  Cancelled: {
    label: "Booking Cancelled",
    icon: XCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    step: 0,
  },
};

const serviceTrackingSteps = [
  { label: "Service Requested", step: 1 },
  { label: "Booking Confirmed", step: 2 },
  { label: "Diagnostics & Repair", step: 3 },
  { label: "Service Completed", step: 4 },
];

const MyServices = () => {
  const { token, user } = useAuth();
  const [bookings, setBookings] = useState<ServiceBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Rating input state keyed by bookingId
  const [ratingInputs, setRatingInputs] = useState<
    Record<string, { stars: number; hoverStars: number; comment: string; submitting: boolean }>
  >({});

  const fetchBookings = async (silent = false) => {
    if (!silent) setLoading(true);
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
      if (!silent) toast.error("Could not load your service bookings.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token, user]);

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Booking ID #${id} copied!`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCancelBooking = async (booking: ServiceBookingItem) => {
    const targetId = booking._id || booking.id || booking.bookingId;
    if (!targetId) return;

    if (!window.confirm(`Are you sure you want to cancel service booking #${booking.bookingId}?`)) {
      return;
    }

    setCancellingId(booking.bookingId);
    try {
      const res = await fetch(`/api/services/bookings/${targetId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason: "Cancelled by customer via Service Tracking page" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel booking.");

      toast.success(data.message || "Service booking cancelled.");

      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === booking.bookingId ? { ...b, status: "Cancelled", bookingStatus: "Cancelled" } : b
        )
      );

      try {
        const raw = localStorage.getItem("GadgetZone_service_bookings");
        if (raw) {
          const parsed: ServiceBookingItem[] = JSON.parse(raw);
          const updated = parsed.map((b) =>
            b.bookingId === booking.bookingId ? { ...b, status: "Cancelled", bookingStatus: "Cancelled" } : b
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

  const handleSetStars = (bookingId: string, stars: number) => {
    setRatingInputs((prev) => ({
      ...prev,
      [bookingId]: {
        stars,
        hoverStars: stars,
        comment: prev[bookingId]?.comment || "",
        submitting: false,
      },
    }));
  };

  const handleHoverStars = (bookingId: string, hoverStars: number) => {
    setRatingInputs((prev) => ({
      ...prev,
      [bookingId]: {
        stars: prev[bookingId]?.stars || 0,
        hoverStars,
        comment: prev[bookingId]?.comment || "",
        submitting: false,
      },
    }));
  };

  const handleCommentChange = (bookingId: string, comment: string) => {
    setRatingInputs((prev) => ({
      ...prev,
      [bookingId]: {
        stars: prev[bookingId]?.stars || 0,
        hoverStars: prev[bookingId]?.hoverStars || 0,
        comment,
        submitting: false,
      },
    }));
  };

  const handleSubmitRating = async (booking: ServiceBookingItem) => {
    const current = ratingInputs[booking.bookingId];
    if (!current?.stars) {
      toast.error("Please click on a star to select your rating (1 to 5 stars).");
      return;
    }

    const targetId = booking._id || booking.id || booking.bookingId;
    setRatingInputs((prev) => ({
      ...prev,
      [booking.bookingId]: { ...prev[booking.bookingId], submitting: true },
    }));

    try {
      const res = await fetch(`/api/services/bookings/${targetId}/rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating: current.stars,
          reviewComment: current.comment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit rating.");

      toast.success("Thank you for rating our service! ⭐⭐⭐⭐⭐");

      const nowIso = new Date().toISOString();
      setBookings((prev) =>
        prev.map((b) =>
          b.bookingId === booking.bookingId
            ? {
                ...b,
                rating: current.stars,
                reviewComment: current.comment.trim(),
                reviewedAt: nowIso,
              }
            : b
        )
      );

      try {
        const raw = localStorage.getItem("GadgetZone_service_bookings");
        if (raw) {
          const parsed: ServiceBookingItem[] = JSON.parse(raw);
          const updated = parsed.map((b) =>
            b.bookingId === booking.bookingId
              ? {
                  ...b,
                  rating: current.stars,
                  reviewComment: current.comment.trim(),
                  reviewedAt: nowIso,
                }
              : b
          );
          localStorage.setItem("GadgetZone_service_bookings", JSON.stringify(updated));
        }
      } catch {}
    } catch (err: any) {
      toast.error(err.message || "Failed to submit service rating.");
    } finally {
      setRatingInputs((prev) => ({
        ...prev,
        [booking.bookingId]: { ...prev[booking.bookingId], submitting: false },
      }));
    }
  };

  const handlePrintSlip = (booking: ServiceBookingItem) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to print service slip.");
      return;
    }

    const phone = booking.primaryPhone || booking.phone1 || "N/A";
    const altPhone = booking.alternatePhone || booking.phone2 ? ` / ${booking.alternatePhone || booking.phone2}` : "";
    const slot = `${booking.preferredDate || booking.bookingDate} at ${booking.preferredTime}`;
    const status = booking.bookingStatus || booking.status || "Pending Review";
    const purpose = booking.bookingPurpose || booking.purpose;
    const engineer = booking.assignedEngineer || booking.assignedTechnician || "GadgetZone Service Team";
    const notes = booking.adminNotes || booking.technicianNotes || "";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Booking Slip - ${booking.bookingId}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 28px; color: #111; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #8b5cf6; padding-bottom: 14px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; }
          .brand { font-size: 20px; font-weight: 900; }
          .brand span { color: #8b5cf6; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
          th, td { text-align: left; padding: 10px 12px; border: 1px solid #e2e8f0; font-size: 13px; }
          th { background: #f8fafc; font-weight: 600; width: 30%; }
          .notes { background: #f5f3ff; padding: 12px; border-radius: 8px; border-left: 4px solid #8b5cf6; margin-top: 14px; font-size: 12px; }
          .footer { margin-top: 30px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">GADGET<span>ZONE</span></div>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Tech Services & Hardware Repair Hub • support@gzones.in</div>
          </div>
          <div style="text-align: right;">
            <div class="title">SERVICE JOB SLIP</div>
            <div style="font-family: monospace; font-weight: 700; font-size: 14px; color: #7c3aed;">#${booking.bookingId}</div>
          </div>
        </div>

        <table>
          <tr><th>Service Requested</th><td><strong>${booking.serviceName}</strong></td></tr>
          <tr><th>Current Status</th><td><strong>${status}</strong></td></tr>
          <tr><th>Customer Name</th><td>${booking.customerName}</td></tr>
          <tr><th>Contact Phone</th><td>${phone}${altPhone}</td></tr>
          <tr><th>Service Address</th><td>${booking.address}</td></tr>
          <tr><th>Preferred Appointment</th><td><strong>${slot}</strong></td></tr>
          <tr><th>Service Price</th><td>${booking.servicePrice || "Quote on inspection"}</td></tr>
          <tr><th>Assigned Technician</th><td>${engineer}</td></tr>
          <tr><th>Reported Issue</th><td>${purpose}</td></tr>
          ${notes ? `<tr><th>Technician Remarks</th><td>${notes}</td></tr>` : ""}
          ${booking.rating ? `<tr><th>Customer Rating</th><td>⭐ ${booking.rating} / 5 Stars ${booking.reviewComment ? `("${booking.reviewComment}")` : ""}</td></tr>` : ""}
          <tr><th>Booking Date</th><td>${booking.createdAt ? new Date(booking.createdAt).toLocaleString("en-IN") : "Recent"}</td></tr>
        </table>

        <div class="notes">
          <strong>Customer Note:</strong> Our authorized hardware specialist will contact you on your registered phone number prior to dispatch. For queries, contact support@gzones.in.
        </div>

        <div class="footer">
          Gadget Zone • 100% Genuine Parts & Certified Technicians • https://gzones.in
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

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading your service bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <Wrench className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">No Service Bookings Yet</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm text-sm">
          You haven't requested any repair, installation, or tech maintenance appointments yet.
        </p>
        <Link to="/services">
          <Button size="lg" className="rounded-xl px-8 shadow-md">
            Explore Tech Services
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-foreground">
              Service History & Live Tracking
            </h1>
            <p className="text-muted-foreground font-medium text-sm">
              Track your technician appointments, live repair progress, and rate our services.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchBookings();
                toast.success("Service status refreshed.");
              }}
              className="gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </Button>
            <Link to="/services">
              <Button size="sm" className="gap-1.5 text-xs font-bold shadow-sm">
                <Wrench className="h-3.5 w-3.5" /> Book Another Service
              </Button>
            </Link>
          </div>
        </motion.div>

        <div className="space-y-8">
          {bookings.map((booking, idx) => {
            const rawStatus = booking.bookingStatus || booking.status || "Pending Review";
            const statusInfo = statusConfig[rawStatus] || statusConfig["Pending Review"];
            const StatusIcon = statusInfo.icon;
            const currentStep = statusInfo.step;
            const isCancelled = rawStatus === "Cancelled";

            const phone = booking.primaryPhone || booking.phone1 || "N/A";
            const altPhone = booking.alternatePhone || booking.phone2;
            const slotDate = booking.preferredDate || booking.bookingDate || "Flexible";
            const slotTime = booking.preferredTime || "Flexible";
            const statedPrice = booking.servicePrice
              ? booking.servicePrice.startsWith("₹")
                ? booking.servicePrice
                : `₹${booking.servicePrice}`
              : "Quote on Inspection";

            const ratingState = ratingInputs[booking.bookingId] || {
              stars: booking.rating || 0,
              hoverStars: booking.rating || 0,
              comment: booking.reviewComment || "",
              submitting: false,
            };

            return (
              <motion.div
                key={booking._id || booking.bookingId || idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-card rounded-2xl border border-border overflow-hidden shadow-md hover:shadow-lg transition-all"
              >
                <div className="p-6 md:p-8 space-y-6">
                  {/* Header Info */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-border">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Tracking / Booking Ref
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-sky-400">
                          #{booking.bookingId}
                        </span>
                        <button
                          onClick={() => handleCopyId(booking.bookingId)}
                          className="text-muted-foreground hover:text-foreground p-0.5"
                          title="Copy Booking ID"
                        >
                          {copiedId === booking.bookingId ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Service Requested
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {booking.serviceName}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 md:items-end">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Appointment Slot
                      </span>
                      <span className="text-sm font-bold text-emerald-400">
                        📅 {slotDate} ({slotTime})
                      </span>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusInfo.bg} border ${statusInfo.border}`}
                    >
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <span className={`text-sm font-bold ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Visual Live Service Tracking Progress Timeline */}
                  {!isCancelled && (
                    <div className="py-3 px-5 bg-secondary/40 rounded-2xl border border-border/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                        Live Service Tracking Progress
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
                        {serviceTrackingSteps.map((s) => {
                          const isDone = currentStep >= s.step;
                          const isCurrent = currentStep === s.step;
                          return (
                            <div key={s.step} className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                  isDone
                                    ? "bg-sky-500 text-white shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                                    : "bg-muted text-muted-foreground border border-border"
                                }`}
                              >
                                {isDone ? "✓" : s.step}
                              </div>
                              <div>
                                <p
                                  className={`text-xs font-bold ${
                                    isDone ? "text-foreground" : "text-muted-foreground"
                                  }`}
                                >
                                  {s.label}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {isDone ? (isCurrent ? "In Progress" : "Completed") : "Pending"}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Main Details Grid */}
                  <div className="grid md:grid-cols-2 gap-8 pt-2">
                    {/* Left Column: Problem, Contact, Address, Technician */}
                    <div className="space-y-4">
                      {/* Reported Issue */}
                      <div className="bg-muted/20 p-3.5 rounded-xl border border-border/40 text-xs space-y-1">
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                          Reported Issue / Purpose
                        </p>
                        <p className="text-foreground/90 leading-relaxed">
                          {booking.bookingPurpose || booking.purpose}
                        </p>
                      </div>

                      {/* Location & Contact */}
                      <div className="bg-muted/20 p-3.5 rounded-xl border border-border/40 text-xs space-y-1.5">
                        <p className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                          Service Location & Customer Contact
                        </p>
                        <p className="font-semibold text-foreground">
                          {booking.customerName} •{" "}
                          <span className="font-mono text-emerald-400">{phone}</span>
                          {altPhone && (
                            <span className="text-muted-foreground ml-1 font-mono">
                              (Alt: {altPhone})
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
                          <span>{booking.address}</span>
                        </p>
                      </div>

                      {/* Technician & Live Remarks */}
                      <div className="bg-purple-500/5 p-3.5 rounded-xl border border-purple-500/20 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5" /> Assigned Technician
                          </span>
                          <span className="text-purple-300 font-semibold">
                            {booking.assignedEngineer || booking.assignedTechnician || "Being Assigned"}
                          </span>
                        </div>
                        {(booking.adminNotes || booking.technicianNotes) ? (
                          <div className="pt-1.5 border-t border-purple-500/20">
                            <span className="text-[10px] text-muted-foreground block mb-0.5">
                              Live Progress Remarks:
                            </span>
                            <p className="text-sky-300 font-medium">
                              {booking.adminNotes || booking.technicianNotes}
                            </p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-muted-foreground italic">
                            Our technician will contact you on your registered phone number prior to arrival.
                          </p>
                        )}
                      </div>

                      {booking.cancellationReason && (
                        <div className="bg-rose-500/10 p-3 rounded-xl border border-rose-500/30 text-xs space-y-0.5">
                          <span className="font-bold text-rose-400 uppercase text-[10px] tracking-wider">
                            Cancellation Reason
                          </span>
                          <p className="text-rose-300">{booking.cancellationReason}</p>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Pricing, Slip Download, Cancel & Rating */}
                    <div className="flex flex-col justify-between space-y-6">
                      <div className="text-left md:text-right w-full">
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                          Service Fee / Stated Price
                        </p>
                        <p className="font-display text-3xl font-black text-sky-400">
                          {statedPrice}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Booking Date:{" "}
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 justify-start md:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrintSlip(booking)}
                          className="h-10 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                          title="Print service appointment slip"
                        >
                          <FileText className="h-4 w-4" /> Download Slip (PDF)
                        </Button>

                        {(rawStatus === "Pending Review" || rawStatus === "Pending") && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={cancellingId === booking.bookingId}
                            onClick={() => handleCancelBooking(booking)}
                            className="h-10 border-rose-500/30 text-rose-400 hover:bg-rose-500/10 font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                            title="Cancel service booking"
                          >
                            <XCircle className="h-4 w-4" /> Cancel Booking
                          </Button>
                        )}
                      </div>

                      {/* RATING & REVIEWS SECTION ("with rateing to our services") */}
                      <div className="bg-muted/20 p-4 rounded-xl border border-border/50 space-y-3">
                        {booking.rating ? (
                          /* Already rated state */
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 fill-amber-400" /> Your Rating
                              </span>
                              <span className="text-xs font-black text-amber-400">
                                {booking.rating} / 5 Stars
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((starVal) => (
                                <Star
                                  key={starVal}
                                  className={`h-4 w-4 ${
                                    starVal <= (booking.rating || 0)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/30"
                                  }`}
                                />
                              ))}
                            </div>
                            {booking.reviewComment && (
                              <p className="text-xs text-foreground/90 italic pt-1">
                                "{booking.reviewComment}"
                              </p>
                            )}
                            <span className="text-[10px] text-muted-foreground block pt-0.5">
                              Feedback recorded in system. Thank you!
                            </span>
                          </div>
                        ) : (
                          /* Interactive Rating Form */
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Star className="h-3.5 w-3.5 text-amber-400" /> Rate Our Service
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                {ratingState.hoverStars > 0
                                  ? `${ratingState.hoverStars} Star${ratingState.hoverStars > 1 ? "s" : ""}`
                                  : "Click stars to rate"}
                              </span>
                            </div>

                            {/* 5 Clickable Stars */}
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((starVal) => {
                                const active =
                                  starVal <= (ratingState.hoverStars || ratingState.stars);
                                return (
                                  <button
                                    key={starVal}
                                    type="button"
                                    onClick={() => handleSetStars(booking.bookingId, starVal)}
                                    onMouseEnter={() => handleHoverStars(booking.bookingId, starVal)}
                                    onMouseLeave={() =>
                                      handleHoverStars(booking.bookingId, ratingState.stars)
                                    }
                                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                                    title={`Rate ${starVal} Star${starVal > 1 ? "s" : ""}`}
                                  >
                                    <Star
                                      className={`h-5 w-5 ${
                                        active
                                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                                          : "text-muted-foreground/40 hover:text-amber-400"
                                      } transition-colors`}
                                    />
                                  </button>
                                );
                              })}
                            </div>

                            {/* Review Comment Box */}
                            <Textarea
                              value={ratingState.comment}
                              onChange={(e) =>
                                handleCommentChange(booking.bookingId, e.target.value)
                              }
                              placeholder="Share your feedback about the service & technician..."
                              rows={2}
                              className="text-xs"
                            />

                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                disabled={!ratingState.stars || ratingState.submitting}
                                onClick={() => handleSubmitRating(booking)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                              >
                                <Send className="h-3 w-3" />
                                {ratingState.submitting ? "Submitting..." : "Submit Rating"}
                              </Button>
                            </div>
                          </div>
                        )}
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

export default MyServices;
