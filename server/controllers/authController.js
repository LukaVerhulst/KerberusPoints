import jwt from "jsonwebtoken";

const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });

export const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Missing credentials" });
  }

  // Parse the admins list from environment
  let admins;
  try {
    admins = JSON.parse(process.env.ADMINS);
  } catch (err) {
    console.error("Invalid ADMINS JSON in .env");
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  console.log(email);
  // Find matching admin
  const admin = admins.find(
    (a) => a.email === email && a.password === password
  );

  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = signToken({ email: admin.email, role: "admin" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // only secure in prod
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({ email: admin.email });
};

export const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Match login settings
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };
  
  res.clearCookie("token", cookieOptions);
  return res.status(200).json({ ok: true });
};

export const me = (req, res) => {
  const token = req.cookies?.token;
  if (!token) return res.status(200).json({ user: null });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({
      user: { email: payload.email, role: payload.role },
    });
  } catch (err) {
    return res.status(401).json({ user: null });
  }
};
