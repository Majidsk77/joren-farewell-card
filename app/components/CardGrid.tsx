import FriendCard from "./FriendCard";
import FadeIn from "./FadeIn";
import type { Card } from "@/lib/supabase/types";

interface CardGridProps {
  cards: Card[];
}

export default function CardGrid({ cards }: CardGridProps) {
  return (
    <section
      id="cards"
      style={{
        backgroundColor: "var(--bg-light)",
        padding: "6rem 1.25rem 7rem",
      }}
    >
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>

        {/* ── Editorial section header ── */}
        <FadeIn style={{ textAlign: "center", marginBottom: "5rem" }}>

          {/* Eyebrow */}
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.65rem",
            fontWeight: 700,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "#c97d7d",
            marginBottom: "1.25rem",
          }}>
            From your circle
          </p>

          {/* Headline with styled "&" */}
          <h2 style={{
            fontFamily: "var(--font-playfair), Georgia, serif",
            fontSize: "clamp(2.2rem, 5vw, 4.25rem)",
            fontWeight: 700,
            lineHeight: 1.18,
            letterSpacing: "-0.02em",
            color: "#111",
            marginBottom: "1.5rem",
          }}>
            Messages of friendship,{" "}
            <br />
            memories{" "}
            <span style={{
              background: "linear-gradient(135deg, #f59e0b 0%, #db2777 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              &amp;
            </span>
            {" "}love
          </h2>

          {/* Decorative rule */}
          <div style={{
            width: 32,
            height: 2,
            borderRadius: 2,
            background: "#c97d7d",
            margin: "0 auto 1.75rem",
          }} />

          {/* Subtitle */}
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.9375rem",
            color: "#666",
            lineHeight: 1.65,
            maxWidth: 460,
            margin: "0 auto",
          }}>
            A collection of notes, memories and songs from the people
            who&apos;ll always be in your corner.
          </p>
        </FadeIn>

        {/* ── "MESSAGES" label above grid ── */}
        <FadeIn>
          <p style={{
            fontFamily: "var(--font-inter), system-ui, sans-serif",
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#bbb",
            marginBottom: "1.25rem",
          }}>
            Messages
          </p>
        </FadeIn>

        {/* ── Cards ── */}
        {cards.length > 0 ? (
          <div className="cards-grid">
            {cards.map((card, i) => (
              <FadeIn key={card.id} delay={i * 60}>
                <FriendCard card={card} index={i} />
              </FadeIn>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "5rem 0" }}>
            <div style={{ fontSize: 40, marginBottom: "1rem", opacity: 0.4 }}>🌸</div>
            <p style={{
              fontFamily: "var(--font-inter), system-ui, sans-serif",
              fontSize: "0.9375rem",
              color: "#999",
            }}>
              Cards are on their way — check back soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
