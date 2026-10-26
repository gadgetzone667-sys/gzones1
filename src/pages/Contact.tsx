import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Clock, Send, Instagram, Youtube } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const WhatsappIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 2.15.68 4.14 1.838 5.776L2.5 21.5l3.864-1.309A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.068-1.116l-.292-.174-2.29.776.787-2.234-.19-.303A7.957 7.957 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
  </svg>
);

const Contact = () => {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || (!form.email.trim() && !form.phone.trim()) || !form.message.trim()) {
      toast.error("Please fill in your name, contact details (phone or email), and message.");
      return;
    }

    setIsSubmitting(true);

    // 1. Prepare formatted message for WhatsApp & Email
    const waText = `📩 *NEW INQUIRY FROM WEBSITE*\n\n👤 *Name:* ${form.name}\n📞 *Mobile:* ${form.phone || 'Not provided'}\n✉️ *Email:* ${form.email || 'Not provided'}\n📌 *Subject:* ${form.subject || 'General Inquiry'}\n\n💬 *Message:*\n${form.message}`;
    const emailBody = `New Website Inquiry:\n\nName: ${form.name}\nPhone: ${form.phone || 'Not provided'}\nEmail: ${form.email || 'Not provided'}\nSubject: ${form.subject || 'General Inquiry'}\n\nMessage:\n${form.message}`;

    // Seller Mobile: +91 9345600128
    const waUrl = `https://wa.me/919345600128?text=${encodeURIComponent(waText)}`;
    // Seller Email: gadgetzone667@gmail.com
    const mailtoUrl = `mailto:gadgetzone667@gmail.com?subject=${encodeURIComponent("New Inquiry: " + (form.subject || "General Inquiry"))}&body=${encodeURIComponent(emailBody)}`;

    try {
      // Send to backend API
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch (err) {
      console.warn("Contact form backend sync notice:", err);
    }

    // Open WhatsApp prefilled to seller mobile number
    window.open(waUrl, "_blank");

    // Trigger mailto link for seller email
    setTimeout(() => {
      window.location.href = mailtoUrl;
    }, 500);

    toast.success("Message sent! Notification dispatched to seller mobile (+91 9345600128) & email (gadgetzone667@gmail.com).", {
      duration: 5000,
    });

    setIsSubmitting(false);
    setForm({ name: "", phone: "", email: "", subject: "", message: "" });
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Have a question or need a quote? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-10">
          {/* Info */}
          <div className="lg:col-span-2 space-y-6">
            {[
              { icon: Phone, label: "Phone", value: "+91 9345600128" },
              { icon: Mail, label: "Email", value: "gadgetzone667@gmail.com" },
              { icon: MapPin, label: "Address", value: "No.5, 1st Street, Jayaram Nagar, Nerkundram, Chennai - 600107" },
              { icon: Clock, label: "Hours", value: "Mon–Fri: 9AM–7PM\nSat: 10AM–5PM" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold text-sm">{item.label}</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{item.value}</p>
                </div>
              </motion.div>
            ))}

            {/* Social Media Channels */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4 border-t border-border"
            >
              <p className="font-display font-semibold text-sm mb-3">Connect With Us</p>
              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://wa.me/919345600128"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all text-xs font-semibold"
                >
                  <WhatsappIcon className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href="https://www.instagram.com/gadgetzone223?utm_source=qr&igsh=aDRkaGVjdXkwbzI1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-500 hover:bg-pink-500 hover:text-white transition-all text-xs font-semibold"
                >
                  <Instagram className="h-4 w-4" /> Instagram
                </a>
                <a
                  href="https://youtube.com/@vjtechvlogs23?si=QNZ0vegdtb0vjTA4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-semibold"
                >
                  <Youtube className="h-4 w-4" /> YouTube
                </a>
              </div>
            </motion.div>
          </div>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-3 bg-card rounded-xl border border-border p-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                  placeholder="e.g., PC Repair / Custom Build Inquiry"
                />
              </div>
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1.5">Message / Details *</label>
              <textarea
                required
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={5}
                className="w-full px-4 py-2.5 rounded-lg bg-secondary text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none"
                placeholder="Tell us what you need in detail..."
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {isSubmitting ? "Sending..." : "Send Message to Seller"}
            </button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
