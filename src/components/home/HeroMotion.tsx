"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

export function HeroMotion({ children }: { children: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      const media = gsap.matchMedia();
      media.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".hero-line > span", {
          yPercent: 115,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
        });

        gsap.from(".hero-fade", {
          autoAlpha: 0,
          y: 18,
          duration: 0.65,
          stagger: 0.07,
          delay: 0.2,
          ease: "power2.out",
        });

        gsap.from(".collage-piece", {
          autoAlpha: 0,
          y: 26,
          scale: 0.96,
          duration: 0.7,
          stagger: 0.09,
          delay: 0.3,
          ease: "back.out(1.4)",
        });

        ScrollTrigger.batch(".reveal", {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.from(batch, {
              autoAlpha: 0,
              y: 22,
              duration: 0.65,
              stagger: 0.08,
              ease: "power2.out",
            }),
        });
      });

      return () => media.revert();
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
