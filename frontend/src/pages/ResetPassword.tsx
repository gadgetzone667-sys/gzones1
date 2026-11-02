import { useState, useMemo } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

function checkPasswordStrength(pass: string) {
  return {
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  };
}

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const criteria = useMemo(() => checkPasswordStrength(newPassword), [newPassword]);
  const score = Object.values(criteria).filter(Boolean).length;
  const isCriteriaMet = score === 5;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token || !email) {
      setError("Invalid password reset link. Please request a new one.");
      return;
    }

    if (!isCriteriaMet) {
      setError("Please ensure your password meets all complexity requirements.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPassword(email, token, newPassword);
      if (res.success) {
        setIsSuccess(true);
        toast.success(res.message);
        setTimeout(() => {
          navigate("/login");
        }, 2500);
      } else {
        setError(res.message);
        toast.error(res.message);
      }
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh w-full flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-black relative overflow-hidden">
      {/* Background Cyber Accents */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-sky-500/10 relative z-10"
      >
        <div className="text-center space-y-2 mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 mb-2 shadow-inner">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Set New Password
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {email ? (
              <>Resetting password for <span className="text-sky-400 font-semibold">{email}</span></>
            ) : (
              "Enter your new password below"
            )}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {isSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 animate-bounce">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-emerald-400">Password Reset Successfully!</h2>
            <p className="text-xs text-muted-foreground">Redirecting you to the sign-in page...</p>
            <Button
              onClick={() => navigate("/login")}
              className="mt-2 bg-sky-500 hover:bg-sky-600 text-white font-semibold"
            >
              Sign In Now <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: New Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Password criteria meter */}
              {newPassword.length > 0 && (
                <div className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2 text-xs mt-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold">
                    <span>Password Complexity</span>
                    <span className={isCriteriaMet ? "text-emerald-400 font-bold" : "text-amber-400"}>
                      {score}/5 Requirements
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <span className={`flex items-center gap-1 ${criteria.minLength ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <Check className={`h-3 w-3 ${criteria.minLength ? "opacity-100" : "opacity-30"}`} /> 8+ Characters
                    </span>
                    <span className={`flex items-center gap-1 ${criteria.hasUpper ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <Check className={`h-3 w-3 ${criteria.hasUpper ? "opacity-100" : "opacity-30"}`} /> Uppercase (A-Z)
                    </span>
                    <span className={`flex items-center gap-1 ${criteria.hasLower ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <Check className={`h-3 w-3 ${criteria.hasLower ? "opacity-100" : "opacity-30"}`} /> Lowercase (a-z)
                    </span>
                    <span className={`flex items-center gap-1 ${criteria.hasNumber ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <Check className={`h-3 w-3 ${criteria.hasNumber ? "opacity-100" : "opacity-30"}`} /> Number (0-9)
                    </span>
                    <span className={`col-span-2 flex items-center gap-1 ${criteria.hasSpecial ? "text-emerald-400" : "text-muted-foreground"}`}>
                      <Check className={`h-3 w-3 ${criteria.hasSpecial ? "opacity-100" : "opacity-30"}`} /> Special character (!@#$%^&*)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Field 2: Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                  <Lock className="h-4 w-4" />
                </div>
                <Input
                  type={showConfirm ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || !isCriteriaMet}
              className="w-full h-11 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-all mt-4"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Updating Password...</span>
                </div>
              ) : (
                "Update Password"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-sky-400 hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;

