import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  AlertCircle,
  User,
  Lock,
  X,
  ShieldAlert,
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Check,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Helper to generate a random 5-character alphanumeric captcha
function generateCaptchaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

interface PasswordCriteria {
  minLength: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

function checkPasswordStrength(pass: string): PasswordCriteria {
  return {
    minLength: pass.length >= 8,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass),
  };
}

const Login = () => {
  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password Flow
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotResult, setForgotResult] = useState<{ sent: boolean; message: string } | null>(null);

  // Failed Attempts & Adaptive Captcha
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Password criteria evaluation
  const pwdCriteria = useMemo(() => checkPasswordStrength(password), [password]);
  const pwdScore = Object.values(pwdCriteria).filter(Boolean).length;

  const { login, register, loginWithGoogle, forgotPassword, skipLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId =
    (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
    "800198423020-790ive2m87u47achvrsocbcpctl10qnj.apps.googleusercontent.com";

  // Google Authentication Setup via Google Identity Services
  const renderGoogleButton = useCallback(() => {
    const google = (window as any).google;
    if (!google?.accounts?.id || !googleBtnRef.current) return;

    try {
      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setIsSubmitting(true);
            const ok = await loginWithGoogle(response.credential);
            setIsSubmitting(false);
            if (ok) {
              toast.success("Signed in with Google successfully!");
              navigate(redirectPath);
            } else {
              setError("Google authentication failed. Please try again.");
            }
          }
        },
      });

      googleBtnRef.current.innerHTML = "";
      google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_blue",
        size: "large",
        width: 320,
        shape: "pill",
        text: "continue_with",
      });
    } catch (e) {
      console.warn("Google button rendering notice:", e);
    }
  }, [googleClientId, loginWithGoogle, navigate, redirectPath]);

  useEffect(() => {
    if (!(window as any).google?.accounts?.id) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => renderGoogleButton();
      document.body.appendChild(script);
    } else {
      renderGoogleButton();
    }
  }, [renderGoogleButton, isRegistering, isForgotPassword]);

  // Captcha threshold
  useEffect(() => {
    if (failedAttempts >= 3 && !showCaptcha) {
      setShowCaptcha(true);
      setCaptchaCode(generateCaptchaCode());
      toast.warning("Multiple failed attempts detected. Security captcha verification is now required.");
    }
  }, [failedAttempts, showCaptcha]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (lockoutTimer > 0) {
      setError(`Temporary rate-limit lockout active. Please wait ${lockoutTimer}s.`);
      return;
    }

    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setError("Please provide your Email/Username and Password.");
      return;
    }

    if (showCaptcha) {
      if (!captchaInput.trim()) {
        setError("Please enter the security verification characters.");
        return;
      }
      if (captchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
        setError("Invalid security verification code. Please try again.");
        handleRefreshCaptcha();
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const isMixed = Object.values(pwdCriteria).every(Boolean);
        if (!isMixed) {
          setError(
            "Password must be a mixed combination: at least 8 characters, with uppercase, lowercase, numbers, and special characters."
          );
          setIsSubmitting(false);
          return;
        }

        const result = await register(cleanEmail, cleanPassword);
        if (result === true) {
          toast.success("Account created successfully. Welcome to GadgetZone!");
          navigate(redirectPath);
        } else {
          setError(typeof result === "string" ? result : "Registration failed.");
        }
      } else {
        const success = await login(cleanEmail, cleanPassword);

        if (success) {
          setFailedAttempts(0);
          setShowCaptcha(false);
          toast.success("Logged in successfully.");
          navigate(redirectPath);
        } else {
          const newCount = failedAttempts + 1;
          setFailedAttempts(newCount);

          if (newCount >= 5) {
            setLockoutTimer(30);
            setError("Too many failed attempts. Temporary 30-second security cooldown activated.");
          } else if (newCount >= 3) {
            setShowCaptcha(true);
            setCaptchaCode(generateCaptchaCode());
            setError(`Invalid credentials. Attempt ${newCount}/5. Security Captcha activated.`);
          } else {
            setError("Invalid email or password.");
          }
        }
      }
    } catch {
      setError("Authentication service temporarily unavailable. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const clean = forgotEmail.trim().toLowerCase();
    if (!clean) {
      setError("Please enter your registered email address.");
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await forgotPassword(clean);
      setForgotResult({ sent: res.success, message: res.message });
      if (res.success) {
        toast.success("Password reset instructions dispatched!");
      } else {
        setError(res.message);
      }
    } catch {
      setError("Failed to dispatch reset email. Please try again.");
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleCancel = () => {
    skipLogin();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen min-h-dvh w-full flex items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="w-full max-w-4xl bg-slate-900/95 backdrop-blur-xl border border-sky-500/30 rounded-3xl overflow-hidden shadow-2xl relative shadow-sky-500/10">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-20 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
          onClick={handleCancel}
          title="Close"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="w-full flex flex-col md:flex-row">
          {/* Left Side: Authentication Form */}
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center relative">
            <div className="max-w-md w-full mx-auto space-y-6">
              {/* FORGOT PASSWORD VIEW */}
              {isForgotPassword ? (
                <div className="space-y-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setForgotResult(null);
                      setError("");
                    }}
                    className="inline-flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Sign In
                  </button>

                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      Reset Password
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Enter your account email and we'll send you a secure link to reset your password.
                    </p>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 animate-shake">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex-1">{error}</div>
                    </div>
                  )}

                  {forgotResult?.sent ? (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <h3 className="text-sm font-bold text-emerald-400">Instructions Sent</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {forgotResult.message}
                      </p>
                      <Button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(false);
                          setForgotResult(null);
                        }}
                        className="w-full h-10 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white mt-2"
                      >
                        Return to Sign In
                      </Button>
                    </div>
                  ) : (
                    <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground">
                          Email Address
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                            <Mail className="h-4 w-4" />
                          </div>
                          <Input
                            type="email"
                            required
                            autoFocus
                            placeholder="your.email@example.com"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            className="pl-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm"
                          />
                        </div>
                      </div>

                      <Button
                        type="submit"
                        disabled={isForgotLoading}
                        className="w-full h-11 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-all gap-2"
                      >
                        {isForgotLoading ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Sending Reset Link...</span>
                          </div>
                        ) : (
                          <>
                            <span>Send Password Reset Link</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </div>
              ) : (
                /* STANDARD SIGN IN / REGISTER VIEW */
                <>
                  {/* Header */}
                  <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {isRegistering ? "Create Account" : "Sign In"}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {isRegistering
                        ? "Join our hardware community today"
                        : "Sign in to your account to continue"}
                    </p>
                  </div>

                  {/* Error Banner */}
                  {error && (
                    <div className="flex items-start gap-2.5 text-xs sm:text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3 animate-shake">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <div className="flex-1">{error}</div>
                    </div>
                  )}

                  {/* Rate-Limit Lockout Countdown Alert */}
                  {lockoutTimer > 0 && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      <span>Security protection: Cooling down for <strong>{lockoutTimer}s</strong>.</span>
                    </div>
                  )}

                  {/* Google Sign-In Quick Access */}
                  <div className="space-y-3">
                    <div ref={googleBtnRef} id="googleSignInContainer" className="flex justify-center w-full min-h-[44px]">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const google = (window as any).google;
                          if (google?.accounts?.id) {
                            renderGoogleButton();
                            google.accounts.id.prompt();
                          } else {
                            toast.info("Connecting to Google authentication...");
                          }
                        }}
                        className="w-full max-w-[320px] h-11 rounded-full border border-sky-500/30 bg-slate-800/80 hover:bg-slate-700/80 text-foreground text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.98]"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                        <span>Continue with Google</span>
                      </Button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-white/10" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
                        <span className="bg-slate-900 px-3 text-muted-foreground">
                          Or with credentials
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Field 1: Email or Username */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Email or Username
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                          <User className="h-4 w-4" />
                        </div>
                        <Input
                          type="text"
                          required
                          autoComplete="username"
                          placeholder="e.g. user@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm placeholder:text-muted-foreground/40"
                        />
                      </div>
                    </div>

                    {/* Field 2: Password */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-foreground">
                          Password
                        </label>
                        {!isRegistering && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setForgotEmail(email);
                              setError("");
                            }}
                            className="text-[11px] text-sky-400 hover:text-sky-300 hover:underline transition-colors"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete={isRegistering ? "new-password" : "current-password"}
                          placeholder="••••••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-10 pr-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm placeholder:text-muted-foreground/40"
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

                      {/* Mixed Combination Checklist */}
                      {(isRegistering || password.length > 0) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="p-3 rounded-xl bg-muted/40 border border-border/40 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-foreground">
                              Password Combination
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                pwdScore === 5
                                  ? "text-emerald-400"
                                  : pwdScore >= 3
                                  ? "text-amber-400"
                                  : "text-rose-400"
                              }`}
                            >
                              {pwdScore === 5
                                ? "Strong (Complete)"
                                : pwdScore >= 3
                                ? "Moderate"
                                : "Weak"}
                            </span>
                          </div>

                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden flex gap-1">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <div
                                key={lvl}
                                className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                  pwdScore >= lvl
                                    ? pwdScore === 5
                                      ? "bg-emerald-500"
                                      : pwdScore >= 3
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                    : "bg-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                            <div className={`flex items-center gap-1.5 ${pwdCriteria.minLength ? "text-emerald-400" : "text-muted-foreground"}`}>
                              <Check className={`h-3 w-3 ${pwdCriteria.minLength ? "opacity-100" : "opacity-30"}`} />
                              <span>Min 8 chars</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${pwdCriteria.hasUpper ? "text-emerald-400" : "text-muted-foreground"}`}>
                              <Check className={`h-3 w-3 ${pwdCriteria.hasUpper ? "opacity-100" : "opacity-30"}`} />
                              <span>Uppercase (A-Z)</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${pwdCriteria.hasLower ? "text-emerald-400" : "text-muted-foreground"}`}>
                              <Check className={`h-3 w-3 ${pwdCriteria.hasLower ? "opacity-100" : "opacity-30"}`} />
                              <span>Lowercase (a-z)</span>
                            </div>
                            <div className={`flex items-center gap-1.5 ${pwdCriteria.hasNumber ? "text-emerald-400" : "text-muted-foreground"}`}>
                              <Check className={`h-3 w-3 ${pwdCriteria.hasNumber ? "opacity-100" : "opacity-30"}`} />
                              <span>Number (0-9)</span>
                            </div>
                            <div className={`flex items-center gap-1.5 col-span-2 ${pwdCriteria.hasSpecial ? "text-emerald-400" : "text-muted-foreground"}`}>
                              <Check className={`h-3 w-3 ${pwdCriteria.hasSpecial ? "opacity-100" : "opacity-30"}`} />
                              <span>Special character (!@#$%^&*)</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Security Captcha Field */}
                    {showCaptcha && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-400 flex items-center gap-1.5">
                            <ShieldAlert className="h-4 w-4" /> Security Verification
                          </span>
                          <span className="text-[10px] text-muted-foreground">Bot Protection</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-11 bg-zinc-950 border border-amber-500/40 rounded-xl flex items-center justify-center select-none relative overflow-hidden">
                            <span className="font-mono text-lg font-black tracking-widest text-sky-400 transform -rotate-1">
                              {captchaCode}
                            </span>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={handleRefreshCaptcha}
                            className="h-11 w-11 rounded-lg border-zinc-700 hover:bg-zinc-800"
                            title="Regenerate captcha"
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>

                        <Input
                          type="text"
                          required
                          placeholder="Type characters above"
                          value={captchaInput}
                          onChange={(e) => setCaptchaInput(e.target.value)}
                          className="h-10 text-center font-mono tracking-widest text-sm bg-muted/40 border-amber-500/40 uppercase"
                          maxLength={5}
                        />
                      </motion.div>
                    )}

                    {/* Submit Actions */}
                    <div className="pt-2 flex flex-col gap-2.5">
                      <Button
                        type="submit"
                        disabled={isSubmitting || lockoutTimer > 0}
                        className="w-full h-11 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20 transition-all active:scale-[0.98] gap-2"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            <span>Verifying...</span>
                          </div>
                        ) : isRegistering ? (
                          <>
                            <span>Create Account</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        ) : (
                          <>
                            <span>Sign In</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full h-10 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground border-border/60 transition-all"
                        onClick={() => {
                          setIsRegistering(!isRegistering);
                          setError("");
                        }}
                      >
                        {isRegistering ? "Already registered? Login" : "Need an account? Register"}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>

          {/* Right Side: Showcase Graphic */}
          <div className="hidden md:flex flex-1 p-4 bg-background">
            <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 to-zinc-900 shadow-inner flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1000&auto=format&fit=crop"
                alt="Elite Gaming PC"
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90 transition-transform duration-1000 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>

              <div className="relative z-10 text-center p-8 text-white space-y-4 absolute bottom-12 w-full">
                <h2 className="text-3xl font-extrabold drop-shadow-lg tracking-tight">
                  Ultimate Hardware
                </h2>
                <p className="text-gray-300 font-medium">
                  Powering your next generation of gaming and creativity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
