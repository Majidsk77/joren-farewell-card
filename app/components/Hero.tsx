"use client";

import { groupMessage } from "@/app/data/friends";

/* Rainbow letter splits for the name */
const SPECTRUM = [
  "#c084fc", // violet
  "#818cf8", // indigo
  "#38bdf8", // sky
  "#34d399", // emerald
  "#fbbf24", // amber
  "#fb923c", // orange
  "#f87171", // red
];

function RainbowText({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span
          key={i}
          style={{ color: SPECTRUM[i % SPECTRUM.length], display: "inline" }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

export default function Hero() {
  const name = groupMessage.recipientName;

  return (
    <section
      aria-label="Farewell hero"
      style={{
        position: "relative",
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "7rem 1.5rem 9rem",
        /* Deep navy — matches Coldplay Moon Music site */
        background: "#0a1628",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >

      {/* ── Rainbow prism streak — top-left, like the Coldplay site ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: "-5%",
          left: "-8%",
          width: "clamp(260px, 40vw, 540px)",
          height: "clamp(260px, 40vw, 540px)",
          background: `conic-gradient(
            from 200deg at 30% 40%,
            rgba(248,113,113,0) 0deg,
            rgba(251,146,60,0.55) 30deg,
            rgba(250,204,21,0.6) 60deg,
            rgba(74,222,128,0.55) 90deg,
            rgba(56,189,248,0.6) 120deg,
            rgba(129,140,248,0.55) 150deg,
            rgba(192,132,252,0.5) 180deg,
            rgba(248,113,113,0) 210deg
          )`,
          filter: "blur(28px)",
          transform: "rotate(-10deg)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Soft navy vignette so prism doesn't wash the text ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 75% 65% at 55% 45%, transparent 20%, rgba(10,22,40,0.72) 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

      {/* ── Stars ── */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 0,
        }}
        viewBox="0 0 1000 700"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {[
          [80,80],[200,55],[350,35],[510,70],[680,40],[820,60],[940,90],
          [60,200],[160,260],[290,220],[430,240],[580,200],[730,230],[900,210],
          [40,380],[140,420],[280,390],[440,410],[600,375],[760,400],[940,370],
          [90,530],[220,560],[380,540],[550,565],[720,535],[880,555],[980,510],
        ].map(([cx,cy],i)=>(
          <g key={i} transform={`translate(${cx},${cy})`} opacity={0.25+(i%4)*0.1}>
            <line x1="0" y1="-4" x2="0" y2="4" stroke="white" strokeWidth="0.8"/>
            <line x1="-4" y1="0" x2="4" y2="0" stroke="white" strokeWidth="0.8"/>
          </g>
        ))}
        {[
          [120,150],[250,170],[400,130],[560,155],[710,125],[860,145],
          [180,320],[330,310],[490,330],[650,305],[810,320],
          [100,470],[260,490],[420,465],[590,485],[760,460],[920,480],
        ].map(([cx,cy],i)=>(
          <circle key={`d${i}`} cx={cx} cy={cy} r={1} fill="white" opacity={0.18+(i%3)*0.08}/>
        ))}
      </svg>

      {/* ════ CONTENT ════ */}
      <div style={{ position: "relative", zIndex: 10, maxWidth: 760, width: "100%" }}>

        {/* Moon phase row — ))) ● ((( */}
        <div
          aria-hidden="true"
          className="hero-reveal hero-d0"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.35rem",
            marginBottom: "2.5rem",
            fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
          }}
        >
          {["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌑"].map((m,i)=>(
            <span key={i} style={{ opacity: i === 4 ? 1 : 0.45 - Math.abs(i-4)*0.08 }}>{m}</span>
          ))}
        </div>

        {/* Eyebrow */}
        <p
          className="hero-reveal hero-d1"
          style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.6rem",
            fontWeight: 500,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            marginBottom: "1.25rem",
          }}
        >
          a farewell scrapbook
        </p>

        {/* Headline */}
        <h1 aria-label={`Bon Voyage, ${name}`} style={{ margin: 0 }}>
          <span
            className="hero-reveal hero-d2"
            style={{
              display: "block",
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(2.4rem, 5.2vw, 5.4rem)",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.92)",
              marginBottom: "0.1em",
            }}
          >
            Bon Voyage,
          </span>

          {/* Name — each letter a different spectrum color */}
          <span
            className="hero-reveal hero-d3"
            style={{
              display: "block",
              fontFamily: "var(--font-playfair), Georgia, serif",
              fontSize: "clamp(3.4rem, 8vw, 8rem)",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              marginBottom: 0,
            }}
          >
            <RainbowText text={name} />
          </span>
        </h1>

        {/* Handwritten cursive flourish — à la "Love is the only answer" */}
        <p
          className="hero-reveal hero-d4"
          aria-hidden="true"
          style={{
            fontFamily: "var(--font-dancing), 'Dancing Script', cursive",
            fontSize: "clamp(1rem, 2.2vw, 1.4rem)",
            color: "rgba(255,255,255,0.28)",
            marginTop: "0.75rem",
            marginBottom: "2rem",
            letterSpacing: "0.02em",
            fontStyle: "italic",
          }}
        >
          the adventure continues ✦
        </p>

        {/* Celestial symbol row — ♡ ∞ ○ ☽ */}
        <div
          className="hero-reveal hero-d5"
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            marginBottom: "2.75rem",
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
          }}
        >
          {[
            { symbol: "♡", color: "#f87171" },
            { symbol: "∞", color: "rgba(255,255,255,0.35)" },
            { symbol: "○", color: "#34d399" },
            { symbol: "☽", color: "#fbbf24" },
          ].map(({ symbol, color }) => (
            <span key={symbol} style={{ color, opacity: 0.8 }}>{symbol}</span>
          ))}
        </div>

        {/* CTA */}
        <div className="hero-reveal hero-d6">
          <button
            onClick={() =>
              document.getElementById("cards")?.scrollIntoView({ behavior: "smooth" })
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.875rem",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.9)",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 9999,
              padding: "0.85rem 2.25rem",
              minHeight: 48,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "background 0.18s, border-color 0.18s, transform 0.14s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.14)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.32)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            onFocus={(e) => {
              e.currentTarget.style.outline = "2px solid rgba(255,255,255,0.5)";
              e.currentTarget.style.outlineOffset = "4px";
            }}
            onBlur={(e) => { e.currentTarget.style.outline = "none"; }}
          >
            Open the Card
            <span aria-hidden="true" style={{ fontSize: "1rem" }}>→</span>
          </button>
        </div>

      </div>

      {/* ── Scroll indicator ── */}
      <div
        aria-hidden="true"
        className="hero-reveal"
        style={{
          animationDelay: "1350ms",
          position: "absolute",
          bottom: "2.5rem",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.6rem",
          zIndex: 10,
        }}
      >
        <div style={{
          width: 1, height: 48,
          background: "rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden",
          borderRadius: 1,
        }}>
          <div className="scroll-sweep" style={{
            position: "absolute",
            top: 0, left: 0, right: 0, height: "55%",
            background: "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.6) 100%)",
          }} />
        </div>
        <span style={{
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          fontSize: "0.55rem",
          fontWeight: 500,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.2)",
        }}>
          scroll
        </span>
      </div>

    </section>
  );
}
