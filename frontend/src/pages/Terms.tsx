import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  ShieldCheck,
  RotateCcw,
  IndianRupee,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { Button } from "../components/ui/button";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background Accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/10 via-orange-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation Breadcrumb / Back button */}
        <div className="flex items-center gap-2 mb-6">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Store</span>
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-xs font-semibold text-sky-400">Terms & Conditions</span>
        </div>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold uppercase tracking-wider mb-4">
            <FileText className="h-3.5 w-3.5" />
            <span>Legal Documentation & User Agreement</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            Terms & <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-orange-400">Conditions</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
            Please read these terms and conditions carefully before using our website or purchasing gaming hardware, custom PCs, and components from GADGET ZONE.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
            <span>Effective Date: November 1, 2026</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Fully Compliant with Indian GST & E-Commerce Laws
            </span>
          </div>
        </motion.div>

        {/* Summary Quick Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10">
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">18% GST Included</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">All prices are inclusive of GST with official Tax Invoices issued.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">7-Day Replacement</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Defective or transit-damaged parts are eligible for 100% replacement.</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex items-start gap-3">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Brand Warranty</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">Genuine hardware backed by official Indian manufacturer warranties.</p>
            </div>
          </div>
        </div>

        {/* Main Content Sections */}
        <div className="space-y-6">
          {/* Section 1 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">1</span>
              <span>Overview & Agreement</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                Welcome to <strong className="text-foreground">GADGET ZONE</strong> ("GadgetZone", "we", "us", or "our"), operating out of Chennai, Tamil Nadu, India. By accessing, browsing, creating an account, or purchasing from our platform at <strong className="text-foreground">https://gzones.in</strong>, you acknowledge and agree to adhere to these Terms & Conditions.
              </p>
              <p>
                If you do not agree to all terms and conditions set forth herein, you may not access the website or utilize our services.
              </p>
            </div>
          </motion.div>

          {/* Section 2 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">2</span>
              <span>Genuine Hardware & Pricing Policy</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                All products listed on GadgetZone—including graphics cards (GPUs), processors (CPUs), motherboards, RAM, storage, power supplies, monitors, and audio peripherals—are guaranteed to be 100% brand new, original, and sourced through authorized national distributors.
              </p>
              <p>
                Prices shown on our product catalog are inclusive of all statutory taxes including <strong className="text-foreground">18% Goods & Services Tax (GST)</strong>. We reserve the right to revise catalog prices based on international component market fluctuations without prior notice, provided that already placed orders will always be honored at the confirmed checkout price.
              </p>
            </div>
          </motion.div>

          {/* Section 3 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">3</span>
              <span>GST Tax Invoicing & Calculations</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                As a registered commercial entity operating from Tamil Nadu (State Code: 33), GadgetZone generates an official computer-verified <strong className="text-foreground">GST Tax Invoice</strong> for every order placed.
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>
                  <strong className="text-foreground">Intra-State Deliveries (Tamil Nadu):</strong> Invoices detail Central GST (CGST @ 9%) and State GST (SGST @ 9%).
                </li>
                <li>
                  <strong className="text-foreground">Inter-State Deliveries (Other Indian States):</strong> Invoices detail Integrated GST (IGST @ 18%).
                </li>
                <li>
                  <strong className="text-foreground">Taxable Base Calculation:</strong> The taxable component is calculated via statutory reverse calculation: <code className="text-sky-300 font-mono">Taxable Base = Total Price ÷ 1.18</code>.
                </li>
                <li>
                  Customers can instantly download their complete GST Invoice PDF right from the order confirmation screen and from their account orders page.
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Section 4 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">4</span>
              <span>Orders, Payment & Cash on Delivery (COD)</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                We offer multiple secure payment options, including online transactions and Cash on Delivery (COD).
              </p>
              <p>
                When selecting Cash on Delivery, the customer undertakes to be available at the designated delivery address to inspect package seal integrity and tender full payment to the courier personnel. Repetitive refusal of authentic orders may result in account termination.
              </p>
            </div>
          </motion.div>

          {/* Section 5 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">5</span>
              <span>Shipping, Delivery & Tracking</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                Orders are packed with anti-static and shock-absorbent cushioning and dispatched through SpeedPost Express and certified domestic courier partners.
              </p>
              <p>
                Standard delivery transit across India is estimated between <strong className="text-foreground">3 to 5 business days</strong>. A live tracking code (<code className="text-sky-300 font-mono">TRK-GZ-...</code>) is assigned upon order placement and can be tracked in real-time on our Orders portal.
              </p>
            </div>
          </motion.div>

          {/* Section 6 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">6</span>
              <span>7-Day Replacement & Manufacturer Warranty</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                <strong className="text-foreground">7-Day Replacement:</strong> In the unlikely event that an item arrives Dead-on-Arrival (DOA), defective, or damaged in transit, customers are entitled to a replacement if notified within 7 days of package delivery.
              </p>
              <p>
                <strong className="text-foreground">Official Manufacturer Warranty:</strong> After 7 days, products are covered under their respective manufacturer warranty terms (ranging from 1 to 5 years depending on the brand, e.g. NVIDIA, Intel, AMD, Corsair, Gigabyte). Customers can service products at any authorized brand service center across India using their GadgetZone tax invoice.
              </p>
              <p>
                Physical damage, burn marks caused by electrical surges, liquid spillage, or unauthorized tampering void all replacement and warranty claims.
              </p>
            </div>
          </motion.div>

          {/* Section 7 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">7</span>
              <span>PC Builder & Custom Assembly Services</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                Custom PC configurations built through our interactive <Link to="/build-pc" className="text-sky-400 underline hover:text-sky-300">PC Builder tool</Link> are assembled by senior certified technicians. Each rig undergoes BIOS calibration, thermal stress testing, and driver installation prior to packaging.
              </p>
            </div>
          </motion.div>

          {/* Section 8 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">8</span>
              <span>Account Security & Data Protection</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                We deploy industry-standard cybersecurity measures:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-muted-foreground">
                <li>Zero plain-text password storage; all passwords are cryptographically hashed using salted bcrypt.</li>
                <li>One-click Google OAuth authentication verified through official Google Identity Services.</li>
                <li>Cryptographic JSON Web Tokens (JWT) for secure authentication.</li>
                <li>Customer shipping addresses and contact details are used strictly for order fulfillment and are never sold or rented.</li>
              </ul>
            </div>
          </motion.div>

          {/* Section 9 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.45 }}
            className="p-6 rounded-2xl bg-card/60 backdrop-blur border border-border/80 shadow-md"
          >
            <h2 className="text-lg font-bold text-sky-400 flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 text-xs">9</span>
              <span>Governing Law & Jurisdiction</span>
            </h2>
            <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed space-y-2.5">
              <p>
                These Terms and Conditions shall be governed by, and interpreted in accordance with, the laws of the Republic of India. Any dispute or proceeding arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts in <strong className="text-foreground">Chennai, Tamil Nadu, India</strong>.
              </p>
            </div>
          </motion.div>

          {/* Section 10: Store Contact & Grievance */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="p-6 rounded-2xl bg-gradient-to-br from-card to-sky-950/20 border border-sky-500/30 shadow-lg"
          >
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-orange-500/10 text-orange-400 text-xs">10</span>
              <span>Store Contact & Grievance Redressal</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              If you have any questions or require support regarding these terms, orders, or tax invoices, please contact our team:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <MapPin className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">Store Location:</strong>
                  <span className="text-muted-foreground">No.5, 1st Street, Jayaram Nagar, Nerkundram, Chennai - 600107, Tamil Nadu, India</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <Phone className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">Helpline & WhatsApp:</strong>
                  <a href="tel:+919345600128" className="text-sky-400 hover:underline">+91 9345600128</a>
                  <span className="text-muted-foreground block text-[11px]">Mon–Sat: 9:00 AM – 7:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <Mail className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">Support Email:</strong>
                  <a href="mailto:gadgetzone667@gmail.com" className="text-sky-400 hover:underline">gadgetzone667@gmail.com</a>
                  <span className="text-muted-foreground block text-[11px]">support@gzones.in</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border">
                <Clock className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-foreground block">Official Website:</strong>
                  <span className="text-sky-400 font-mono">https://gzones.in</span>
                  <span className="text-muted-foreground block text-[11px]">GSTIN: 33AAACG1234F1Z5</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
              <Link to="/products">
                <Button className="h-10 px-5 font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white gap-2 shadow-md">
                  <span>Browse Products Catalog</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" className="h-10 px-5 font-bold rounded-xl border-border">
                  <span>Contact Customer Support</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
