import { useState } from "react";
import { useAppContext } from "../context/context";
import { errorMessage } from "../lib/api";
export default function Login() {
  const { login } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-story">
        <a className="brand" href="/">
          <img src="/kerberus.svg" alt="Kerberus schild" />
          <span>
            KERBERUS<small>SCHACHTENPUNTEN</small>
          </span>
        </a>
        <p className="eyebrow">ACADEMIEJAAR 2026 — 2027</p>
        <h1>
          Een jaar vol verhalen.
          <br />
          <em>Eén superschacht.</em>
        </h1>
        <p className="intro">
          Elke opdracht telt. Volg de strijd om de titel en geef onze schachten
          de punten die ze verdienen.
        </p>
        <figure>
          <img
            className="group-photo"
            src="/schachten-2026.webp"
            alt="De volledige Kerberusgroep van 2026–2027 met het clubschild"
          />
          <figcaption>Onze schachten. Onze club. Ons jaar.</figcaption>
        </figure>
      </section>
      <section className="login-card">
        <p className="eyebrow">VOOR DE TEMSTER</p>
        <h2>Welkom terug</h2>
        <p className="muted">
          Controleer het bewijs in de Facebookgroep en registreer daarna de
          punten.
        </p>
        <form onSubmit={submit}>
          <label>
            E-mail
            <input
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Wachtwoord
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Inloggen…" : "Inloggen →"}
          </button>
        </form>
        <p className="login-footer">Kerberus · Kortrijk · 2026–2027</p>
      </section>
    </main>
  );
}
