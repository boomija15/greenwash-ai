export default function RemediationCard({ item }) {
  return (
    <div style={{
      background: "#0f172a",
      border: "1px solid #1e40af44", borderLeft: "3px solid #3b82f6",
      borderRadius: 8, padding: "1rem", marginBottom: "0.7rem"
    }}>
      <div style={{ fontWeight: 800, color: "#60a5fa", fontSize: "0.8rem", marginBottom: "0.35rem" }}>
        {item.cert} — {item.issue?.replace(/_/g, " ")}
      </div>
      {item.action &&
        <div style={{ color: "#e2e8f0", fontSize: "0.78rem", marginBottom: "0.5rem", fontWeight: 600 }}>
          → {item.action}
        </div>}
      {item.description &&
        <div style={{ color: "#94a3b8", fontSize: "0.72rem", marginBottom: "0.6rem" }}>
          {item.description}
        </div>}
      {item.steps && (
        <div style={{ marginBottom: "0.6rem" }}>
          {item.steps.map((step, i) => (
            <div key={i} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span style={{ color: "#3b82f6", fontWeight: 800, fontSize: "0.7rem", minWidth: 16 }}>{i + 1}.</span>
              <span style={{ color: "#cbd5e1", fontSize: "0.72rem" }}>{step}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: "1.2rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
        {item.timeline && <span style={{ color: "#34d399", fontSize: "0.7rem" }}>⏱ {item.timeline}</span>}
        {item.cost_tier && <span style={{ color: "#fbbf24", fontSize: "0.7rem" }}>💰 {item.cost_tier}</span>}
        {item.url &&
          <a href={item.url} target="_blank" rel="noreferrer"
            style={{ color: "#818cf8", fontSize: "0.7rem", textDecoration: "none" }}>
            🔗 Apply here ↗
          </a>}
      </div>
    </div>
  );
}   