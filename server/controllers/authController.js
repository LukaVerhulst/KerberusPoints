import { timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { admins, currentUser, cookieOptions } from "../middleware/auth.js";
const attempts = new Map();
const equal = (a, b) => {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    email.length > 200 ||
    password.length > 200 ||
    !email ||
    !password
  )
    return res.status(400).json({ message: "Vul je e-mail en wachtwoord in." });
  const key = req.ip;
  const now = Date.now();
  for (const [ip, entry] of attempts)
    if (entry.until < now) attempts.delete(ip);
  const record = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  if (record.count >= 15)
    return res
      .status(429)
      .json({ message: "Te veel pogingen. Probeer over 15 minuten opnieuw." });
  record.count++;
  attempts.set(key, record);
  if (attempts.size > 10000) attempts.delete(attempts.keys().next().value);
  if (!process.env.JWT_SECRET || !admins().length)
    return res
      .status(503)
      .json({ message: "Beheerderslogin is nog niet geconfigureerd." });
  const admin = admins().find(
    (a) => a.email?.toLowerCase() === email.trim().toLowerCase(),
  );
  const valid =
    admin &&
    (admin.passwordHash
      ? await bcrypt.compare(password, admin.passwordHash)
      : typeof admin.password === "string" && equal(password, admin.password));
  if (!valid)
    return res
      .status(401)
      .json({ message: "E-mail of wachtwoord niet juist." });
  attempts.delete(key);
  const token = jwt.sign(
    { email: admin.email, role: "admin" },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "7d" },
  );
  res.cookie("token", token, {
    ...cookieOptions(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ email: admin.email, role: "admin" });
}
export function logout(req, res) {
  res.clearCookie("token", cookieOptions());
  res.json({ ok: true });
}
export function me(req, res) {
  res.json({ user: currentUser(req) });
}
