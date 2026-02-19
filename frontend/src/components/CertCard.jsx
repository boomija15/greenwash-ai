const CFG = {
  VERIFIED:      { icon: "✓", color: "#22c55e", label: "VERIFIED"       },
  NOT_FOUND:     { icon: "✗", color: "#ef4444", label: "NOT FOUND"      },
  EXPIRED:       { icon: "⚠", color: "#f59e0b", label: "EXPIRED"        },
  SCOPE_MISMATCH:{ icon: "⊘", color: "#f97316", label: "SCOPE MISMATCH" },
};

export default function CertCard({ result }) {
  const c = CFG[result.status] || CFG.NOT_FOUND;
  return (
    <div style={{
      background: "#0f172a",
      border: `1px solid ${c.color}33`, borderLeft: `3px solid ${c.color}`,
      borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "0.5rem"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: 700, color: "white", fontSize: "0.82rem" }}>{result.cert}</span>
        <span style={{ color: c.color, fontWeight: 800, fontSize: "0.72rem" }}>
          {c.icon} {c.label}
        </span>
      </div>
      <div style={{ color: "#94a3b8", fontSize: "0.72rem", marginTop: "0.25rem" }}>{result.reason}</div>
      {result.certificate_number &&
        <div style={{ color: "#475569", fontSize: "0.68rem", marginTop: "0.15rem" }}>
          Cert #: {result.certificate_number}
        </div>}
      {result.expiry_warning &&
        <div style={{ color: "#f59e0b", fontSize: "0.68rem", marginTop: "0.15rem" }}>
          ⚠ {result.expiry_warning}
        </div>}
    </div>
  );
}