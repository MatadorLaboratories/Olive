"use client";

import { useEffect } from "react";

/**
 * Mounts a single IntersectionObserver that flips `is-revealed` on every
 * `[data-reveal]` element when it enters the viewport.
 *
 * Pair with the CSS in `globals.css` (`[data-reveal] { opacity: 0; … }`).
 *
 * Honours `prefers-reduced-motion: reduce` (the CSS already shows the element).
 */
export function Reveal() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      // Reveal everything immediately.
      document
        .querySelectorAll<HTMLElement>("[data-reveal]")
        .forEach((el) => el.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );

    const elements = document.querySelectorAll<HTMLElement>(
      "[data-reveal]:not(.is-revealed)",
    );
    elements.forEach((el) => observer.observe(el));

    // Capture late-mounted elements (route changes, dynamic content).
    const mutation = new MutationObserver((mutations) => {
      for (const m of mutations) {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches("[data-reveal]:not(.is-revealed)")) {
            observer.observe(node);
          }
          node
            .querySelectorAll<HTMLElement>("[data-reveal]:not(.is-revealed)")
            .forEach((el) => observer.observe(el));
        });
      }
    });
    mutation.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutation.disconnect();
    };
  }, []);

  return null;
}
