import RiskMeter from "../components/RiskMeter";
import ClaimBadge from "../components/ClaimBadge";
import CertCard from "../components/CertCard";
import SDGFlag from "../components/SDGFlag";
import RemediationCard from "../components/RemediationCard";

const s = {
  card: { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.2rem", marginBottom: "1rem" },
  title: { fontSize: "0.68rem", fontWeight: 800, color: "#10b981", letterSpacing: "0.12em", marginBottom: "1rem", textTransform: "uppercase" },
};

const VERDICT_CONFIG = {
  VERIFIED:        { bg: "#14532d", border: "#22c55e", color: "#22c55e", icon: "✓", label: "Claims Verified" },
  REVIEW_REQUIRED: { bg: "#78350f", border: "#f59e0b", color: "#f59e0b", icon: "⚠", label: "Review Required" },
  GREENWASHED:     { bg: "#7f1d1d", border: "#ef4444", color: "#ef4444", icon: "✗", label: "Greenwashing Detected" }
};

export default function ResultPage({ result }) {
  if (!result) {
    return (
      <div style={{ textAlign: "center", padding: "5rem 2rem", color: "#475569" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>Submit a product to see the analysis results here</div>
      </div>
    );
  }

  const verdict = result.risk_assessment?.verdict || "REVIEW_REQUIRED";
  const cfg = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.REVIEW_REQUIRED;
  const riskScore = result.risk_assessment?.risk_score ?? 0;
  const claims = result.nlp_analysis?.claims_detected ?? [];
  const redFlags = result.nlp_analysis?.red_flags ?? [];
  const certResults = result.certificate_analysis?.verification_results ?? [];
  const missingCerts = result.certificate_analysis?.missing_recommended ?? [];
  const sdgTargets = result.risk_assessment?.sdg_targets_affected ?? result.sdg_report?.targets_affected ?? [];
  const remediation = certResults.filter(c => c.status !== "VERIFIED" && c.remediation);
  const breakdown = result.risk_assessment?.score_breakdown ?? [];
  const visibility = result.risk_assessment?.visibility_impact;
  const aiRisk = result.nlp_analysis?.ai_generated_risk;
  const sellerHistory = result.seller_history;

  return (
    <div className="fade-in">
      {/* Verdict Banner */}
      <div style={{
        background: cfg.bg, border: `1px solid ${cfg.border}`,
        borderRadius: "12px", padding: "1.2rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem"
      }}>
        <div>
          <div style={{ fontSize: "0.65rem", color: cfg.color, fontWeight: 800, letterSpacing: "0.12em" }}>VERDICT</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "white", fontFamily: "Syne, sans-serif" }}>
            {cfg.icon} {cfg.label}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.3rem" }}>
            {result.product?.title} · {result.product?.company} · {result.product?.category}
          </div>
          {sellerHistory?.prior_greenwash_count > 0 && (
            <div style={{ fontSize: "0.68rem", color: "#f87171", marginTop: "0.3rem" }}>
              ⚡ Recidivism alert: {sellerHistory.prior_greenwash_count} prior greenwashing submission(s) on record
            </div>
          )}
        </div>
        <RiskMeter score={riskScore} />
      </div>

      {/* Visibility Impact */}
      {visibility && (
        <div style={{
          ...s.card,
          border: `1px solid ${visibility.action === "BOOST" ? "#22c55e33" : visibility.action === "DEMOTE" ? "#ef444433" : "#f59e0b33"}`
        }}>
          <div style={s.title}>Marketplace Visibility Impact</div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{
              background: visibility.action === "BOOST" ? "#14532d" : visibility.action === "DEMOTE" ? "#7f1d1d" : "#78350f",
              color: "white", fontWeight: 900, fontSize: "0.8rem",
              padding: "0.4rem 0.9rem", borderRadius: "6px"
            }}>{visibility.action}</div>
            <span style={{ fontWeight: 700, color: "white", fontSize: "0.82rem" }}>{visibility.adjustment}</span>
            <span style={{ color: "#94a3b8", fontSize: "0.72rem" }}>{visibility.description}</span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        {/* Left column */}
        <div>
          {/* Claims */}
          <div style={s.card}>
            <div style={s.title}>Detected Environmental Claims ({claims.length})</div>
            {claims.length === 0
              ? <div style={{ color: "#22c55e", fontSize: "0.78rem" }}>✓ No problematic claims detected</div>
              : claims.map((c, i) => <ClaimBadge key={i} claim={c} />)
            }
            {redFlags.length > 0 && (
              <div style={{ marginTop: "0.8rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#a78bfa", fontWeight: 800, marginBottom: "0.4rem", letterSpacing: "0.08em" }}>LINGUISTIC RED FLAGS</div>
                {redFlags.map((f, i) => (
                  <div key={i} style={{ fontSize: "0.7rem", color: "#c4b5fd", marginBottom: "0.25rem" }}>
                    · "{f.pattern}" — <span style={{ color: "#94a3b8" }}>{f.description}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Generated Risk */}
          {aiRisk && aiRisk.risk !== "low" && (
            <div style={{ ...s.card, border: "1px solid #7c3aed44" }}>
              <div style={s.title}>AI-Generated Content Risk</div>
              <div style={{
                display: "inline-block", background: aiRisk.risk === "high" ? "#7f1d1d" : "#78350f",
                color: aiRisk.risk === "high" ? "#fca5a5" : "#fcd34d",
                fontWeight: 800, fontSize: "0.72rem", padding: "0.2rem 0.6rem",
                borderRadius: "999px", marginBottom: "0.5rem"
              }}>{aiRisk.risk.toUpperCase()} RISK</div>
              {aiRisk.indicators.map((ind, i) => (
                <div key={i} style={{ fontSize: "0.7rem", color: "#94a3b8", marginBottom: "0.2rem" }}>· {ind}</div>
              ))}
            </div>
          )}

          {/* Certificates */}
          <div style={s.card}>
            <div style={s.title}>Certificate Verification ({certResults.length})</div>
            {certResults.length === 0
              ? <div style={{ color: "#64748b", fontSize: "0.76rem" }}>No certifications claimed for this product</div>
              : certResults.map((r, i) => <CertCard key={i} result={r} />)
            }
            {missingCerts.length > 0 && (
              <div style={{ marginTop: "0.8rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#f59e0b", fontWeight: 800, marginBottom: "0.4rem", letterSpacing: "0.08em" }}>RECOMMENDED FOR THIS CATEGORY</div>
                {missingCerts.map((m, i) => (
                  <div key={i} style={{ fontSize: "0.7rem", color: "#fcd34d", marginBottom: "0.2rem" }}>
                    · {m.cert} — <span style={{ color: "#94a3b8" }}>{m.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* SDG Flags */}
          {sdgTargets.length > 0 && (
            <div style={s.card}>
              <div style={s.title}>SDG 15 Targets Undermined</div>
              {sdgTargets.map((t, i) => <SDGFlag key={i} sdg={t} />)}
              {result.sdg_report?.regulatory_urgency && (
                <div style={{ marginTop: "0.8rem", fontSize: "0.7rem", color: "#94a3b8" }}>
                  Regulatory Urgency: <span style={{ color: "#f87171", fontWeight: 700 }}>{result.sdg_report.regulatory_urgency}</span>
                </div>
              )}
            </div>
          )}

          {/* Remediation */}
          {remediation.length > 0 && (
            <div style={s.card}>
              <div style={s.title}>🛡 SME Certification Pathway</div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", marginBottom: "0.8rem" }}>
                Your product was flagged — not penalized yet. Here's exactly what to do:
              </div>
              {remediation.map((r, i) => (
                <RemediationCard key={i} item={{ cert: r.cert, issue: r.status, ...r.remediation }} />
              ))}
            </div>
          )}

          {/* Score Breakdown */}
          <div style={s.card}>
            <div style={s.title}>Score Breakdown</div>
            {breakdown.length === 0
              ? <div style={{ color: "#22c55e", fontSize: "0.76rem" }}>No risk factors detected</div>
              : breakdown.map((b, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                  padding: "0.4rem 0", borderBottom: "1px solid #0f172a", gap: "1rem"
                }}>
                  <span style={{ fontSize: "0.7rem", color: "#94a3b8", flex: 1 }}>{b.source}</span>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#f87171", whiteSpace: "nowrap" }}>+{b.points}</span>
                </div>
              ))
            }
            <div style={{ textAlign: "right", marginTop: "0.6rem", fontWeight: 800, color: "white", fontSize: "0.82rem" }}>
              Total: {riskScore} / 100
            </div>
          </div>

          {verdict === "VERIFIED" && (
            <div style={{ ...s.card, border: "1px solid #22c55e44", textAlign: "center", padding: "2rem" }}>
              <div style={{ fontSize: "2.5rem" }}>✅</div>
              <div style={{ color: "#22c55e", fontWeight: 800, marginTop: "0.5rem" }}>All Claims Verified</div>
              <div style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "0.3rem" }}>
                Eligible for Verified Green Product badge and search ranking boost
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}