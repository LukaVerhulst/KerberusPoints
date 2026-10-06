import jwt from "jsonwebtoken";
export const admins = () => {
  try {
    const value = JSON.parse(process.env.ADMINS || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};
export function currentUser(req) {
  try {
    const payload = jwt.verify(req.cookies?.token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (
      payload.role !== "admin" ||
      !admins().some((a) => a.email === payload.email)
    )
      return null;
    return { email: payload.email, role: "admin" };
  } catch {
    return null;
  }
}
export function requireAdmin(req, res, next) {
  req.user = currentUser(req);
  if (!req.user)
    return res
      .status(401)
      .json({ message: "Log in als beheerder om dit te wijzigen." });
  next();
}
export const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
  sameSite: "lax",
  path: "/",
});
