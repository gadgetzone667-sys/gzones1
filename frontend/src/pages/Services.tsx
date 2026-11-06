import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
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
  CheckCircle,
  Loader2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  User as UserIcon,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import SEOHead from "../components/SEOHead";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  icon: string;
  features: string[];
}

const iconMap: Record<string, React.FC<{ className?: string }>> = {
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

function getServiceIcon(iconName: string): React.FC<{ className?: string }> {
  if (!iconName) return Wrench;
  const match = Object.keys(iconMap).find(
    (k) => k.toLowerCase() === iconName.trim().toLowerCase()
  );
  return match ? iconMap[match] : Wrench;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // Booking Modal State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    phone1: "",
    phone2: "",
    address: "",
    purpose: "",
    date: "",
    time: "",
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("/api/services");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        if (Array.isArray(data)) {
          setServices(data);
        } else {
          setServices([]);
        }
      } catch (err) {
        console.warn("Services: Backend service offline", err);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  // Pre-fill name when user changes or modal opens
  useEffect(() => {
    if (isModalOpen && user) {
      setFormData(prev => ({ ...prev, name: user.email.split('@')[0] }));
    }
  }, [isModalOpen, user]);

  const handleBookNow = (service: Service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.phone1 || !formData.address || !formData.purpose || !formData.date || !formData.time) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const cleanPhone = formData.phone1.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit primary phone number.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/services/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          customerName: formData.name,
          name: formData.name,
          primaryPhone: formData.phone1,
          phone1: formData.phone1,
          alternatePhone: formData.phone2,
          phone2: formData.phone2,
          address: formData.address,
          bookingPurpose: formData.purpose,
          purpose: formData.purpose,
          preferredDate: formData.date,
          bookingDate: formData.date,
          preferredTime: formData.time,
          serviceId: selectedService?.id,
          serviceName: selectedService?.name,
          email: user?.email || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to submit service booking.");
      }

      // Cache locally for guest tracking
      try {
        const raw = localStorage.getItem("GadgetZone_service_bookings");
        const existing = raw ? JSON.parse(raw) : [];
        const updated = [data.booking, ...existing.filter((b: any) => b.bookingId !== data.booking.bookingId)];
        localStorage.setItem("GadgetZone_service_bookings", JSON.stringify(updated));
      } catch (e) {
        console.warn("Local storage cache warning:", e);
      }

      setConfirmedBooking(data.booking);
      setIsModalOpen(false);
      toast.success("Thanks for booking our service! Our technician will call or contact you shortly.");

      // Reset form
      setFormData({
        name: user?.email.split('@')[0] || "",
        phone1: "",
        phone2: "",
        address: "",
        purpose: "",
        date: "",
        time: "",
      });
    } catch (err: any) {
      toast.error(err.message || "Could not place service booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading services...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <SEOHead
        title="Computer Repair & IT Technical Services | GadgetZone"
        description="Book professional laptop repairs, chip-level motherboard service, CCTV installation, network setup, and data recovery across India."
        canonical="/services"
      />
      <div className="container mx-auto px-4">
        <motion.div {...fadeUp} className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Our Services</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Expert tech services from certified professionals. Fast turnaround, guaranteed quality.
          </p>
        </motion.div>

        {services.length === 0 ? (
          <div className="text-center py-16 bg-card/50 rounded-2xl border border-border max-w-md mx-auto p-8">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-bold mb-2">No Services Listed Yet</h3>
            <p className="text-sm text-muted-foreground">
              Our hardware and repair services will be added shortly. You can also reach us via the Contact page.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 max-w-6xl mx-auto items-stretch">
            {services.map((s, i) => {
              const Icon = getServiceIcon(s.icon);
              const features = Array.isArray(s.features) ? s.features.filter(Boolean) : [];
              const description = s.description || "";

              return (
                <motion.div
                  key={s.id || s.name}
                  {...fadeUp}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-2xl border border-border p-6 sm:p-7 card-hover flex flex-col h-full justify-between shadow-lg shadow-black/20 hover:border-primary/50 transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Top Subtle Gradient Accent */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Main Content Area */}
                  <div className="flex flex-col flex-1">
                    {/* SECTION A: Service Header */}
                    <div className="mb-4">
                      <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-inner mb-4 group-hover:scale-105 group-hover:bg-primary/25 transition-all duration-300">
                        <Icon className="h-7 w-7 text-primary stroke-[2.2]" />
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                        {s.name}
                      </h3>
                    </div>

                    {/* SECTION B: Service Description */}
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {description}
                      </p>
                    </div>

                    {/* SECTION C: Service Features */}
                    <div className="mb-6 flex-1">
                      <ul className="space-y-2.5">
                        {features.map((feature, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 font-medium">
                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* SECTION D: Price and Booking */}
                  <div className="pt-5 border-t border-border flex items-center justify-between gap-3 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Starting From
                      </span>
                      <span className="font-display font-extrabold text-lg sm:text-xl text-primary tracking-tight">
                        {s.price}
                      </span>
                    </div>
                    <button
                      onClick={() => handleBookNow(s)}
                      className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:opacity-90 hover:shadow-lg hover:shadow-primary/25 active:scale-95 transition-all cursor-pointer"
                    >
                      Book Now
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Book {selectedService?.name}</DialogTitle>
            <DialogDescription>
              Please enter your details to request a service booking. Our team will contact you to confirm.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                   <UserIcon className="h-4 w-4 text-primary" /> Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone1" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" /> Phone No 1
                  </Label>
                  <Input
                    id="phone1"
                    name="phone1"
                    type="tel"
                    value={formData.phone1}
                    onChange={handleInputChange}
                    placeholder="+1 234 567 890"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone2" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" /> Phone No 2
                  </Label>
                  <Input
                    id="phone2"
                    name="phone2"
                    type="tel"
                    value={formData.phone2}
                    onChange={handleInputChange}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="123 Tech Street, Silicon Valley"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" /> Booking Purpose
                </Label>
                <Textarea
                  id="purpose"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleInputChange}
                  placeholder="Briefly describe the issue or service needed..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Date
                  </Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time" className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Time
                  </Label>
                  <Input
                    id="time"
                    name="time"
                    type="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Success Dialog */}
      <Dialog open={!!confirmedBooking} onOpenChange={(open) => !open && setConfirmedBooking(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader className="text-center sm:text-center pb-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto mb-3 shadow-inner">
              <CheckCircle className="h-9 w-9 stroke-[2.2]" />
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold font-display text-foreground">
              Thanks for booking our service!
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm font-semibold text-emerald-400 mt-1">
              Our technician will call or contact you shortly.
            </DialogDescription>
          </DialogHeader>

          {confirmedBooking && (
            <div className="space-y-3.5 my-2">
              <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground font-medium">Booking ID</span>
                  <span className="font-mono font-bold text-sky-400 text-sm">#{confirmedBooking.bookingId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Service</span>
                  <span className="font-semibold text-foreground">{confirmedBooking.serviceName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Appointment Slot</span>
                  <span className="font-semibold text-foreground">
                    📅 {confirmedBooking.bookingDate || confirmedBooking.preferredDate} at {confirmedBooking.preferredTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Contact Phone</span>
                  <span className="font-mono text-foreground font-semibold">
                    {confirmedBooking.phone1 || confirmedBooking.primaryPhone}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Booking Status</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    Pending Review
                  </span>
                </div>
              </div>

              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
                <p className="text-xs text-purple-300 font-medium leading-relaxed">
                  📞 Our assigned service engineer has received your appointment details and will contact you directly to confirm hardware diagnostics & timing.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmedBooking(null)}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              type="button"
              onClick={() => {
                setConfirmedBooking(null);
                navigate("/my-services");
              }}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs gap-1.5 shadow-md"
            >
              <span>Track in My Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
