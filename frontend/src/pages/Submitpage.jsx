import { useState, useEffect } from "react";
import { analyzeProduct, analyzeLive } from "../services/api";
import ClaimBadge from "../components/ClaimBadge";

const CERT_OPTIONS = ["FSC", "PEFC", "Rainforest Alliance", "ISO 14001", "CITES", "TNFD", "Carbon Trust"];
const CATEGORIES = ["timber", "textiles", "cosmetics", "food", "agriculture", "furniture", "paper", "personal care", "packaging", "leather", "wildlife products"];

const s = {
  card: { background: "#0a0f1e", border: "1px solid #1e293b", borderRadius: "12px", padding: "1.2rem" },
  title: { fontSize: "0.68rem", fontWeight: 800, color: "#10b981", letterSpacing: "0.12em", marginBottom: "1rem", textTransform: "uppercase" },
  label: { fontSize: "0.7rem", color: "#94a3b8", fontWeight: 700, marginBottom: "0.3rem", display: "block", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "0.6rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "0.9rem" },
  textarea: { width: "100%", background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "0.6rem 0.8rem", borderRadius: "6px", fontSize: "0.76rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", minHeight: "100px", resize: "vertical" },
  select: { width: "100%", background: "#0f172a", border: "1px solid #1e293b", color: "#e2e8f0", padding: "0.6rem 0.8rem", borderRadius: "6px", fontSize: "0.78rem", outline: "none", boxSizing: "border-box", fontFamily: "inherit", marginBottom: "0.9rem" },
  btn: { width: "100%", background: "linear-gradient(135deg, #10b981, #059669)", color: "white", border: "none", padding: "0.85rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 800, cursor: "pointer", letterSpacing: "0.06em", marginTop: "0.8rem" },
};

export default function SubmitPage({ onResult }) {
  const [form, setForm] = useState({ company: "", title: "", description: "", category: "timber", certs: [] });
  const [liveWarnings, setLiveWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live interception with debounce
  useEffect(() => {
    if (!form.description || form.description.length < 10) { setLiveWarnings([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await analyzeLive(form.description + " " + form.title);
        setLiveWarnings(res.data.warnings || []);
      } catch {
        // Silently fail on live check
      }
    }, 700);
    return () => clearTimeout(t);
  }, [form.description, form.title]);

  const toggleCert = (cert) => {
    setForm(prev => ({
      ...prev,
      certs: prev.certs.includes(cert) ? prev.certs.filter(c => c !== cert) : [...prev.certs, cert]
    }));
  };

  const handleSubmit = async () => {
    if (!form.company || !form.title || !form.description) {
      setError("Please fill in company name, product title and description.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await analyzeProduct({
        company_name: form.company,
        product_title: form.title,
        product_description: form.description,
        product_category: form.category,
        claimed_certifications: form.certs
      });
      onResult(res.data);
    } catch (err) {
      setError("Could not connect to backend. Make sure the Python server is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
      {/* Left — Form */}
      <div style={s.card}>
        <div style={s.title}>Product Claim Submission</div>

        <label style={s.label}>COMPANY NAME</label>
        <input style={s.input} placeholder="e.g. GreenWood Ltd"
          value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />

        <label style={s.label}>PRODUCT TITLE</label>
        <input style={s.input} placeholder="e.g. Sustainable Bamboo Desk"
          value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

        <label style={s.label}>PRODUCT DESCRIPTION</label>
        <textarea style={s.textarea}
          placeholder="Describe your product including any sustainability claims..."
          value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />

        {/* Live interception warnings */}
        {liveWarnings.length > 0 && (
          <div style={{ background: "#451a03", border: "1px solid #f97316", borderRadius: "6px", padding: "0.7rem", margin: "0.6rem 0" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#fb923c", marginBottom: "0.4rem" }}>
              ⚡ LIVE INTERCEPTION — {liveWarnings.length} flag{liveWarnings.length > 1 ? "s" : ""} detected as you type
            </div>
            {liveWarnings.map((w, i) => (
              <ClaimBadge key={i} claim={{ phrase: w.phrase, type: w.type }} />
            ))}
          </div>
        )}

        <label style={{ ...s.label, marginTop: "0.6rem" }}>PRODUCT CATEGORY</label>
        <select style={s.select} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <label style={s.label}>CLAIMED CERTIFICATIONS (click to toggle)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
          {CERT_OPTIONS.map(cert => (
            <button key={cert} onClick={() => toggleCert(cert)} style={{
              background: form.certs.includes(cert) ? "#10b981" : "#0f172a",
              color: form.certs.includes(cert) ? "#020817" : "#64748b",
              border: `1px solid ${form.certs.includes(cert) ? "#10b981" : "#1e293b"}`,
              borderRadius: "999px", padding: "0.25rem 0.75rem",
              fontSize: "0.7rem", fontWeight: 700, cursor: "pointer", transition: "all 0.2s"
            }}>{cert}</button>
          ))}
        </div>

        {error && <div style={{ background: "#7f1d1d", border: "1px solid #ef4444", borderRadius: "6px", padding: "0.6rem", fontSize: "0.72rem", color: "#fca5a5", marginTop: "0.5rem" }}>{error}</div>}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
          {loading ? "⏳ ANALYZING..." : "🔍 ANALYZE FOR GREENWASHING"}
        </button>
      </div>

      {/* Right — Info */}
      <div>
        <div style={s.card}>
          <div style={s.title}>How It Works</div>
          {[
            ["🔤", "Live NLP Interception", "Flags environmental claim phrases as you type, before submission"],
            ["📋", "Certification Scope Matching", "Checks if your certificate covers your specific product category — not just existence"],
            ["🌿", "SDG 15 Mapping", "Each false claim is mapped to the exact biodiversity target it undermines"],
            ["📊", "Risk Scoring", "0–100 score drives marketplace visibility — verified products get promoted"],
            ["🛡", "SME Remediation", "Flagged sellers get step-by-step certification guidance, not just penalties"],
            ["⚡", "Predictive Alerts", "Repeat offenders are flagged before their next listing goes live"],
          ].map(([icon, title, desc]) => (
            <div key={title} style={{ display: "flex", gap: "0.8rem", marginBottom: "1rem" }}>
              <span style={{ fontSize: "1.1rem", marginTop: "0.05rem" }}>{icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.76rem", color: "white" }}>{title}</div>
                <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ ...s.card, marginTop: "1rem", border: "1px solid #064e3b" }}>
          <div style={s.title}>SDG Goal 15 — Life on Land</div>
          {[
            ["15.1", "Terrestrial Ecosystem Conservation"],
            ["15.2", "Sustainable Forest Management"],
            ["15.3", "Land Degradation"],
            ["15.5", "Biodiversity Loss"],
            ["15.7", "Wildlife Trafficking"],
            ["15.c", "Species Protection"],
          ].map(([t, l]) => (
            <div key={t} style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginBottom: "0.4rem" }}>
              <span style={{ background: "#10b981", color: "white", fontSize: "0.6rem", fontWeight: 900, padding: "0.1rem 0.4rem", borderRadius: "3px" }}>{t}</span>
              <span style={{ color: "#6ee7b7", fontSize: "0.72rem" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}