import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStorefrontUrl } from "../lib/domain";
import { Button } from "./ui/button";
import {
  ShieldCheck,
  LogOut,
  ExternalLink,
  Globe,
  Radio,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const AdminNavbar = () => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const storefrontUrl = getStorefrontUrl();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-purple-500/20 bg-slate-950/80 backdrop-blur-xl supports-[backdrop-filter]:bg-slate-950/60 shadow-lg shadow-purple-950/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Console Identity */}
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-500/25 border border-purple-400/30">
              <ShieldCheck className="h-5 w-5 text-white" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-base sm:text-lg tracking-wider text-white">
                  GADGET<span className="text-purple-400">ZONE</span>
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  ADMIN
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5">
                admin.gzones.in
              </span>
            </div>
          </Link>

          {/* System status pill (Desktop) */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-medium ml-2">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Management Gateway Active</span>
          </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex items-center gap-3">
          {/* Main Storefront Link */}
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 transition-all shadow-sm"
          >
            <Globe className="h-3.5 w-3.5 text-sky-400" />
            <span>Open Public Store</span>
            <ExternalLink className="h-3 w-3 text-slate-400" />
          </a>

          {/* Admin User Info */}
          {user && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-xs">
                {user.email ? user.email.charAt(0).toUpperCase() : "A"}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-200 leading-tight max-w-[130px] truncate" title={user.email}>
                  {user.email}
                </span>
                <span className="text-[10px] text-purple-400 font-medium">
                  Verified Administrator
                </span>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <Button
              onClick={logout}
              variant="outline"
              size="sm"
              className="h-8 px-3 rounded-xl text-xs font-medium border-rose-500/30 text-rose-300 hover:text-rose-200 hover:bg-rose-500/15 hover:border-rose-500/50 transition-colors gap-1.5 ml-1"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </Button>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href={storefrontUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl text-slate-300 bg-slate-900 border border-slate-800"
            title="Open Storefront"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-purple-500/20 bg-slate-950/95 backdrop-blur-2xl px-4 py-4 space-y-3"
          >
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-purple-950/30 border border-purple-500/30">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold text-sm">
                  {user.email ? user.email.charAt(0).toUpperCase() : "A"}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-100">{user.email}</span>
                  <span className="text-[10px] text-purple-400 font-medium">
                    Management Gateway Session
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <a
                href={storefrontUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full p-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-900/80 border border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-sky-400" />
                  <span>Switch to Public Store (gzones.in)</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>

              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-2 w-full p-2.5 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out of Admin Console</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
