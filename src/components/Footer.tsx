import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Clock, Instagram, Youtube } from "lucide-react";
import gadgetZoneLogo from "../assets/Gadgetzone.png";

const WhatsappIcon = ({ className = "h-3.5 w-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 2C6.477 2 2 6.477 2 12c0 2.15.68 4.14 1.838 5.776L2.5 21.5l3.864-1.309A9.956 9.956 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.068-1.116l-.292-.174-2.29.776.787-2.234-.19-.303A7.957 7.957 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8z"/>
  </svg>
);

const Footer = () => (
  <footer className="bg-zinc-950/95 text-zinc-200 border-t border-zinc-800/80 shadow-lg relative z-10">
    <div className="container mx-auto px-4 py-4 sm:py-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6 mb-3.5">
        {/* Brand & Social */}
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <img
              src={gadgetZoneLogo}
              alt="GADGET ZONE Logo"
              className="h-6 w-6 object-contain brightness-110 transition-transform duration-200 group-hover:scale-110"
            />
            <span className="font-display text-sm font-black tracking-wider uppercase flex items-center gap-1">
              <span className="text-sky-400">GADGET</span>
              <span className="text-orange-500">ZONE</span>
            </span>
          </Link>
          <p className="text-[11px] text-zinc-400 leading-normal max-w-xs">
            Custom gaming PCs, genuine hardware & expert technical repairs in Chennai.
          </p>
          <div className="flex items-center gap-1.5 pt-0.5">
            <a
              href="https://wa.me/919345600128"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
              title="WhatsApp"
            >
              <WhatsappIcon className="h-3 w-3" />
            </a>
            <a
              href="https://www.instagram.com/gadgetzone223?utm_source=qr&igsh=aDRkaGVjdXkwbzI1"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded bg-pink-500/10 border border-pink-500/30 text-pink-400 flex items-center justify-center hover:bg-pink-500 hover:text-white transition-colors"
              title="Instagram"
            >
              <Instagram className="h-3 w-3" />
            </a>
            <a
              href="https://youtube.com/@vjtechvlogs23?si=QNZ0vegdtb0vjTA4"
              target="_blank"
              rel="noopener noreferrer"
              className="w-6 h-6 rounded bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
              title="YouTube"
            >
              <Youtube className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Tab 1: Shop */}
        <div>
          <h4 className="font-display font-semibold text-[11px] uppercase tracking-wider text-zinc-200 mb-2">
            Shop
          </h4>
          <ul className="space-y-1 text-[11px] text-zinc-400">
            <li>
              <Link to="/products" className="hover:text-sky-300 transition-colors">Products Catalog</Link>
            </li>
            <li>
              <Link to="/build-pc" className="hover:text-sky-300 transition-colors">PC Builder</Link>
            </li>
            <li>
              <Link to="/services" className="hover:text-sky-300 transition-colors">Services & Repairs</Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-sky-300 transition-colors">Contact Support</Link>
            </li>
          </ul>
        </div>

        {/* Tab 2: Account */}
        <div>
          <h4 className="font-display font-semibold text-[11px] uppercase tracking-wider text-zinc-200 mb-2">
            Account
          </h4>
          <ul className="space-y-1 text-[11px] text-zinc-400">
            <li>
              <Link to="/orders" className="hover:text-sky-300 transition-colors">My Orders</Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-sky-300 transition-colors">Shopping Cart</Link>
            </li>
            <li>
              <Link to="/wishlist" className="hover:text-sky-300 transition-colors">Saved Wishlist</Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-sky-300 transition-colors">Sign In / Register</Link>
            </li>
          </ul>
        </div>

        {/* Tab 3: Contact */}
        <div>
          <h4 className="font-display font-semibold text-[11px] uppercase tracking-wider text-zinc-200 mb-2">
            Contact
          </h4>
          <div className="space-y-1 text-[11px] text-zinc-400">
            <a href="tel:+919345600128" className="flex items-center gap-1.5 hover:text-sky-300 transition-colors">
              <Phone className="h-3 w-3 text-sky-400 shrink-0" />
              <span>+91 9345600128</span>
            </a>
            <a href="mailto:gadgetzone667@gmail.com" className="flex items-center gap-1.5 hover:text-sky-300 transition-colors">
              <Mail className="h-3 w-3 text-sky-400 shrink-0" />
              <span className="truncate">gadgetzone667@gmail.com</span>
            </a>
            <a
              href="https://maps.google.com/?q=No.5,+1st+Street,+Jayaram+Nagar,+Nerkundram,+Chennai+-+600107"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-sky-300 transition-colors"
            >
              <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
              <span className="truncate">Nerkundram, Chennai - 600107</span>
            </a>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Clock className="h-3 w-3 text-sky-400 shrink-0" />
              <span>Mon–Sat: 9AM–7PM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Minimal Bottom Bar */}
      <div className="border-t border-zinc-800/60 pt-2.5 text-center text-[10px] text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-1">
        <p>© 2026 GADGET ZONE. All rights reserved.</p>
        <p className="text-zinc-400">Crafted for gamers & PC enthusiasts</p>
      </div>
    </div>
  </footer>
);

export default Footer;
