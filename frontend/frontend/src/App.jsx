import { useState } from "react";
import SubmitPage    from "./pages/SubmitPage";
import ResultPage    from "./pages/ResultPage";
import RegulatorPage from "./pages/RegulatorPage";

const TABS = [
  { key: "submit",    label: "🔍 Submit Product"  },
  { key: "result",    label: "📊 Analysis Result" },
  { key: "regulator", label: "🏛 Regulator View"  },
];

export default function App() {
  const [tab, setTab]       = useState("submit");
  const [result, setResult] = useState(null);

  const handleResult = (data) => { setResult(data); setTab("result"); };

  return (
    <div style={{ minHeight: "100vh", background: "#020817" }}>

      {/* ── Header ── */}
      <header style={{
        background: "linear-gradient(135deg,#0a0f1e,#0d1b2a)",
        borderBottom: "1px solid #10b98122",
        padding: "1.1rem 2rem",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
          <div style={{
            width: 38, height: 38,
            background: "linear-gradient(135deg,#10b981,#059669)",
            borderRadius: 9, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 19
          }}>🌿</div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "white",
              fontFamily: "Syne,sans-serif", letterSpacing: "-0.02em" }}>
              GreenWatch AI
            </div>
            <div style={{ fontSize: "0.6rem", color: "#10b981", letterSpacing: "0.12em" }}>
              BIODIVERSITY CLAIM INTEGRITY SYSTEM
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            { label: "SDG GOAL 15 · LIFE ON LAND", bg: "#064e3b", border: "#10b981", color: "#10b981" },
            { label: "MVP v0.1",                   bg: "#1e1b4b", border: "#818cf8", color: "#818cf8" },
          ].map(({ label, bg, border, color }) => (
            <span key={label} style={{
              background: bg, border: `1px solid ${border}`, color,
              fontSize: "0.65rem", fontWeight: 700,
              padding: "0.3rem 0.7rem", borderRadius: 999, letterSpacing: "0.07em"
            }}>{label}</span>
          ))}
        </div>
      </header>

      {/* ── Nav ── */}
      <nav style={{ display: "flex", gap: "0.3rem", padding: "1rem 2rem 0", borderBottom: "1px solid #1e293b" }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? "#10b981" : "transparent",
            color:      tab === key ? "#020817" : "#64748b",
            border: "none", padding: "0.5rem 1.1rem",
            borderRadius: "6px 6px 0 0", fontSize: "0.72rem",
            fontWeight: 700, cursor: "pointer",
            letterSpacing: "0.04em", transition: "all 0.2s"
          }}>{label}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", paddingBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#334155" }}>
            backend: <span style={{ color: "#10b981" }}>localhost:8000</span>
          </span>
        </div>
      </nav>

      {/* ── Pages ── */}
      <main style={{ padding: "1.5rem 2rem", maxWidth: 1200, margin: "0 auto" }}>
        {tab === "submit"    && <SubmitPage    onResult={handleResult} />}
        {tab === "result"    && <ResultPage    result={result} />}
        {tab === "regulator" && <RegulatorPage />}
      </main>
    </div>
  );
}   