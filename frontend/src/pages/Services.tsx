import { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
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
  const { user } = useAuth();

  // Booking Modal State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);

    // 1. Format WhatsApp booking message for Seller Mobile (+91 9345600128)
    const waText = `🛠️ *NEW SERVICE BOOKING REQUEST*\n\n🔧 *Service:* ${selectedService?.name || 'General Tech Service'}\n💰 *Price:* ${selectedService?.price || 'Quote'}\n👤 *Customer Name:* ${formData.name}\n📞 *Primary Phone:* ${formData.phone1}\n📞 *Alt Phone:* ${formData.phone2 || 'None'}\n📍 *Address:* ${formData.address}\n📅 *Preferred Date:* ${formData.date}\n⏰ *Preferred Time:* ${formData.time}\n\n📝 *Details / Issue:* ${formData.purpose}`;

    // 2. Format Email body for Seller Email (gadgetzone667@gmail.com)
    const emailBody = `New Service Booking Request:\n\nService: ${selectedService?.name || 'General Tech Service'}\nPrice: ${selectedService?.price || 'Quote'}\nCustomer Name: ${formData.name}\nPrimary Phone: ${formData.phone1}\nAlt Phone: ${formData.phone2 || 'None'}\nAddress: ${formData.address}\nPreferred Date: ${formData.date}\nPreferred Time: ${formData.time}\n\nIssue Details:\n${formData.purpose}`;

    const waUrl = `https://wa.me/919345600128?text=${encodeURIComponent(waText)}`;
    const mailtoUrl = `mailto:gadgetzone667@gmail.com?subject=${encodeURIComponent("Service Booking: " + (selectedService?.name || "Tech Support"))}&body=${encodeURIComponent(emailBody)}`;

    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone1,
          email: user?.email || "Not logged in",
          subject: `Service Booking: ${selectedService?.name}`,
          message: `Date: ${formData.date} | Time: ${formData.time} | Address: ${formData.address} | Notes: ${formData.purpose}`,
        }),
      });
    } catch (err) {
      console.warn("Service booking API notice:", err);
    }

    // Open WhatsApp to seller mobile
    window.open(waUrl, "_blank");

    // Open Email to seller email
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 500);

    setIsSubmitting(false);
    setIsModalOpen(false);
    toast.success(`Booking dispatched to seller mobile (+91 9345600128) & email (gadgetzone667@gmail.com)!`, {
      description: `Service: ${selectedService?.name} for ${formData.date} at ${formData.time}`,
      duration: 5000,
    });

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
    </div>
  );
};

export default Services;
