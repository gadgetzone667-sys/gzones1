import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminPortalUrl } from "../lib/domain";
import { ShieldCheck, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "../components/ui/button";

interface AdminRedirectProps {
  loginOnly?: boolean;
}

export const AdminRedirect = ({ loginOnly }: AdminRedirectProps) => {
  const { user, token } = useAuth();
  const targetUrl = loginOnly ? "https://admin.gzones.in/login" : getAdminPortalUrl(token, user);

  useEffect(() => {
    // Automatically redirect after brief display
    const timer = setTimeout(() => {
      window.location.href = targetUrl;
    }, 600);

    return () => clearTimeout(timer);
  }, [targetUrl]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900/90 border border-purple-500/30 backdrop-blur-xl shadow-2xl text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 mx-auto shadow-inner">
          <ShieldCheck className="h-8 w-8 animate-pulse text-purple-400" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-block px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
            MANAGEMENT GATEWAY
          </span>
          <h2 className="text-xl font-extrabold text-foreground tracking-tight">
            Connecting to Admin Portal
          </h2>
          <p className="text-xs text-muted-foreground font-mono">
            https://admin.gzones.in/
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
          <span>Redirecting to dedicated administrator domain...</span>
        </div>

        <div className="pt-2">
          <Button
            asChild
            className="w-full h-10 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white gap-2"
          >
            <a href={targetUrl}>
              <span>Open admin.gzones.in immediately</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminRedirect;
