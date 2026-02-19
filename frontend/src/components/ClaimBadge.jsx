const COLORS = {
  vague:           { bg: "#fef3c7", text: "#92400e", border: "#fbbf24" },
  absolute:        { bg: "#fee2e2", text: "#991b1b", border: "#f87171" },
  misleading:      { bg: "#fce7f3", text: "#9d174d", border: "#f472b6" },
  linguistic_flag: { bg: "#ede9fe", text: "#5b21b6", border: "#a78bfa" },
};

export default function ClaimBadge({ claim }) {
  const c = COLORS[claim.type] || COLORS.vague;
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      padding: "0.2rem 0.65rem", borderRadius: 999,
      fontSize: "0.7rem", fontWeight: 700,
      marginRight: "0.4rem", marginBottom: "0.4rem",
      display: "inline-block", letterSpacing: "0.03em"
    }}>
      "{claim.phrase}" · <span style={{ opacity: 0.75 }}>{claim.type}</span>
      {claim.confidence != null &&
        <span style={{ opacity: 0.6 }}> · {Math.round(claim.confidence * 100)}%</span>}
    </span>
  );
}