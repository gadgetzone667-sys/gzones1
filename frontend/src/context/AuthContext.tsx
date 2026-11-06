import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { extractSsoData } from "../lib/domain";

export interface User {
  id: string;
  email: string;
  isAdmin: boolean;
  name?: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  hasSkippedLogin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean | { twoFactorRequired: true; tempToken: string }>;
  verify2FALogin: (tempToken: string, code: string) => Promise<{ success: boolean; message?: string }>;
  register: (email: string, pass: string) => Promise<boolean | string>;
  loginWithGoogle: (credential: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  skipLogin: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [hasSkippedLogin, setHasSkippedLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Securely verify session on application startup
  useEffect(() => {
    try {
      localStorage.removeItem("GadgetZone_local_registered_users");
      localStorage.removeItem("GadgetZone_all_orders");
      localStorage.removeItem("GadgetZone_user"); // Never trust client-cached user roles
    } catch {}

    const verifySession = async () => {
      const sso = extractSsoData();
      let activeToken = sso?.token || localStorage.getItem("GadgetZone_token");

      if (!activeToken) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            const verifiedUser: User = {
              id: String(data.user.id || data.user._id),
              email: data.user.email,
              isAdmin: Boolean(data.user.isAdmin),
              name: data.user.name,
              avatar: data.user.avatar,
              twoFactorEnabled: Boolean(data.user.twoFactorEnabled),
            };
            setUser(verifiedUser);
            setToken(activeToken);
            localStorage.setItem("GadgetZone_token", activeToken);
          } else {
            throw new Error("Invalid session data");
          }
        } else {
          localStorage.removeItem("GadgetZone_token");
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn("Auth verification notice:", err);
        localStorage.removeItem("GadgetZone_token");
        setUser(null);
        setToken(null);
      } finally {
        const skipped = localStorage.getItem("GadgetZone_skipped");
        if (skipped === "true") setHasSkippedLogin(true);
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const getToken = () => token || localStorage.getItem("GadgetZone_token");

  const login = async (
    email: string,
    pass: string
  ): Promise<boolean | { twoFactorRequired: true; tempToken: string }> => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (pass || "").trim();

    if (!cleanEmail || !cleanPassword) return false;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.twoFactorRequired && data?.tempToken) {
          return { twoFactorRequired: true, tempToken: data.tempToken };
        }
        if (data?.token && data?.user) {
          localStorage.setItem("GadgetZone_token", data.token);
          const verifiedUser: User = {
            id: String(data.user.id || data.user._id),
            email: data.user.email,
            isAdmin: Boolean(data.user.isAdmin),
            name: data.user.name,
            avatar: data.user.avatar,
            twoFactorEnabled: Boolean(data.user.twoFactorEnabled),
          };
          setUser(verifiedUser);
          setToken(data.token);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn("Login request failed:", err);
      return false;
    }
  };

  const verify2FALogin = async (
    tempToken: string,
    code: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch("/api/auth/login-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, token: code.trim() }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.token && data?.user) {
        localStorage.setItem("GadgetZone_token", data.token);
        const verifiedUser: User = {
          id: String(data.user.id || data.user._id),
          email: data.user.email,
          isAdmin: Boolean(data.user.isAdmin),
          name: data.user.name,
          avatar: data.user.avatar,
          twoFactorEnabled: Boolean(data.user.twoFactorEnabled),
        };
        setUser(verifiedUser);
        setToken(data.token);
        return { success: true };
      }

      return {
        success: false,
        message: data?.error || data?.message || "Invalid two-factor code or code expired.",
      };
    } catch (err: any) {
      return { success: false, message: err?.message || "2FA verification request failed." };
    }
  };

  const loginWithGoogle = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.token && data?.user) {
          localStorage.setItem("GadgetZone_token", data.token);
          const verifiedUser: User = {
            id: String(data.user.id || data.user._id),
            email: data.user.email,
            isAdmin: Boolean(data.user.isAdmin),
            name: data.user.name,
            avatar: data.user.avatar,
          };
          setUser(verifiedUser);
          setToken(data.token);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.warn("Google login failed:", err);
      return false;
    }
  };

  const register = async (email: string, pass: string): Promise<boolean | string> => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (pass || "").trim();

    if (!cleanEmail || !cleanPassword) {
      return "Email and password are required.";
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const data = await res.json().catch(() => null);

      if (res.ok && data?.token && data?.user) {
        localStorage.setItem("GadgetZone_token", data.token);
        const verifiedUser: User = {
          id: String(data.user.id || data.user._id),
          email: data.user.email,
          isAdmin: Boolean(data.user.isAdmin),
          name: data.user.name,
          avatar: data.user.avatar,
        };
        setUser(verifiedUser);
        setToken(data.token);
        return true;
      }

      return data?.message || "Registration failed. Please try again.";
    } catch (err) {
      console.warn("Registration error:", err);
      return "Unable to connect to authentication service.";
    }
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        return {
          success: true,
          message: data.message || "Password reset instructions have been sent to your email.",
        };
      }
      return {
        success: false,
        message: data?.message || "Failed to process password reset request.",
      };
    } catch (err) {
      return {
        success: false,
        message: "Network error. Please try again later.",
      };
    }
  };

  const resetPassword = async (
    email: string,
    tokenStr: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token: tokenStr, newPassword }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        return {
          success: true,
          message: data.message || "Password updated successfully!",
        };
      }
      return {
        success: false,
        message: data?.message || "Failed to reset password. Link may be expired.",
      };
    } catch (err) {
      return {
        success: false,
        message: "Network error. Please try again later.",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("GadgetZone_token");
    localStorage.removeItem("GadgetZone_user");
    localStorage.removeItem("GadgetZone_skipped");
    localStorage.removeItem("GadgetZone_all_orders");
    localStorage.removeItem("GadgetZone_local_registered_users");
    setUser(null);
    setToken(null);
    setHasSkippedLogin(false);
  };

  const skipLogin = () => {
    localStorage.setItem("GadgetZone_skipped", "true");
    setHasSkippedLogin(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!user,
        hasSkippedLogin,
        isLoading,
        login,
        verify2FALogin,
        register,
        loginWithGoogle,
        forgotPassword,
        resetPassword,
        logout,
        skipLogin,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
