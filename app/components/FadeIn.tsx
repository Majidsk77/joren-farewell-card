"use client";

import { useEffect, useRef, type ReactNode, type CSSProperties } from "react";

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  style?: CSSProperties;
}

export default function FadeIn({ children, delay = 0, className = "", style }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => el.classList.replace("fi-hidden", "fi-visible"), delay);
          observer.unobserve(el);
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.07 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`fi-hidden ${className}`} style={style}>
      {children}
    </div>
  );
}
