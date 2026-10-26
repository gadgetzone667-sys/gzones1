import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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

  // On mount, restore session from localStorage
  useEffect(() => {
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

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem("GadgetZone_token", data.token);
      localStorage.setItem("GadgetZone_user", JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);
      return true;
    } catch {
      return false;
    }
  };

  const register = async (email: string, pass: string): Promise<boolean | string> => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (!res.ok) {
        const data = await res.json();
        return data.message || "Registration failed.";
      }
      const data = await res.json();
      localStorage.setItem("GadgetZone_token", data.token);
      localStorage.setItem("GadgetZone_user", JSON.stringify(data.user));
      setUser(data.user);
      setToken(data.token);
      return true;
    } catch {
      return "Network error. Please try again.";
    }
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
