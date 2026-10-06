import { useCallback, useEffect, useState } from "react";
import {
  api,
  blocked,
  errorMessage,
  pointsLabel,
  repeatLabel,
  signed,
} from "../lib/api";
import CompletionDialog from "./CompletionDialog";
import CustomDialog from "./CustomDialog";
import ConfirmDialog from "./ConfirmDialog";
import toast from "react-hot-toast";
export default function Workspace({
  schacht,
  rank,
  view,
  setView,
  onRefresh,
  onDelete,
}) {
  const [tasks, setTasks] = useState([]);
  const [completions, setCompletions] = useState([]);
  const [contexts, setContexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Alle");
  const [modal, setModal] = useState(null);
  const load = useCallback(
    async (signal) => {
      setError("");
      try {
        const [a, b, c] = await Promise.all([
          api.get("/api/tasks", { params: { schachtId: schacht._id }, signal }),
          api.get(`/api/completions/${schacht._id}`, { signal }),
          api.get("/api/contexts", { signal }),
        ]);
        setTasks(a.data);
        setCompletions(b.data);
        setContexts(c.data);
      } catch (err) {
        if (err.code !== "ERR_CANCELED") setError(errorMessage(err));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [schacht._id]
  );
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  async function saved(data) {
    setModal(null);
    const results = await Promise.allSettled([load(), onRefresh()]);
    if (results.some((r) => r.status === "rejected"))
      toast.error(
        "Wijziging opgeslagen; vernieuw de pagina voor het actuele klassement."
      );
    else
      toast.success(
        `${signed(data.completion.pointsAwarded)} punten geregistreerd`
      );
  }
  const shown = tasks.filter((t) => {
    const done = completions.some((c) => c.taskId === t._id);
    return (
      `${t.name} ${t.description}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "Alle" ||
        (filter === "Beschikbaar" && !blocked(t, completions)) ||
        (filter === "Voltooid" && done) ||
        (filter === "Wekelijks" && t.repeatRule.type === "weekly") ||
        (filter === "Eigen" && t.ownerSchachtId))
    );
  });
  const customPoints =
    modal?.type === "deleteTask"
      ? completions
          .filter((c) => c.taskId === modal.task._id)
          .reduce((s, c) => s + c.pointsAwarded, 0)
      : 0;
  return (
    <section
      className="workspace panel"
      aria-label={`Opdrachten voor ${schacht.name}`}
    >
      <header className="workspace-heading">
        <div className="avatar large">
          {schacht.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="selected-name">
          <p className="eyebrow">SCHACHT · #{rank}</p>
          <h2>{schacht.name}</h2>
          <p className="muted">{completions.length} opdrachten geregistreerd</p>
        </div>
        <div className="score-total">
          <strong>{schacht.points}</strong>
          <span>punten</span>
        </div>
      </header>
      <div className="workspace-tabs">
        <button
          className={view === "tasks" ? "active" : ""}
          onClick={() => setView("tasks")}
        >
          Opdrachten
        </button>
        <button
          className={view === "activity" ? "active" : ""}
          onClick={() => setView("activity")}
        >
          Activiteit <span>{completions.length}</span>
        </button>
        <button
          className="text-button settings"
          onClick={() => setModal({ type: "deleteSchacht" })}
        >
          Beheren
        </button>
      </div>
      {loading ? (
        <div className="empty">Opdrachten laden…</div>
      ) : error ? (
        <div className="empty">
          <p className="error" role="alert">
            {error}
          </p>
          <button onClick={() => load()}>Opnieuw proberen</button>
        </div>
      ) : view === "activity" ? (
        <div className="activity-list">
          <div className="section-heading">
            <div>
              <h3>Recente activiteit</h3>
              <p className="muted">
                Een vergissing? Draai de registratie terug.
              </p>
            </div>
          </div>
          {!completions.length && (
            <div className="empty">
              <span className="empty-symbol">↗</span>
              <h3>Het verhaal begint hier</h3>
              <p>Voltooide opdrachten verschijnen hier.</p>
              <button onClick={() => setView("tasks")}>
                Bekijk opdrachten
              </button>
            </div>
          )}
          {completions.map((c) => (
            <article className="activity-row" key={c._id}>
              <div
                className={`activity-dot ${c.pointsAwarded < 0 ? "negative" : ""}`}
              >
                {c.pointsAwarded < 0 ? "−" : "+"}
              </div>
              <div className="activity-copy">
                <strong>{c.taskName}</strong>
                <p>
                  {[
                    c.subject,
                    c.event,
                    c.quantity > 1 ? `${c.quantity}×` : "",
                    c.variant,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {c.note && <p className="note">{c.note}</p>}
                <time dateTime={c.completedAt}>
                  {new Date(c.completedAt).toLocaleString("nl-BE", {
                    timeZone: "Europe/Brussels",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
              </div>
              <div className="activity-actions">
                <strong
                  className={
                    c.pointsAwarded < 0 ? "negative-text" : "positive-text"
                  }
                >
                  {signed(c.pointsAwarded)}
                </strong>
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "undo", completion: c })}
                >
                  Terugdraaien
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="tasks-area">
          <div className="section-heading">
            <div>
              <h3>Opdrachten</h3>
              <p className="muted">
                Kies een opdracht en controleer de punten.
              </p>
            </div>
            <button
              className="secondary small"
              onClick={() => setModal({ type: "custom" })}
            >
              + Eigen opdracht
            </button>
          </div>
          <label className="search">
            <span>⌕</span>
            <input
              type="search"
              aria-label="Zoek opdrachten"
              placeholder="Zoek een opdracht…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="filters" aria-label="Opdrachtenfilter">
            {["Alle", "Beschikbaar", "Voltooid", "Wekelijks", "Eigen"].map(
              (f) => (
                <button
                  key={f}
                  aria-pressed={filter === f}
                  className={filter === f ? "active" : ""}
                  onClick={() => setFilter(f)}
                >
                  {f}
                </button>
              )
            )}
          </div>
          <p className="result-count">
            {shown.length} opdrachten{" "}
            {filter === "Voltooid" ? "met een registratie" : ""}
          </p>
          <div className="task-list">
            {shown.map((t) => {
              const isBlocked = blocked(t, completions);
              return (
                <article
                  className={`task-card ${isBlocked ? "done" : ""}`}
                  key={t._id}
                >
                  <button
                    className="task-select"
                    disabled={isBlocked}
                    onClick={() => setModal({ type: "completion", task: t })}
                  >
                    <span
                      className={`task-icon ${isBlocked ? "complete" : ""}`}
                    >
                      {isBlocked
                        ? "✓"
                        : t.repeatRule.type === "weekly"
                          ? "↻"
                          : t.repeatRule.type === "person"
                            ? "♙"
                            : "◇"}
                    </span>
                    <span className="task-copy">
                      <strong>{t.name}</strong>
                      <span className="task-meta">
                        {repeatLabel(t)}
                        {t.ownerSchachtId ? " · Eigen opdracht" : ""}
                        {isBlocked
                          ? " · " +
                            (t.repeatRule.type === "weekly"
                              ? "Deze week voltooid"
                              : "Voltooid")
                          : ""}
                      </span>
                    </span>
                    <span
                      className={`task-points ${t.points < 0 ? "negative-text" : ""}`}
                    >
                      {pointsLabel(t)}
                      <small>
                        punten
                        {t.repeatRule.type === "quantity" ? " / stuk" : ""}
                      </small>
                    </span>
                    <span className="task-chevron">
                      {isBlocked ? "✓" : "›"}
                    </span>
                  </button>
                  {t.ownerSchachtId && (
                    <button
                      className="text-button custom-delete"
                      aria-label={`Verwijder eigen opdracht ${t.name}`}
                      onClick={() => setModal({ type: "deleteTask", task: t })}
                    >
                      Verwijder eigen opdracht
                    </button>
                  )}
                </article>
              );
            })}
          </div>
          {!shown.length && (
            <div className="empty">
              <h3>Geen opdrachten gevonden</h3>
              <p>Probeer een andere zoekterm of filter.</p>
            </div>
          )}
        </div>
      )}
      {modal?.type === "completion" && (
        <CompletionDialog
          task={modal.task}
          schacht={schacht}
          contexts={contexts}
          completions={completions}
          onClose={() => setModal(null)}
          onSaved={saved}
          onContexts={(context) =>
            setContexts((c) => [
              ...c.filter((x) => x._id !== context._id),
              context,
            ])
          }
        />
      )}
      {modal?.type === "custom" && (
        <CustomDialog
          schacht={schacht}
          onClose={() => setModal(null)}
          onSaved={saved}
        />
      )}
      {modal?.type === "undo" && (
        <ConfirmDialog
          title="Registratie terugdraaien?"
          message={`“${modal.completion.taskName}” wordt uit de activiteit verwijderd. De score van ${schacht.name} verandert met ${signed(-modal.completion.pointsAwarded)} punten naar ${schacht.points - modal.completion.pointsAwarded}.`}
          confirmLabel="Registratie terugdraaien"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api.delete(`/api/completions/${modal.completion._id}`);
            setModal(null);
            await Promise.all([load(), onRefresh()]);
            toast.success("Registratie teruggedraaid");
          }}
        />
      )}
      {modal?.type === "deleteTask" && (
        <ConfirmDialog
          title="Eigen opdracht verwijderen?"
          message={`“${modal.task.name}” en alle registraties worden verwijderd. De score verandert met ${signed(-customPoints)} punten.`}
          confirmLabel="Opdracht verwijderen"
          onClose={() => setModal(null)}
          onConfirm={async () => {
            await api.delete(`/api/custom-tasks/${modal.task._id}`);
            setModal(null);
            await Promise.all([load(), onRefresh()]);
          }}
        />
      )}
      {modal?.type === "deleteSchacht" && (
        <ConfirmDialog
          title="Schacht verwijderen?"
          message={`${schacht.name}, de ${completions.length} registraties, ${schacht.points} punten en alle eigen opdrachten worden definitief verwijderd.`}
          typedName={schacht.name}
          confirmLabel="Schacht verwijderen"
          onClose={() => setModal(null)}
          onConfirm={() => onDelete(schacht._id)}
        />
      )}
    </section>
  );
}
