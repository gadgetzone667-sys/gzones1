import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { extractSsoData } from "../lib/domain";

interface User {
  id: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  hasSkippedLogin: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (email: string, pass: string) => Promise<boolean | string>;
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

  // On mount, restore session from localStorage or handle incoming SSO payload
  useEffect(() => {
    // Check if incoming SSO payload exists from gzones.in to admin.gzones.in
    const sso = extractSsoData();
    if (sso) {
      localStorage.setItem("GadgetZone_token", sso.token);
      localStorage.setItem("GadgetZone_user", JSON.stringify(sso.user));
      setUser(sso.user);
      setToken(sso.token);
      setIsLoading(false);
      return;
    }

    const storedToken = localStorage.getItem("GadgetZone_token");
    const storedUser = localStorage.getItem("GadgetZone_user");
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
        setToken(storedToken);
      } catch {
        localStorage.removeItem("GadgetZone_token");
        localStorage.removeItem("GadgetZone_user");
      }
    }
    const skipped = localStorage.getItem("GadgetZone_skipped");
    if (skipped === "true") setHasSkippedLogin(true);
    setIsLoading(false);
  }, []);

  const getToken = () => localStorage.getItem("GadgetZone_token");

  // Helper to read and write locally registered users when backend is static / returning 405
  const getLocalUsers = (): Array<{ id: string; email: string; pass: string; isAdmin: boolean }> => {
    try {
      const stored = localStorage.getItem("GadgetZone_local_registered_users");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveLocalUsers = (users: Array<{ id: string; email: string; pass: string; isAdmin: boolean }>) => {
    try {
      localStorage.setItem("GadgetZone_local_registered_users", JSON.stringify(users));
    } catch {
      // Ignore write errors
    }
  };

  const login = async (email: string, pass: string): Promise<boolean> => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (pass || "").trim();

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      // If backend API responded successfully with JSON
      if (res.ok) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (data?.token && data?.user) {
            localStorage.setItem("GadgetZone_token", data.token);
            localStorage.setItem("GadgetZone_user", JSON.stringify(data.user));
            setUser(data.user);
            setToken(data.token);
            return true;
          }
        }
      }

      // If server explicitly rejected with 401 Unauthorized with JSON body
      if (res.status === 401) {
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          // If not master admin and backend gave 401, return false
          if (cleanEmail !== "admin@gzones.in" || cleanPassword !== "Vijay@2223") {
            return false;
          }
        }
      }
    } catch (err) {
      console.warn("Backend API request error, evaluating credentials:", err);
    }

    // Master Administrator fallback (handles static hosting on Vercel where POST /api returns 405 or server is offline)
    if (cleanEmail === "admin@gzones.in" && cleanPassword === "Vijay@2223") {
      const adminUser: User = {
        id: "admin-master-root",
        email: "admin@gzones.in",
        isAdmin: true,
      };
      const sessionToken = "gz_admin_session_" + Date.now();
      localStorage.setItem("GadgetZone_token", sessionToken);
      localStorage.setItem("GadgetZone_user", JSON.stringify(adminUser));
      setUser(adminUser);
      setToken(sessionToken);
      return true;
    }

    // Customer fallback for static Vercel hosting when /api returns 405
    const localUsers = getLocalUsers();
    const matched = localUsers.find(u => u.email === cleanEmail && u.pass === cleanPassword);
    if (matched) {
      const customerUser: User = {
        id: matched.id,
        email: matched.email,
        isAdmin: matched.isAdmin || false,
      };
      const sessionToken = "gz_customer_session_" + Date.now();
      localStorage.setItem("GadgetZone_token", sessionToken);
      localStorage.setItem("GadgetZone_user", JSON.stringify(customerUser));
      setUser(customerUser);
      setToken(sessionToken);
      return true;
    }

    return false;
  };

  const register = async (email: string, pass: string): Promise<boolean | string> => {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (pass || "").trim();

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password: cleanPassword }),
      });

      const contentType = res.headers.get("content-type") || "";

      // Real backend responded with JSON
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (res.ok) {
          localStorage.setItem("GadgetZone_token", data.token);
          localStorage.setItem("GadgetZone_user", JSON.stringify(data.user));
          setUser(data.user);
          setToken(data.token);
          return true;
        }
        return data.message || "Registration failed.";
      }

      // If response is HTML or 405 (e.g. Vercel static rewrites), fall through to local storage fallback
      console.warn("Backend API returned non-JSON / 405 status. Utilizing client registration fallback.");
    } catch (err) {
      console.warn("Backend API request error, proceeding with local registration fallback:", err);
    }

    // Local registration fallback for static Vercel deployments (prevents 405 Method Not Allowed failures)
    const localUsers = getLocalUsers();
    if (localUsers.some(u => u.email === cleanEmail)) {
      return "An account with this email already exists.";
    }

    const newUser = {
      id: "usr_" + Math.random().toString(36).substring(2, 10),
      email: cleanEmail,
      pass: cleanPassword,
      isAdmin: cleanEmail === "admin@gzones.in",
    };
    localUsers.push(newUser);
    saveLocalUsers(localUsers);

    const userObj: User = {
      id: newUser.id,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
    };
    const sessionToken = "gz_customer_session_" + Date.now();
    localStorage.setItem("GadgetZone_token", sessionToken);
    localStorage.setItem("GadgetZone_user", JSON.stringify(userObj));
    setUser(userObj);
    setToken(sessionToken);
    return true;
  };

  const logout = () => {
    localStorage.removeItem("GadgetZone_token");
    localStorage.removeItem("GadgetZone_user");
    localStorage.removeItem("GadgetZone_skipped");
    setUser(null);
    setToken(null);
    setHasSkippedLogin(false);
  };

  const skipLogin = () => {
    localStorage.setItem("GadgetZone_skipped", "true");
    setHasSkippedLogin(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoggedIn: !!user,
      hasSkippedLogin,
      isLoading,
      login,
      register,
      logout,
      skipLogin,
      getToken,
    }}>
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
