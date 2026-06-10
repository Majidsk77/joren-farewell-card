import FadeIn from "./FadeIn";
import { groupMessage } from "@/app/data/friends";

interface GroupMessageProps {
  names?: string[];
}

const SPECTRUM = [
  "#c084fc","#818cf8","#38bdf8","#34d399","#fbbf24","#fb923c","#f87171",
];

function RainbowText({ text }: { text: string }) {
  return (
    <>
      {text.split("").map((ch, i) => (
        <span key={i} style={{ color: SPECTRUM[i % SPECTRUM.length] }}>
          {ch}
        </span>
      ))}
    </>
  );
}

export default function GroupMessage({ names }: GroupMessageProps) {
  const approvedNames = names && names.length > 0 ? names : [];
  const paragraphs = groupMessage.body.split("\n\n").filter(Boolean);

  const messageCountLabel =
    approvedNames.length === 0
      ? null
      : approvedNames.length === 1
      ? "1 message"
      : `${approvedNames.length} messages from your circle`;

  return (
    <section
      style={{
        position: "relative",
        background: "#0a1628",
        padding: "8rem 1.5rem 7rem",
        overflow: "hidden",
      }}
    >
      {/* ── Rainbow prism — bottom-right mirror of hero top-left ── */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-10%",
          width: "clamp(240px, 38vw, 500px)",
          height: "clamp(240px, 38vw, 500px)",
          background: `conic-gradient(
            from 20deg at 70% 60%,
            rgba(248,113,113,0) 0deg,
            rgba(251,146,60,0.5) 30deg,
            rgba(250,204,21,0.55) 60deg,
            rgba(74,222,128,0.5) 90deg,
            rgba(56,189,248,0.55) 120deg,
            rgba(129,140,248,0.5) 150deg,
            rgba(192,132,252,0.45) 180deg,
            rgba(248,113,113,0) 210deg
          )`,
          filter: "blur(32px)",
          transform: "rotate(15deg)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Night sky stars ── */}
      <svg
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {[
          [60,40],[160,70],[300,25],[450,55],[610,20],[760,50],[910,30],[980,80],
          [30,150],[120,200],[250,165],[380,185],[530,145],[680,170],[840,150],[970,190],
          [70,290],[180,330],[320,295],[470,315],[630,280],[790,305],[940,270],
          [50,420],[170,455],[310,425],[460,445],[620,410],[780,440],[930,400],
          [100,540],[240,565],[390,535],[550,558],[710,525],[870,548],[980,510],
        ].map(([cx,cy],i)=>(
          <g key={i} transform={`translate(${cx},${cy})`} opacity={0.18+(i%5)*0.07}>
            <line x1="0" y1="-3.5" x2="0" y2="3.5" stroke="white" strokeWidth="0.75"/>
            <line x1="-3.5" y1="0" x2="3.5" y2="0" stroke="white" strokeWidth="0.75"/>
          </g>
        ))}

        {/* Dot stars */}
        {[
          [200,100],[360,130],[500,90],[660,115],[800,85],[940,120],
          [140,250],[290,235],[440,255],[600,225],[750,245],[900,215],
          [110,380],[260,400],[420,375],[580,395],[740,370],[900,390],
        ].map(([cx,cy],i)=>(
          <circle key={`d${i}`} cx={cx} cy={cy} r={0.9} fill="white" opacity={0.15+(i%4)*0.07}/>
        ))}

        {/* Moon phase arc — decorative orbit */}
        <ellipse cx="500" cy="300" rx="400" ry="90"
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none"
          strokeDasharray="5 10"/>

        {/* Small orbit ring — top right */}
        <ellipse cx="850" cy="70" rx="60" ry="24"
          stroke="rgba(251,191,36,0.14)" strokeWidth="1" fill="none"
          transform="rotate(-12,850,70)"/>

        {/* Rainbow spectrum dots — bottom strip */}
        {[
          {cx:120,cy:560,fill:"#f87171"},
          {cx:220,cy:572,fill:"#fb923c"},
          {cx:330,cy:558,fill:"#fbbf24"},
          {cx:440,cy:568,fill:"#86efac"},
          {cx:560,cy:555,fill:"#38bdf8"},
          {cx:670,cy:566,fill:"#818cf8"},
          {cx:780,cy:554,fill:"#c084fc"},
          {cx:880,cy:564,fill:"#f472b6"},
        ].map(({cx,cy,fill},i)=>(
          <circle key={`rb${i}`} cx={cx} cy={cy} r={2.8} fill={fill} opacity={0.4}/>
        ))}
      </svg>

      {/* ── Top hairline ── */}
      <div aria-hidden="true" style={{
        position: "absolute",
        top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
      }} />

      <div style={{
        maxWidth: 680,
        margin: "0 auto",
        textAlign: "center",
        position: "relative",
        zIndex: 1,
      }}>

        {/* Moon phase row */}
        <FadeIn>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.3rem",
            fontSize: "clamp(1rem, 2.2vw, 1.35rem)",
            marginBottom: "2.5rem",
          }}>
            {["🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌑"].map((m,i)=>(
              <span key={i} style={{ opacity: i === 4 ? 1 : 0.4 - Math.abs(i-4)*0.07 }}>{m}</span>
            ))}
          </div>
        </FadeIn>

        {/* Title — rainbow letters */}
        <FadeIn delay={80}>
          <h2 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(2.4rem, 7vw, 4.25rem)",
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: "2.5rem",
            letterSpacing: "-0.01em",
          }}>
            <RainbowText text={groupMessage.title} />
          </h2>
        </FadeIn>

        {/* Body paragraphs */}
        {paragraphs.map((para, i) => (
          <FadeIn key={i} delay={160 + i * 80}>
            <p style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "clamp(1rem, 2.4vw, 1.125rem)",
              lineHeight: 1.9,
              color: "rgba(255,255,255,0.62)",
              marginBottom: "1.25rem",
            }}>
              {para}
            </p>
          </FadeIn>
        ))}

        {/* Divider */}
        <FadeIn delay={320}>
          <div style={{
            width: 48, height: 1,
            background: "rgba(255,255,255,0.12)",
            margin: "2.5rem auto",
          }} />
        </FadeIn>

        {/* Celestial symbols */}
        <FadeIn delay={360}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1.5rem",
            marginBottom: "2rem",
            fontSize: "1.2rem",
          }}>
            {[
              { symbol: "♡", color: "#f87171" },
              { symbol: "∞", color: "rgba(255,255,255,0.3)" },
              { symbol: "○", color: "#34d399" },
              { symbol: "☽", color: "#fbbf24" },
            ].map(({ symbol, color }) => (
              <span key={symbol} style={{ color, opacity: 0.85 }}>{symbol}</span>
            ))}
          </div>
        </FadeIn>

        {/* Signatories — only if approved messages exist */}
        {approvedNames.length > 0 && (
          <FadeIn delay={400}>
            <p style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.6rem",
              fontWeight: 600,
              letterSpacing: "0.25em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "1rem",
            }}>
              With all our love
            </p>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1.25rem",
            }}>
              {approvedNames.map((n) => (
                <span key={n} style={{
                  fontFamily: "var(--font-inter), system-ui, sans-serif",
                  fontSize: "0.8125rem",
                  color: "rgba(255,255,255,0.7)",
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 9999,
                  padding: "0.3rem 0.875rem",
                }}>
                  {n}
                </span>
              ))}
            </div>

            {messageCountLabel && (
              <p style={{
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                fontSize: "0.65rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.18)",
              }}>
                {messageCountLabel}
              </p>
            )}
          </FadeIn>
        )}

        {/* Handwritten closing — like "Love is the only answer" */}
        <FadeIn delay={460}>
          <p style={{
            marginTop: "3rem",
            fontFamily: "var(--font-dancing), 'Dancing Script', cursive",
            fontSize: "clamp(1.2rem, 2.5vw, 1.6rem)",
            fontStyle: "italic",
            color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.02em",
            lineHeight: 1.6,
          }}>
            every star up there knows your name ✦
          </p>
          <p style={{
            marginTop: "1.5rem",
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.65rem",
            color: "rgba(255,255,255,0.12)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Made with love ✦ a digital scrapbook
          </p>
        </FadeIn>

      </div>
    </section>
  );
}
