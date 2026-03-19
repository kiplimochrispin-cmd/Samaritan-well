import { RefObject, useEffect } from "react";

export default function useHeroAnimation(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;
    const heroNodes = Array.from(ref.current.querySelectorAll<HTMLElement>(".anim-hero"));
    const cardNodes = Array.from(ref.current.querySelectorAll<HTMLElement>(".anim-card"));

    const animations = [...heroNodes, ...cardNodes].map((node, index) =>
      node.animate(
        [
          { opacity: 0, transform: "translateY(28px)" },
          { opacity: 1, transform: "translateY(0)" }
        ],
        {
          duration: 650,
          delay: index * 80,
          fill: "both",
          easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        },
      ),
    );

    return () => {
      animations.forEach((animation) => animation.cancel());
    };
  }, [ref]);
}
