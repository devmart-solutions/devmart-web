"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * Muestra su contenido con un fundido y desplazamiento al entrar en pantalla.
 * `retraso` (ms) escalona varios elementos seguidos. Sin JS o con movimiento reducido se ve tal cual.
 */
export function Revelar({
  children,
  retraso = 0,
  como: Tag = "div",
  className = "",
}: {
  children: ReactNode;
  retraso?: number;
  como?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.revelar = "oculto";
    const io = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.dataset.revelar = "visible";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`revelar ${className}`} style={{ "--retraso": `${retraso}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}
