import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isAdminSubdomain } from "../lib/domain";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import SEOHead from "../components/SEOHead";
import gadgetZoneLogo from "../assets/Gadgetzone.png";
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Store,
  KeyRound,
  ArrowLeft,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 2FA State
  const [is2FARequired, setIs2FARequired] = useState(false);
  const [temp2FAToken, setTemp2FAToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const { login, verify2FALogin, logout, user } = useAuth();
  const navigate = useNavigate();
  const onAdminSubdomain = isAdminSubdomain();

  // If already logged in as admin, redirect to dashboard (/ on subdomain, /admin on main domain)
  if (user?.isAdmin) {
    navigate(onAdminSubdomain ? "/" : "/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please provide administrator credentials.");
      return;
    }

    setIsSubmitting(true);

    try {
      const loginResult = await login(cleanEmail, cleanPassword);

      if (typeof loginResult === "object" && loginResult.twoFactorRequired) {
        setIs2FARequired(true);
        setTemp2FAToken(loginResult.tempToken);
        setTwoFactorCode("");
        setIsSubmitting(false);
        return;
      }

      if (loginResult === true) {
        // Verify directly against backend server to confirm administrative permissions
        const activeToken = localStorage.getItem("GadgetZone_token");
        const verifyRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        const verifyData = await verifyRes.json().catch(() => null);

        if (verifyData?.user?.isAdmin) {
          toast.success("Administrator access verified. Welcome to Management Console.");
          navigate(onAdminSubdomain ? "/" : "/admin");
        } else {
          // Logged in as normal customer on admin portal -> revoke session
          logout();
          setError("Access Denied: This account does not have administrative permissions.");
          toast.error("Unauthorized: Administrative rights required.");
        }
      } else {
        setError("Invalid administrator username or password.");
      }
    } catch {
      setError("Authentication service unavailable. Please check backend status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const code = twoFactorCode.trim();
    if (!code) {
      setError("Please enter the 6-digit code or backup code.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await verify2FALogin(temp2FAToken, code);

      if (result.success) {
        const activeToken = localStorage.getItem("GadgetZone_token");
        const verifyRes = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${activeToken}` },
        });
        const verifyData = await verifyRes.json().catch(() => null);

        if (verifyData?.user?.isAdmin) {
          toast.success("Two-Factor Authentication verified. Welcome to Management Console.");
          navigate(onAdminSubdomain ? "/" : "/admin");
        } else {
          logout();
          setError("Access Denied: This account does not have administrative permissions.");
        }
      } else {
        setError(result.message || "Invalid two-factor authentication code. Please try again.");
      }
    } catch {
      setError("Authentication service unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-black relative overflow-hidden">
      <SEOHead
        title="Admin Portal Login | GadgetZone Security Gateway"
        description="Restricted administrative gateway for GadgetZone management."
        canonical="/admin"
        noIndex={true}
      />

      {/* Background Cyber Accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-500/10 relative z-10"
      >
        {/* Header Badge */}
        <div className="text-center space-y-2 mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img
              src={gadgetZoneLogo}
              alt="GADGET ZONE Logo"
              className="h-9 w-9 object-contain drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]"
            />
            <span className="font-display text-xl font-black tracking-wider uppercase flex items-center gap-1">
              <span className="text-sky-400">GADGET</span>
              <span className="text-orange-500">ZONE</span>
            </span>
          </div>
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mb-1 shadow-inner">
            {is2FARequired ? <Smartphone className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
          </div>
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="inline-block px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/40 text-purple-300 text-[10px] font-black uppercase tracking-widest">
              MANAGEMENT CONSOLE
            </span>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-mono">
              {is2FARequired ? "2FA VERIFICATION" : "SECURE ACCESS"}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground font-display">
            {is2FARequired ? "Two-Factor Verification" : "Admin Authentication"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {is2FARequired
              ? "Enter the 6-digit code from Google Authenticator or an 8-character backup code."
              : "Restricted administrative gateway. Direct URL access only."}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* 2FA Form vs Password Form */}
        {is2FARequired ? (
          <form onSubmit={handle2FASubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Google Authenticator OTP / Backup Code</span>
                <span className="text-[11px] text-muted-foreground">6 Digits</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                </div>
                <Input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. 123456 or a1b2c3d4"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  maxLength={16}
                  className="pl-10 h-11 bg-slate-950/60 border-slate-700/80 rounded-xl text-center text-lg font-mono tracking-widest placeholder:text-muted-foreground/40 placeholder:text-sm focus-visible:ring-1 focus-visible:ring-purple-400"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] gap-2 mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Verifying Code...</span>
                </div>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Authenticate & Enter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIs2FARequired(false);
                setTwoFactorCode("");
                setError("");
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 pt-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to username & password
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <User className="h-4 w-4" />
                </div>
                <Input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="admin@gzones.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-slate-950/60 border-slate-700/80 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-purple-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-slate-950/60 border-slate-700/80 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-purple-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/25 transition-all active:scale-[0.98] gap-2 mt-2"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Authorizing...</span>
                </div>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  <span>Verify Admin Access</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        {/* Back to Public Store */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-sky-400 transition-colors"
          >
            <Store className="h-3.5 w-3.5 text-sky-400" />
            <span>Return to Public Storefront</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
