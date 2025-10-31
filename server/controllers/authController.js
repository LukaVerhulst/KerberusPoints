import jwt from "jsonwebtoken";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

export const login = (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  if (email !== adminEmail || password !== adminPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ email: adminEmail, role: "admin" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({ email: adminEmail });
};

export const logout = (req, res) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
  return res.status(200).json({ ok: true });
};

export const me = (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(200).json({ user: null });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ user: { email: payload.email, role: payload.role } });
  } catch (err) {
    return res.status(401).json({ user: null });
  }
};