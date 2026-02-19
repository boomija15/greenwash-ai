export default function RiskMeter({ score = 0 }) {
  const color = score < 20 ? "#22c55e" : score < 50 ? "#f59e0b" : "#ef4444";
  const label = score < 20 ? "VERIFIED" : score < 50 ? "REVIEW REQUIRED" : "GREENWASHED";
  const deg   = (score / 100) * 180 - 90;
  const rad   = (deg - 90) * Math.PI / 180;

  return (
    <div style={{ textAlign: "center" }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        <defs>
          <linearGradient id="mg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#22c55e" />
            <stop offset="50%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path d="M15 90 A75 75 0 0 1 165 90" fill="none" stroke="#1e293b"      strokeWidth="14" strokeLinecap="round" />
        <path d="M15 90 A75 75 0 0 1 165 90" fill="none" stroke="url(#mg)"     strokeWidth="10" strokeLinecap="round" />
        <line
          x1="90" y1="90"
          x2={90 + 55 * Math.cos(rad)}
          y2={90 + 55 * Math.sin(rad)}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          style={{ transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}
        />
        <circle cx="90" cy="90" r="5" fill="white" />
        <text x="90" y="68" textAnchor="middle" fill={color}
          fontSize="20" fontWeight="bold" fontFamily="monospace">{score}</text>
      </svg>
      <div style={{ color, fontWeight: 800, fontSize: "0.75rem",
        letterSpacing: "0.12em", marginTop: "-0.3rem" }}>{label}</div>
    </div>
  );
}