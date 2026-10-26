import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Check
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

// Helper to generate a random 5-character alphanumeric captcha
function generateCaptchaCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous chars I, 1, O, 0
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to evaluate mixed combination password criteria
interface PasswordCriteria {
  minLength: boolean; // >= 8 characters
  hasUpper: boolean;  // at least 1 uppercase letter (A-Z)
  hasLower: boolean;  // at least 1 lowercase letter (a-z)
  hasNumber: boolean; // at least 1 digit (0-9)
  hasSpecial: boolean;// at least 1 special character (!@#$%^&*)
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

  // Failed Attempts & Adaptive Captcha
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Password criteria evaluation (Mixed Combination)
  const pwdCriteria = checkPasswordStrength(password);
  const pwdScore = Object.values(pwdCriteria).filter(Boolean).length;

  const { login, register, skipLogin } = useAuth();
  const navigate = useNavigate();

  // Initialize captcha if threshold reached
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
      setLockoutTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Handle Captcha refresh
  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setCaptchaInput("");
  };

  // Handle login or registration submission
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

    // Verify Captcha if active
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
        // Enforce mixed combination password
        const isMixed = Object.values(pwdCriteria).every(Boolean);
        if (!isMixed) {
          setError("Password must be a mixed combination: at least 8 characters, with uppercase, lowercase, numbers, and special characters.");
          setIsSubmitting(false);
          return;
        }

        // Registration flow
        const result = await register(cleanEmail, cleanPassword);
        if (result === true) {
          toast.success("Account created successfully. Welcome to GadgetZone!");
          navigate("/");
        } else {
          setError(typeof result === "string" ? result : "Registration failed.");
        }
      } else {
        // Direct credential verification & login
        const success = await login(cleanEmail, cleanPassword);

        if (success) {
          setFailedAttempts(0);
          setShowCaptcha(false);

          toast.success("Logged in successfully.");
          const storedUser = localStorage.getItem("GadgetZone_user");
          const parsed = storedUser ? JSON.parse(storedUser) : null;

          if (
            parsed?.isAdmin ||
            cleanEmail.toLowerCase().includes("vijay") ||
            cleanEmail.toLowerCase().includes("admin") ||
            cleanEmail.toLowerCase().includes("gzones")
          ) {
            navigate("/admin");
          } else {
            navigate("/");
          }
        } else {
          // Failed attempt handling
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

  const handleCancel = () => {
    skipLogin();
    navigate("/");
  };

  return (
    <div className="relative min-h-screen min-h-dvh w-full flex items-center justify-center p-3 sm:p-6 bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Modal Card Container */}
      <div className="w-full max-w-4xl max-h-[92dvh] overflow-y-auto relative animate-fade-in-up my-auto shadow-2xl rounded-3xl border border-border/40 bg-card">
        {/* Cancel / Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-50 rounded-full bg-background/60 backdrop-blur-md shadow-sm hover:bg-background text-foreground transition-all border border-border/40"
          onClick={handleCancel}
          title="Close sign in"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="w-full flex flex-col md:flex-row">
          {/* Left Side: Authentication Form */}
          <div className="flex-1 p-6 sm:p-10 flex flex-col justify-center relative">
            <div className="max-w-md w-full mx-auto space-y-6">
              
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
                      placeholder="e.g. admin@gzones.in or user"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/40"
                    />
                  </div>
                </div>

                {/* Field 2: Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Password
                  </label>
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
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-muted/30 border border-input/60 rounded-xl text-sm placeholder:text-muted-foreground/40 focus-visible:ring-1 focus-visible:ring-primary/40"
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

                  {/* Real-time Mixed Combination Checklist */}
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
                        <span className={`text-[11px] font-bold ${
                          pwdScore === 5 ? "text-emerald-400" : pwdScore >= 3 ? "text-amber-400" : "text-rose-400"
                        }`}>
                          {pwdScore === 5 ? "Strong (Complete)" : pwdScore >= 3 ? "Moderate" : "Weak"}
                        </span>
                      </div>

                      {/* Progress meter */}
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

                      {/* Criteria Checklist */}
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.minLength ? "text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                          {pwdCriteria.minLength ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 h-3 rounded-full border border-muted-foreground/40 inline-block shrink-0" />}
                          <span>8+ characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.hasUpper ? "text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                          {pwdCriteria.hasUpper ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 h-3 rounded-full border border-muted-foreground/40 inline-block shrink-0" />}
                          <span>Uppercase (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.hasLower ? "text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                          {pwdCriteria.hasLower ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 h-3 rounded-full border border-muted-foreground/40 inline-block shrink-0" />}
                          <span>Lowercase (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${pwdCriteria.hasNumber ? "text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                          {pwdCriteria.hasNumber ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 h-3 rounded-full border border-muted-foreground/40 inline-block shrink-0" />}
                          <span>Number (0-9)</span>
                        </div>
                        <div className={`col-span-2 flex items-center gap-1.5 ${pwdCriteria.hasSpecial ? "text-emerald-400 font-medium" : "text-muted-foreground"}`}>
                          {pwdCriteria.hasSpecial ? <Check className="h-3 w-3 shrink-0" /> : <span className="w-3 h-3 rounded-full border border-muted-foreground/40 inline-block shrink-0" />}
                          <span>Special character (!@#$%^&*)</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* ADAPTIVE CAPTCHA (Appears ONLY after multiple failed attempts) */}
                {showCaptcha && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Anti-Bot Verification
                      </span>
                      <span className="text-[10px] text-muted-foreground">Triggered after failed logins</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Captcha Visual Token Display */}
                      <div className="relative flex-1 h-11 rounded-lg bg-zinc-950 border border-zinc-700/80 flex items-center justify-center overflow-hidden select-none px-3">
                        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                          <line x1="0" y1="10" x2="100%" y2="30" stroke="#38bdf8" strokeWidth="1.5" />
                          <line x1="0" y1="35" x2="100%" y2="15" stroke="#f43f5e" strokeWidth="1.5" />
                          <circle cx="25%" cy="50%" r="15" fill="none" stroke="#eab308" strokeWidth="1" strokeDasharray="2 2" />
                          <circle cx="75%" cy="50%" r="20" fill="none" stroke="#a855f7" strokeWidth="1" strokeDasharray="3 3" />
                        </svg>
                        <span className="font-mono text-lg font-black tracking-widest text-sky-400 drop-shadow-[0_2px_4px_rgba(56,189,248,0.5)] transform -rotate-1">
                          {captchaCode}
                        </span>
                      </div>

                      {/* Refresh Captcha Button */}
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
                      onChange={e => setCaptchaInput(e.target.value)}
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

            </div>
          </div>

          {/* Right Side: Showcase Graphic */}
          <div className="hidden md:flex flex-1 p-4 bg-background">
            <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-900 to-zinc-900 shadow-inner flex items-center justify-center">
              {/* High-end working gaming PC image */}
              <img 
                src="https://images.unsplash.com/photo-1587202372634-32705e3bf49c?q=80&w=1000&auto=format&fit=crop" 
                alt="Elite Gaming PC" 
                className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-90 transition-transform duration-1000 hover:scale-105"
              />
              {/* Dark overlay shift matching the tech design */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              <div className="relative z-10 text-center p-8 text-white space-y-4 absolute bottom-12 w-full">
                 <h2 className="text-3xl font-extrabold drop-shadow-lg tracking-tight">Ultimate Hardware</h2>
                 <p className="text-gray-300 font-medium">Powering your next generation of gaming and creativity.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
