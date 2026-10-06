import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/context";
import { api, errorMessage } from "../lib/api";
import Workspace from "../components/Workspace";
import Modal from "../components/Modal";
import AddSchacht from "../components/AddSchacht";
export default function Home() {
  const { user, logout } = useAppContext();
  const [schachten, setSchachten] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("ranking");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);
  const [exporting, setExporting] = useState(false);
  const refresh = useCallback(async () => {
    const { data } = await api.get("/api/schachten");
    setSchachten(data);
    setError("");
    return data;
  }, []);
  useEffect(() => {
    let active = true;
    api
      .get("/api/schachten")
      .then(({ data }) => {
        if (active) setSchachten(data);
      })
      .catch((err) => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const selected = schachten.find((s) => s._id === selectedId);
  const total = schachten.reduce((s, item) => s + item.points, 0);
  async function remove(id) {
    await api.delete(`/api/schachten/${id}`);
    setSelectedId(null);
    setView("ranking");
    await refresh();
    toast.success("Schacht verwijderd");
  }
  async function exportPDF() {
    setExporting(true);
    try {
      const [{ generatePDF }, { assets }] = await Promise.all([
        import("../utils/generatePDF"),
        import("../assets/assets"),
      ]);
      generatePDF(schachten, assets.kerberus_logoBase64);
    } catch {
      toast.error("Export mislukt.");
    } finally {
      setExporting(false);
    }
  }
  return (
    <div className={`app-shell view-${view}`}>
      <header className="topbar">
        <a className="brand" href="/">
          <img src="/kerberus.svg" alt="Kerberus schild" />
          <span>
            KERBERUS<small>SCHACHTENPUNTEN</small>
          </span>
        </a>
        <div className="topbar-actions">
          <span className="season">2026 — 2027</span>
          <button className="text-button" onClick={() => setModal("rules")}>
            Spelregels
          </button>
          <button
            className="text-button"
            title={user.email}
            onClick={() =>
              logout().catch((err) => toast.error(errorMessage(err)))
            }
          >
            Uitloggen
          </button>
        </div>
      </header>
      <main className="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">DE STRIJD OM SUPERSCHACHT</p>
            <h1>
              Maak er een
              <br />
              <em>legendarisch jaar van.</em>
            </h1>
            <p>
              Elke opdracht een verhaal.
              <br />
              Elke punt een stap dichter bij de titel.
            </p>
            <div className="hero-stats">
              <span>
                <strong>{schachten.length}</strong> schachten
              </span>
              <span>
                <strong>{total}</strong> punten verdiend
              </span>
              <span className="year-pill">2026–2027</span>
            </div>
          </div>
          <button
            className="hero-image"
            aria-label="Groepsfoto volledig bekijken"
            onClick={() => setModal("photo")}
          >
            <img
              src="/schachten-2026.webp"
              alt="De volledige Kerberusgroep van 2026–2027 rond het clubschild"
            />
            <span>
              Onze schachten, ons jaar. <small>↗</small>
            </span>
          </button>
        </section>
        <div className="rules-strip">
          <span className="rule-dot">i</span>
          <p>Met lint. Met bewijs. Met formaliteiten bij het binnentrekken.</p>
          <button className="text-button" onClick={() => setModal("rules")}>
            Alle spelregels →
          </button>
        </div>
        <div className={`dashboard mobile-${view}`}>
          <aside className="leaderboard panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">DE RANGLIJST</p>
                <h2>Klassement</h2>
              </div>
              <span className="count-pill">{schachten.length}</span>
            </div>
            <label className="search">
              <span>⌕</span>
              <input
                type="search"
                aria-label="Zoek schacht"
                placeholder="Zoek een schacht…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="leaderboard-label">
              <span>SCHACHT</span>
              <span>PUNTEN</span>
            </div>
            {loading ? (
              <div className="empty">Klassement laden…</div>
            ) : error ? (
              <div className="empty">
                <p className="error" role="alert">
                  {error}
                </p>
                <button
                  onClick={() =>
                    refresh().catch((err) => setError(errorMessage(err)))
                  }
                >
                  Opnieuw proberen
                </button>
              </div>
            ) : !schachten.length ? (
              <div className="empty">
                <span className="empty-symbol">♜</span>
                <h3>Een nieuw jaar begint</h3>
                <p>
                  Voeg de eerste schacht toe.
                  <br />
                  Wie wordt onze superschacht?
                </p>
                <button className="primary" onClick={() => setModal("add")}>
                  + Eerste schacht
                </button>
              </div>
            ) : (
              <ol className="ranking-list">
                {schachten
                  .map((s, i) => ({ s, i }))
                  .filter(({ s }) =>
                    s.name.toLowerCase().includes(query.toLowerCase())
                  )
                  .map(({ s, i }) => (
                    <li key={s._id}>
                      <button
                        className={selectedId === s._id ? "selected" : ""}
                        onClick={() => {
                          setSelectedId(s._id);
                          setView("tasks");
                        }}
                        aria-pressed={selectedId === s._id}
                      >
                        <span className={`rank rank-${i + 1}`}>{i + 1}</span>
                        <span className="avatar">
                          {s.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="ranking-name">
                          {s.name}
                          {i === 0 && <small>Aan de leiding</small>}
                        </span>
                        <strong>{s.points}</strong>
                        <span className="row-chevron">›</span>
                      </button>
                    </li>
                  ))}
              </ol>
            )}
            {!loading && Boolean(schachten.length) && (
              <button className="add-member" onClick={() => setModal("add")}>
                + Schacht toevoegen
              </button>
            )}
            <button
              className="export-button"
              disabled={!schachten.length || exporting}
              onClick={exportPDF}
            >
              {exporting ? "Exporteren…" : "↓ Klassement als PDF"}
            </button>
          </aside>
          {selected ? (
            <Workspace
              key={selected._id}
              schacht={selected}
              rank={schachten.findIndex((s) => s._id === selected._id) + 1}
              view={view === "activity" ? "activity" : "tasks"}
              setView={setView}
              onRefresh={refresh}
              onDelete={remove}
            />
          ) : (
            <section className="workspace panel empty-workspace">
              <div className="empty-symbol">↗</div>
              <p className="eyebrow">KLAAR VOOR DE VOLGENDE OPDRACHT?</p>
              <h2>Selecteer een schacht</h2>
              <p className="muted">
                Kies iemand uit het klassement om opdrachten
                <br className="desktop-only" /> te bekijken, punten te geven en
                activiteit te volgen.
              </p>
              <button
                className="secondary mobile-only"
                onClick={() => setView("ranking")}
              >
                Naar het klassement
              </button>
              <div className="flow-hint">
                <span>
                  1 <small>Schacht kiezen</small>
                </span>
                <i>→</i>
                <span>
                  2 <small>Opdracht kiezen</small>
                </span>
                <i>→</i>
                <span>
                  3 <small>Punten bevestigen</small>
                </span>
              </div>
            </section>
          )}
        </div>
        <footer className="page-footer">
          <span>KERBERUS · KORTRIJK</span>
          <span>Superschacht 2026–2027</span>
        </footer>
      </main>
      <nav className="mobile-nav" aria-label="Hoofdnavigatie">
        <button
          className={view === "ranking" ? "active" : ""}
          onClick={() => setView("ranking")}
        >
          <span>♜</span>Klassement
        </button>
        <button
          className={view === "tasks" ? "active" : ""}
          onClick={() => setView("tasks")}
        >
          <span>◇</span>Opdrachten
        </button>
        <button
          className={view === "activity" ? "active" : ""}
          onClick={() => setView("activity")}
        >
          <span>↻</span>Activiteit
        </button>
      </nav>
      {modal === "add" && (
        <AddSchacht
          onClose={() => setModal(null)}
          onSaved={async (data) => {
            setModal(null);
            setSelectedId(data._id);
            setView("tasks");
            await refresh();
          }}
        />
      )}
      {modal === "photo" && (
        <Modal title="Schachten 2026–2027" onClose={() => setModal(null)} wide>
          <img
            className="full-photo"
            src="/schachten-2026.webp"
            alt="De volledige Kerberusgroep met het clubschild"
          />
        </Modal>
      )}
      {modal === "rules" && (
        <Modal title="Spelregels 2026–2027" onClose={() => setModal(null)}>
          <div className="rules-content">
            <p className="muted">
              De opdrachten uit het document van de temster bepalen de punten en
              herhaalregels.
            </p>
            <ol>
              <li>
                <strong>Met lint</strong>
                <p>Tenzij de opdracht anders vermeldt, draag je je lint.</p>
              </li>
              <li>
                <strong>Geen bewijs = geen punten</strong>
                <p>
                  Plaats een foto of video in de Facebookgroep voordat punten
                  worden toegekend.
                </p>
              </li>
              <li>
                <strong>Binnentrekken met formaliteiten</strong>
                <p>Zonder formaliteiten telt het niet.</p>
              </li>
              <li>
                <strong>Goedkeuring waar vereist</strong>
                <p>
                  De temster keurt taakjes en hun punten goed. Het praesidium
                  kiest de foto van de week.
                </p>
              </li>
            </ol>
            <p>
              Wekelijkse opdrachten lopen van maandag tot zondag, in Belgische
              tijd. Persoons- en evenementlimieten gelden voor alle varianten
              samen.
            </p>
            <a
              className="button-link secondary"
              href="/opdrachten-2026-2027.pdf"
              target="_blank"
              rel="noreferrer"
            >
              Bekijk het originele opdrachtendocument ↗
            </a>
          </div>
        </Modal>
      )}
    </div>
  );
}
