// @ts-nocheck
import { useState, useRef, useEffect, useCallback } from "react";

const ACCENT = "#FF5C35";
const BG = "#F7F4EF";
const DARK = "#1A1714";
const MID = "#6B6460";
const CARD = "#FFFFFF";
const BORDER = "#E8E2D9";

// ── CANVAS FONT HELPERS ──────────────────────────────────────────────────────
const HF = (s) => `800 ${s}px Georgia,'Times New Roman',serif`;
const BF = (s) => `${s}px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`;
const LF = (s) => `700 ${s}px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`;

function wrapText(ctx, text, x, y, maxW, lineH, maxLines = 99) {
  if (!text) return y;
  let cy = y, drawn = 0;
  for (const line of text.split("\n")) {
    const words = line.split(" ");
    let cur = "";
    for (const w of words) {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        if (drawn >= maxLines) return cy;
        ctx.fillText(cur, x, cy); cy += lineH; drawn++; cur = w;
      } else cur = test;
    }
    if (cur && drawn < maxLines) { ctx.fillText(cur, x, cy); cy += lineH; drawn++; }
  }
  return cy;
}

// ── SLIDE RENDERER ───────────────────────────────────────────────────────────
function renderSlide(slide, index, total) {
  const S = 1080, PAD = 72;
  const c = document.createElement("canvas");
  c.width = S; c.height = S;
  const ctx = c.getContext("2d");
  const isCover = slide.type === "cover";
  const isCTA = slide.type === "cta";

  ctx.fillStyle = isCTA ? DARK : CARD;
  ctx.fillRect(0, 0, S, S);

  ctx.fillStyle = ACCENT;
  ctx.fillRect(0, 0, S, isCover ? 10 : 6);

  ctx.font = LF(28); ctx.fillStyle = isCTA ? "#555" : MID;
  ctx.textAlign = "right";
  ctx.fillText(`${index + 1} / ${total}`, S - PAD, 80);

  if (slide.number) {
    ctx.font = HF(320); ctx.fillStyle = ACCENT;
    ctx.globalAlpha = 0.06; ctx.textAlign = "left";
    ctx.fillText(slide.number, PAD - 10, 380);
    ctx.globalAlpha = 1;
  }

  if (isCover && slide.eyebrow) {
    ctx.font = LF(28); ctx.fillStyle = ACCENT; ctx.textAlign = "left";
    ctx.fillText(slide.eyebrow, PAD, S - 340);
  }

  ctx.textAlign = "left";
  ctx.fillStyle = isCTA ? "#F7F4EF" : DARK;
  ctx.font = HF(isCover ? 86 : isCTA ? 80 : 72);
  const headY = isCover ? S - 290 : isCTA ? S / 2 - 160 : slide.number ? 320 : 200;
  const afterHead = wrapText(ctx, slide.headline, PAD, headY, S - PAD * 2, isCover ? 100 : 88, 3);

  ctx.font = BF(38); ctx.fillStyle = isCTA ? "#AAA09A" : MID;
  wrapText(ctx, slide.sub, PAD, afterHead + 40, S - PAD * 2, 58, 5);

  if (slide.tag) {
    ctx.font = LF(26); ctx.textAlign = "left";
    const tw = ctx.measureText(slide.tag).width;
    ctx.fillStyle = ACCENT + "22";
    ctx.beginPath(); ctx.roundRect(PAD, 880, tw + 48, 52, 8); ctx.fill();
    ctx.fillStyle = ACCENT; ctx.fillText(slide.tag, PAD + 24, 915);
  }
  if (slide.cta) {
    ctx.font = LF(34); ctx.fillStyle = ACCENT; ctx.textAlign = "left";
    ctx.fillText(slide.cta, PAD, 880);
  }

  ctx.strokeStyle = isCTA ? "#2a2520" : BORDER; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(PAD, S - 90); ctx.lineTo(S - PAD, S - 90); ctx.stroke();
  ctx.font = LF(26); ctx.fillStyle = isCTA ? "#4a4540" : MID; ctx.textAlign = "left";
  ctx.fillText(slide.footer || "", PAD, S - 48);

  return c;
}

// ── INFOGRAPHIC RENDERER ─────────────────────────────────────────────────────
function renderInfographic(data) {
  const W = 1080, PAD = 72;
  const pts = (data.points || []).slice(0, 6);
  const H = Math.max(1350, 340 + pts.length * 160);
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  ctx.fillStyle = CARD; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = ACCENT; ctx.fillRect(0, 0, W, 10);
  ctx.fillStyle = DARK; ctx.fillRect(0, 10, W, 220);

  ctx.font = HF(58); ctx.fillStyle = "#F7F4EF"; ctx.textAlign = "left";
  wrapText(ctx, data.title || "Your Infographic", PAD, 90, W - PAD * 2, 70, 2);
  if (data.subtitle) {
    ctx.font = BF(32); ctx.fillStyle = "#AAA09A";
    ctx.fillText(data.subtitle, PAD, 210);
  }

  const startY = 260;
  const blockH = Math.max(150, (H - startY - 100) / Math.max(pts.length, 1));

  pts.forEach((pt, i) => {
    const y = startY + i * blockH;
    ctx.fillStyle = i % 2 === 0 ? BG : CARD;
    ctx.fillRect(0, y, W, blockH);

    const cx = PAD + 36, cy = y + blockH / 2;
    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill();
    ctx.font = HF(32); ctx.fillStyle = "#fff"; ctx.textAlign = "center";
    ctx.fillText(String(i + 1), cx, cy + 11);

    ctx.font = HF(38); ctx.fillStyle = DARK; ctx.textAlign = "left";
    ctx.fillText(pt.headline || "", PAD + 90, y + 54);
    ctx.font = BF(30); ctx.fillStyle = MID;
    wrapText(ctx, pt.body || "", PAD + 90, y + 96, W - PAD * 2 - 90, 44, 2);

    if (i < pts.length - 1) {
      ctx.strokeStyle = BORDER; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PAD, y + blockH); ctx.lineTo(W - PAD, y + blockH); ctx.stroke();
    }
  });

  ctx.fillStyle = DARK; ctx.fillRect(0, H - 90, W, 90);
  ctx.font = LF(24); ctx.fillStyle = "#7A7068"; ctx.textAlign = "left";
  ctx.fillText("Angela Palsrok · Content Strategist · socialclimberpro.com", PAD, H - 32);
  if (data.source) { ctx.textAlign = "right"; ctx.fillText(data.source, W - PAD, H - 32); }

  return c;
}

// ── CANVAS PREVIEW ───────────────────────────────────────────────────────────
function CanvasPreview({ draw, width, height, style, onClick }) {
  const ref = useRef(null);
  const drawFn = useCallback(draw, [draw]);

  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    ctx.clearRect(0, 0, ref.current.width, ref.current.height);
    const src = drawFn();
    ctx.drawImage(src, 0, 0, width * 2, height * 2);
  });

  return (
    <canvas
      ref={ref}
      width={width * 2}
      height={height * 2}
      onClick={onClick}
      style={{ width, height, display: "block", cursor: onClick ? "pointer" : "default", ...style }}
    />
  );
}

function dlCanvas(canvas, filename) {
  const a = document.createElement("a");
  a.download = filename;
  a.href = canvas.toDataURL("image/png");
  a.click();
}

// ── DEFAULT SLIDE DATA ───────────────────────────────────────────────────────
const DEFAULT_SLIDES = [
  { type: "cover", number: null, headline: "Content Formats That Actually Get Reach", sub: "Most creators post. Few are strategic about format. Here's what works — and why.", footer: "Angela Palsrok · Content Strategist", eyebrow: "SWIPE TO LEARN →" },
  { type: "content", number: "01", headline: "The Story Post", sub: "First-person narrative with a turning point. Readers project themselves into your experience. High saves, high shares.", tag: "Best for: Trust & relatability", footer: "swipe →" },
  { type: "content", number: "02", headline: "The List Post", sub: "Numbered frameworks readers can act on immediately. Skimmable structure lowers friction. People decide in seconds.", tag: "Best for: Reach & saves", footer: "swipe →" },
  { type: "content", number: "03", headline: "The Contrarian Take", sub: "Challenge a commonly held belief in your niche. Triggers comments — agree or disagree, both win.", tag: "Best for: Comments & visibility", footer: "swipe →" },
  { type: "content", number: "04", headline: "The Behind-the-Scenes", sub: "Show the process, not just the outcome. Audiences reward transparency with loyalty.", tag: "Best for: Loyalty & DMs", footer: "swipe →" },
  { type: "content", number: "05", headline: "The Teaching Post", sub: "Break down one concept clearly. Lead with the insight, support with examples, close with an action.", tag: "Best for: Authority & reposts", footer: "swipe →" },
  { type: "cta", number: null, headline: "Which format is yours?", sub: "Take the quiz to find the content type that fits how you naturally think and communicate.", cta: "↓ Find your content type below", footer: "Angela Palsrok · Content Strategist" },
];

// ── CAROUSEL TAB ─────────────────────────────────────────────────────────────
function CarouselTab() {
  const [slides, setSlides] = useState(DEFAULT_SLIDES);
  const [active, setActive] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [dlAll, setDlAll] = useState(false);

  const openEdit = (i) => { setActive(i); setForm({ ...slides[i] }); setEditing(true); };
  const saveEdit = () => { const s = [...slides]; s[active] = { ...form }; setSlides(s); setEditing(false); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: MID }}>Click any slide to edit its text</div>
        <button
          onClick={() => { setDlAll(true); slides.forEach((s, i) => setTimeout(() => dlCanvas(renderSlide(s, i, slides.length), `slide-${i + 1}-of-${slides.length}.png`), i * 150)); setTimeout(() => setDlAll(false), slides.length * 150 + 500); }}
          disabled={dlAll}
          style={primaryBtn(dlAll)}
        >{dlAll ? "Saving files…" : "⬇ Download All Slides"}</button>
      </div>

      {/* Thumbnail row */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
        {slides.map((s, i) => (
          <CanvasPreview
            key={i}
            draw={() => renderSlide(s, i, slides.length)}
            width={120} height={120}
            onClick={() => openEdit(i)}
            style={{ borderRadius: 8, border: `2px solid ${active === i ? ACCENT : BORDER}`, flexShrink: 0, boxShadow: active === i ? `0 0 0 2px ${ACCENT}30` : "none" }}
          />
        ))}
      </div>

      {/* Large preview */}
      <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 10px" }}>
        <div>
          <CanvasPreview
            draw={() => renderSlide(slides[active], active, slides.length)}
            width={320} height={320}
            style={{ borderRadius: 12, border: `2px solid ${BORDER}`, boxShadow: "0 6px 20px rgba(0,0,0,0.1)" }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "center" }}>
            <button onClick={() => setActive(Math.max(0, active - 1))} disabled={active === 0} style={navBtn(active === 0)}>←</button>
            <button onClick={() => openEdit(active)} style={{ ...ghostBtn, fontSize: 12 }}>✏️ Edit this slide</button>
            <button onClick={() => dlCanvas(renderSlide(slides[active], active, slides.length), `slide-${active + 1}.png`)} style={{ ...ghostBtn, fontSize: 12 }}>⬇ Download</button>
            <button onClick={() => setActive(Math.min(slides.length - 1, active + 1))} disabled={active === slides.length - 1} style={navBtn(active === slides.length - 1)}>→</button>
          </div>
        </div>
      </div>

      {/* Edit panel */}
      {editing && (
        <div style={{ background: DARK, borderRadius: 12, padding: "20px", marginTop: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>Editing Slide {active + 1}</div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Headline</label>
            <textarea rows={2} value={form.headline || ""} onChange={e => setForm({ ...form, headline: e.target.value })} style={darkInput} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Body text</label>
            <textarea rows={3} value={form.sub || ""} onChange={e => setForm({ ...form, sub: e.target.value })} style={darkInput} />
          </div>
          {form.tag !== undefined && (
            <div style={{ marginBottom: 12 }}>
              <label style={lbl}>Tag label</label>
              <input value={form.tag || ""} onChange={e => setForm({ ...form, tag: e.target.value })} style={{ ...darkInput, height: 36 }} />
            </div>
          )}
          {form.footer !== undefined && (
            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Footer text</label>
              <input value={form.footer || ""} onChange={e => setForm({ ...form, footer: e.target.value })} style={{ ...darkInput, height: 36 }} />
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={saveEdit} style={primaryBtn(false)}>Save changes</button>
            <button onClick={() => setEditing(false)} style={ghostBtn}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ marginTop: 18, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 18px" }}>
        <div style={sectionLabel}>How to post on LinkedIn</div>
        <ol style={{ margin: 0, paddingLeft: 18, color: MID, fontSize: 12, lineHeight: 2.1 }}>
          <li>Edit any slide by clicking it, then hit <strong>Download All Slides</strong></li>
          <li>On LinkedIn, start a post and attach all downloaded images</li>
          <li>LinkedIn turns multiple images into a swipeable carousel automatically</li>
        </ol>
      </div>
    </div>
  );
}

// ── INFOGRAPHIC TAB ──────────────────────────────────────────────────────────
const DEFAULT_POINTS = [
  { headline: "A hook that earns the next line", body: "Your first sentence is a contract. Tell them exactly what they'll get." },
  { headline: "One clear idea", body: "Every post should be about exactly one thing. If you can't say it in 10 words, keep editing." },
  { headline: "Proof or specificity", body: "Vague advice is forgettable. A specific example, number, or story makes it stick." },
  { headline: "White space", body: "Short paragraphs. Line breaks between every thought. Give their eyes room to breathe." },
  { headline: "A point of view", body: "The most-shared posts have a perspective. Don't just report — conclude." },
  { headline: "A soft CTA", body: "End with a question or invitation. 'What would you add?' beats 'Follow me for more.'" },
];

function InfographicTab() {
  const [title, setTitle] = useState("The Anatomy of a High-Reach Post");
  const [subtitle, setSubtitle] = useState("6 elements every scroll-stopping post needs");
  const [source, setSource] = useState("socialclimberpro.com");
  const [points, setPoints] = useState(DEFAULT_POINTS);

  const upd = (i, f, v) => { const n = [...points]; n[i] = { ...n[i], [f]: v }; setPoints(n); };

  const data = { title, subtitle, source, points };

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      {/* Editor */}
      <div style={{ flex: "1 1 280px" }}>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={lightInput} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={lbl}>Subtitle</label>
          <input value={subtitle} onChange={e => setSubtitle(e.target.value)} style={lightInput} />
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: MID, letterSpacing: "0.08em", textTransform: "uppercase", margin: "14px 0 10px" }}>
          Points ({points.length}/6)
        </div>
        {points.map((pt, i) => (
          <div key={i} style={{ background: BG, border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px", marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>Point {i + 1}</span>
              {points.length > 1 && <button onClick={() => setPoints(points.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ccc", cursor: "pointer", fontSize: 13 }}>✕</button>}
            </div>
            <input placeholder="Headline" value={pt.headline} onChange={e => upd(i, "headline", e.target.value)} style={{ ...lightInput, marginBottom: 6 }} />
            <textarea placeholder="1–2 sentence description" rows={2} value={pt.body} onChange={e => upd(i, "body", e.target.value)} style={{ ...lightInput, resize: "vertical" }} />
          </div>
        ))}
        {points.length < 6 && (
          <button onClick={() => setPoints([...points, { headline: "", body: "" }])} style={{ width: "100%", padding: "10px", border: `1.5px dashed ${BORDER}`, borderRadius: 10, background: "none", color: MID, fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 14 }}>+ Add point</button>
        )}
        <div style={{ marginBottom: 14 }}>
          <label style={lbl}>Footer / attribution</label>
          <input value={source} onChange={e => setSource(e.target.value)} style={lightInput} />
        </div>
        <button onClick={() => dlCanvas(renderInfographic(data), "infographic.png")} style={primaryBtn(false)}>
          ⬇ Download Infographic
        </button>
      </div>

      {/* Live preview */}
      <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={sectionLabel}>Live preview</div>
        <CanvasPreview
          draw={() => renderInfographic(data)}
          width={260}
          height={325}
          style={{ borderRadius: 10, border: `1.5px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
        />
        <div style={{ fontSize: 11, color: MID, marginTop: 8, textAlign: "center" }}>Downloads at 1080px wide</div>
      </div>
    </div>
  );
}

// ── QUIZ TAB ─────────────────────────────────────────────────────────────────
const QS = [
  { q: "When you sit down to post, what comes most naturally?", opts: [{ t: "Telling something that happened to me", r: "story" }, { t: "Breaking down a concept I know well", r: "teach" }, { t: "Sharing a list of things I've learned", r: "list" }, { t: "Pushing back on advice I keep hearing", r: "contrarian" }] },
  { q: "What do you want people to feel after reading?", opts: [{ t: '"I\'ve been through that too"', r: "story" }, { t: '"I just learned something real"', r: "teach" }, { t: '"I\'m saving this for later"', r: "list" }, { t: '"Hm. I never thought of it that way"', r: "contrarian" }] },
  { q: "Which comment would excite you most?", opts: [{ t: '"This is exactly my experience right now"', r: "story" }, { t: '"I\'m sharing this with my whole team"', r: "teach" }, { t: '"Bookmarked. Incredibly useful."', r: "list" }, { t: '"Controversial but you\'re not wrong"', r: "contrarian" }] },
  { q: "How do you typically start writing a post?", opts: [{ t: "With something that happened — then the lesson", r: "story" }, { t: "With the insight — then I build around it", r: "teach" }, { t: "With the framework — then fill in the points", r: "list" }, { t: "With a belief I want to challenge", r: "contrarian" }] },
  { q: "What do you want your content to build over time?", opts: [{ t: "Deep trust — people feel like they know me", r: "story" }, { t: "Authority — I'm the expert in my niche", r: "teach" }, { t: "Utility — people come back because it's useful", r: "list" }, { t: "A strong POV — people know what I stand for", r: "contrarian" }] },
];
const RES = {
  story: { icon: "✍️", name: "The Storyteller", desc: "You build trust by making people feel seen. Your strongest posts start with a real moment and land on a lesson your audience recognizes in their own lives.", tip: "Lead with the scene, not the lesson. Drop readers into the moment first — the insight hits harder when they've lived it with you." },
  teach: { icon: "🎯", name: "The Teacher", desc: "You build authority by making complex things clear. Reposts and profile visits come from your teaching content more than anything else.", tip: "Lead with the insight, not the backstory. Give the payoff first, then the proof." },
  list: { icon: "📋", name: "The Framework Builder", desc: "You build utility. People save your content because it's immediately actionable. Readers feel like they got something concrete every time.", tip: "Make your numbers mean something. '5 tips' is forgettable. '5 things I wish I knew before year 3' is a bookmark." },
  contrarian: { icon: "⚡", name: "The Challenger", desc: "You build a POV. You see what others miss or are afraid to say — and you say it anyway. Your comment sections stay alive.", tip: "Earn the contrarian. Lead with 'here's what I used to believe' before you flip it. People respect the nuance." },
};

function QuizTab({ onResult }) {
  const [cur, setCur] = useState(0);
  const [ans, setAns] = useState([]);
  const [result, setResult] = useState(null);

  const pick = (r) => {
    const next = [...ans, r];
    if (cur < QS.length - 1) { setAns(next); setCur(cur + 1); }
    else {
      const counts = next.reduce((a, t) => ({ ...a, [t]: (a[t] || 0) + 1 }), {});
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setResult(RES[winner]);
      onResult(RES[winner]);
    }
  };

  if (result) return (
    <div style={{ background: DARK, borderRadius: 14, padding: "28px 24px", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ fontSize: 34, marginBottom: 10 }}>{result.icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Your Content Type</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#F7F4EF", marginBottom: 12, lineHeight: 1.2, fontFamily: "Georgia,serif" }}>{result.name}</div>
      <div style={{ fontSize: 14, color: "#AAA09A", lineHeight: 1.7, marginBottom: 18 }}>{result.desc}</div>
      <div style={{ background: ACCENT + "18", border: `1px solid ${ACCENT}44`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>Pro tip</div>
        <div style={{ fontSize: 13, color: "#D0C8C0", lineHeight: 1.6 }}>{result.tip}</div>
      </div>
      <button onClick={() => { setCur(0); setAns([]); setResult(null); onResult(null); }} style={ghostBtn}>Retake quiz</button>
    </div>
  );

  const q = QS[cur];
  return (
    <div style={{ background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 14, padding: "24px 20px", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {QS.map((_, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= cur ? ACCENT : BORDER, transition: "background 0.2s" }} />)}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>Question {cur + 1} of {QS.length}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: DARK, lineHeight: 1.3, marginBottom: 18, fontFamily: "Georgia,serif" }}>{q.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {q.opts.map((o, i) => (
          <button key={i} onClick={() => pick(o.r)}
            style={{ background: BG, border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer", fontSize: 13, color: DARK, fontWeight: 500, lineHeight: 1.4, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.background = ACCENT + "0d"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.background = BG; }}
          >{o.t}</button>
        ))}
      </div>
    </div>
  );
}

// ── LEAD FORM ─────────────────────────────────────────────────────────────────
function LeadForm({ quizResult }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | success | error

  const submit = async () => {
    if (!name.trim() || !email.trim()) return;
    setStatus("sending");
    try {
      const body = {
        service_id: "service_wm6bb3d",
        template_id: "template_h5csgqk",
        user_id: "t2FMvBt7GqmndavKg",
        template_params: {
          to_email: "angela@socialclimberpro.com",
          from_name: name,
          from_email: email,
          quiz_result: quizResult ? quizResult.name : "Did not take quiz",
          message: `New lead from Content Formats tool.\n\nName: ${name}\nEmail: ${email}\nContent type: ${quizResult ? quizResult.name : "n/a"}`,
        },
      };

      // Try EmailJS
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // EmailJS returns 200 on success
      if (res.ok || res.status === 200) {
        setStatus("success");
      } else {
        // Fallback: mailto link
        triggerMailto(name, email, quizResult);
        setStatus("success");
      }
    } catch {
      // Fallback: open mailto
      triggerMailto(name, email, quizResult);
      setStatus("success");
    }
  };

  const triggerMailto = (n, e, qr) => {
    const subject = encodeURIComponent("New Lead: Content Formats Tool");
    const body = encodeURIComponent(`New lead from the Content Formats tool.\n\nName: ${n}\nEmail: ${e}\nContent type: ${qr ? qr.name : "Did not take quiz"}`);
    window.open(`mailto:angela@socialclimberpro.com?subject=${subject}&body=${body}`);
  };

  if (status === "success") return (
    <div style={{ background: DARK, borderRadius: 14, padding: "32px 28px", textAlign: "center", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 40, marginBottom: 14 }}>🎉</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#F7F4EF", marginBottom: 10, fontFamily: "Georgia,serif" }}>You're in.</div>
      <div style={{ fontSize: 14, color: "#AAA09A", lineHeight: 1.7 }}>
        We'll be in touch at <strong style={{ color: "#F7F4EF" }}>{email}</strong> with access to this tool and future resources from Social Climber Pro.
      </div>
    </div>
  );

  return (
    <div style={{ background: DARK, borderRadius: 14, padding: "28px 24px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Get Free Access</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#F7F4EF", marginBottom: 8, lineHeight: 1.2, fontFamily: "Georgia,serif" }}>Keep this tool. Get the next one free.</div>
      <div style={{ fontSize: 13, color: "#AAA09A", marginBottom: 22, lineHeight: 1.6 }}>
        Drop your email and we'll send you permanent access to this tool plus every resource we release — no paywall, no bait-and-switch.
      </div>

      {quizResult && (
        <div style={{ background: ACCENT + "18", border: `1px solid ${ACCENT}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 18, fontSize: 12, color: "#D0C8C0" }}>
          {quizResult.icon} Your content type: <strong style={{ color: "#F7F4EF" }}>{quizResult.name}</strong> — we'll send resources matched to how you create.
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={{ ...lbl, color: "#7A7068" }}>Your name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="First name" style={darkInput} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ ...lbl, color: "#7A7068" }}>Email address</label>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" type="email" style={darkInput} />
      </div>
      <button
        onClick={submit}
        disabled={status === "sending" || !name.trim() || !email.trim()}
        style={{ ...primaryBtn(status === "sending" || !name.trim() || !email.trim()), width: "100%" }}
      >
        {status === "sending" ? "Sending…" : "Get free access →"}
      </button>
      <div style={{ fontSize: 11, color: "#3a3530", marginTop: 12, textAlign: "center" }}>
        No spam. Unsubscribe anytime. Your info stays with Social Climber Pro.
      </div>
    </div>
  );
}

// ── SHARED STYLES ─────────────────────────────────────────────────────────────
const primaryBtn = (disabled) => ({ background: disabled ? "#888" : ACCENT, border: "none", color: "#fff", fontWeight: 700, fontSize: 13, padding: "10px 20px", borderRadius: 9, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.6 : 1, transition: "opacity 0.2s" });
const ghostBtn = { background: "transparent", border: `1.5px solid ${BORDER}`, color: MID, fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 8, cursor: "pointer" };
const navBtn = (dis) => ({ width: 34, height: 34, borderRadius: "50%", border: `1.5px solid ${BORDER}`, background: CARD, fontSize: 14, cursor: dis ? "default" : "pointer", opacity: dis ? 0.3 : 1 });
const lbl = { display: "block", fontSize: 10, fontWeight: 700, color: MID, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 };
const sectionLabel = { fontSize: 10, fontWeight: 700, color: MID, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 };
const lightInput = { width: "100%", background: CARD, border: `1.5px solid ${BORDER}`, borderRadius: 8, color: DARK, fontSize: 13, padding: "9px 11px", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };
const darkInput = { width: "100%", background: "#0e0c0b", border: "1.5px solid #2a2520", borderRadius: 8, color: "#e8e4e0", fontSize: 13, padding: "9px 11px", boxSizing: "border-box", outline: "none", fontFamily: "inherit" };

// ── TABS CONFIG ───────────────────────────────────────────────────────────────
const TABS = [
  { id: "carousel", emoji: "📱", label: "Carousel", desc: "Build & download LinkedIn carousel slides" },
  { id: "infographic", emoji: "📊", label: "Infographic", desc: "Create a branded visual for any topic" },
  { id: "quiz", emoji: "🎯", label: "Content Type Quiz", desc: "Find which format fits how you think" },
  { id: "access", emoji: "🔓", label: "Get Free Access", desc: "Keep this tool + future resources" },
];

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [quizResult, setQuizResult] = useState(null);

  if (screen === "home") return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background: DARK, borderBottom: `4px solid ${ACCENT}`, padding: "28px 24px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>Free Resource from Social Climber Pro</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#F7F4EF", lineHeight: 1.2, marginBottom: 8, fontFamily: "Georgia,serif" }}>Content Formats That Actually Get Reach</div>
          <div style={{ fontSize: 13, color: "#7A7068" }}>Angela Palsrok · Content Strategist</div>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "30px 20px" }}>
        <div style={{ fontSize: 14, color: MID, marginBottom: 22, lineHeight: 1.6 }}>Three free tools. Pick where you want to start:</div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)}
            style={{ width: "100%", background: CARD, border: `2px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px", marginBottom: 12, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = ACCENT; e.currentTarget.style.boxShadow = `0 0 0 3px ${ACCENT}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.boxShadow = "none"; }}
          >
            <div style={{ fontSize: 26 }}>{t.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: DARK, marginBottom: 2 }}>{t.label}</div>
              <div style={{ fontSize: 12, color: MID }}>{t.desc}</div>
            </div>
            {t.id === "access" && <div style={{ background: ACCENT, color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4, letterSpacing: "0.08em" }}>FREE</div>}
            <div style={{ color: ACCENT, fontSize: 16 }}>→</div>
          </button>
        ))}
      </div>
    </div>
  );

  const currentTab = TABS.find(t => t.id === screen);

  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", paddingBottom: 60 }}>
      {/* Top nav */}
      <div style={{ background: DARK, borderBottom: `3px solid ${ACCENT}`, padding: "0 16px", display: "flex", alignItems: "center", gap: 8, overflowX: "auto" }}>
        <button onClick={() => setScreen("home")} style={{ background: "none", border: "none", color: "#7A7068", fontSize: 12, cursor: "pointer", fontWeight: 600, padding: "14px 10px", whiteSpace: "nowrap", flexShrink: 0 }}>← Home</button>
        <div style={{ width: 1, height: 14, background: "#2a2520", flexShrink: 0 }} />
        {TABS.map(t => (
          <button key={t.id} onClick={() => setScreen(t.id)}
            style={{ background: "none", border: "none", borderBottom: `2.5px solid ${screen === t.id ? ACCENT : "transparent"}`, color: screen === t.id ? "#F7F4EF" : "#7A7068", fontSize: 12, fontWeight: 700, padding: "14px 10px 12px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "color 0.15s" }}
          >{t.emoji} {t.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px 0" }}>
        {/* Section header */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: DARK, fontFamily: "Georgia,serif", marginBottom: 4 }}>{currentTab.emoji} {currentTab.label}</div>
          <div style={{ fontSize: 13, color: MID }}>{currentTab.desc}</div>
        </div>

        {screen === "carousel" && <CarouselTab />}
        {screen === "infographic" && <InfographicTab />}
        {screen === "quiz" && <QuizTab onResult={setQuizResult} />}
        {screen === "access" && <LeadForm quizResult={quizResult} />}

        {/* SCP CTA banner (shown on all tool tabs) */}
        {screen !== "access" && screen !== "home" && (
          <div style={{ marginTop: 32, background: DARK, borderRadius: 14, padding: "22px 22px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#F7F4EF", marginBottom: 4, fontFamily: "Georgia,serif" }}>Want more tools like this — free?</div>
              <div style={{ fontSize: 12, color: "#7A7068", lineHeight: 1.5 }}>Drop your email and we'll keep you in the loop. No paywall, ever.</div>
            </div>
            <button onClick={() => setScreen("access")} style={{ ...primaryBtn(false), whiteSpace: "nowrap" }}>Get free access →</button>
          </div>
        )}
      </div>
    </div>
  );
}