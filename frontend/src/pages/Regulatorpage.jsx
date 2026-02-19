import { useState, useEffect } from "react";
import { getEarlyAlerts, getAllSubmissions, getPlatformStats } from "../services/api";

const s = {
  card: { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.2rem", marginBottom: "1rem" },
  title: { fontSize: "0.68rem", fontWeight: 800, color: "#10b981", letterSpacing: "0.12em", marginBottom: "1rem", textTransform: "uppercase" },
  pill: (v) => ({
    background: v === "VERIFIED" ? "#14532d" : v === "REVIEW_REQUIRED" ? "#78350f" : "#7f1d1d",
    color: v === "VERIFIED" ? "#86efac" : v === "REVIEW_REQUIRED" ? "#fcd34d" : "#fca5a5",
    fontSize: "0.62rem", fontWeight: 800, padding: "0.15rem 0.55rem",
    borderRadius: "999px", letterSpacing: "0.05em", whiteSpace: "nowrap"
  })
};

export default function RegulatorPage() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, sub] = await Promise.all([getPlatformStats(), getEarlyAlerts(), getAllSubmissions()]);
        setStats(s.data);
        setAlerts(a.data.alerts || []);
        setSubmissions(sub.data.submissions || []);
      } catch {
        // Backend not yet populated — show empty state
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "#475569" }}>
      <div className="pulse" style={{ fontSize: "2rem" }}>⏳</div>
      <div style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}>Loading regulator data...</div>
    </div>
  );

  const statCards = [
    { label: "Total Scanned", value: stats?.total_scanned ?? 0, color: "#60a5fa" },
    { label: "Greenwashed", value: stats?.greenwashed ?? 0, color: "#f87171" },
    { label: "Under Review", value: stats?.under_review ?? 0, color: "#fbbf24" },
    { label: "Verified", value: stats?.verified ?? 0, color: "#34d399" },
    { label: "High Risk Sellers", value: stats?.high_risk_sellers ?? 0, color: "#f472b6" },
    { label: "Avg Risk Score", value: stats?.avg_risk_score ?? 0, color: "#a78bfa" },
  ];

  return (
    <div className="fade-in">
      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "0.8rem", marginBottom: "1.2rem" }}>
        {statCards.map(({ label, value, color }) => (
          <div key={label} style={{ ...s.card, textAlign: "center", border: `1px solid ${color}33`, marginBottom: 0 }}>
            <div style={{ fontSize: "1.8rem", fontWeight: 900, color }}>{value}</div>
            <div style={{ fontSize: "0.62rem", color: "#475569", fontWeight: 700, letterSpacing: "0.06em", marginTop: "0.2rem" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Early Alerts */}
      <div style={s.card}>
        <div style={s.title}>⚡ Predictive Early Alerts — High Risk Sellers</div>
        {alerts.length === 0 ? (
          <div style={{ color: "#475569", fontSize: "0.76rem", textAlign: "center", padding: "1.5rem" }}>
            No high-risk sellers detected yet. Alerts appear after repeated greenwashing submissions.
          </div>
        ) : alerts.map((alert, i) => (
          <div key={i} style={{
            background: "#0f172a",
            border: `1px solid ${alert.alert_level === "HIGH" ? "#ef444433" : "#f59e0b33"}`,
            borderLeft: `3px solid ${alert.alert_level === "HIGH" ? "#ef4444" : "#f59e0b"}`,
            borderRadius: "8px", padding: "0.9rem 1rem", marginBottom: "0.6rem"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.5rem" }}>
              <span style={{ fontWeight: 800, color: "white", fontSize: "0.85rem" }}>{alert.company}</span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ ...s.pill(alert.alert_level === "HIGH" ? "GREENWASHED" : "REVIEW_REQUIRED") }}>
                  {alert.alert_level} RISK
                </span>
                <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>
                  {alert.greenwashed_count}/{alert.total_submissions} submissions flagged
                </span>
              </div>
            </div>
            {alert.recurring_patterns?.length > 0 && (
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
                Recurring phrases: {alert.recurring_patterns.map(p => `"${p.phrase}" (×${p.occurrences})`).join(", ")}
              </div>
            )}
            <div style={{ fontSize: "0.7rem", color: "#60a5fa", fontWeight: 600 }}>
              → {alert.recommended_action}
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log */}
      <div style={s.card}>
        <div style={s.title}>Full Audit Log — All Submissions</div>
        {submissions.length === 0 ? (
          <div style={{ color: "#475569", fontSize: "0.76rem", textAlign: "center", padding: "1.5rem" }}>
            No submissions yet. Submit products via the Submit tab.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Product", "Company", "Risk Score", "Claims", "Verdict", "Submitted"].map(h => (
                    <th key={h} style={{ textAlign: "left", fontSize: "0.62rem", color: "#475569", fontWeight: 800, padding: "0.4rem 0.7rem", letterSpacing: "0.07em", borderBottom: "1px solid #1e293b" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {submissions.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #0a0f1e" }}>
                    <td style={{ padding: "0.6rem 0.7rem", fontSize: "0.76rem", color: "white", fontWeight: 600 }}>{row.product}</td>
                    <td style={{ padding: "0.6rem 0.7rem", fontSize: "0.72rem", color: "#94a3b8" }}>{row.company}</td>
                    <td style={{ padding: "0.6rem 0.7rem" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: 800, color: row.risk_score < 20 ? "#22c55e" : row.risk_score < 50 ? "#f59e0b" : "#ef4444" }}>
                        {row.risk_score}/100
                      </span>
                    </td>
                    <td style={{ padding: "0.6rem 0.7rem", fontSize: "0.72rem", color: "#64748b" }}>{row.claim_count}</td>
                    <td style={{ padding: "0.6rem 0.7rem" }}><span style={s.pill(row.verdict)}>{row.verdict?.replace("_", " ")}</span></td>
                    <td style={{ padding: "0.6rem 0.7rem", fontSize: "0.68rem", color: "#475569" }}>
                      {new Date(row.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}