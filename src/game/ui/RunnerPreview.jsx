import { useEffect, useRef } from "react";
import { drawCharacter } from "../drawer";

// Живое превью выбранного блогера: бежит на месте, по нажатию прыгает.
function RunnerPreview({ face, skin }) {
  const ref = useRef(null);
  const jump = useRef(0);

  useEffect(() => {
    const c = ref.current;
    const g = c.getContext("2d");
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = 0;
    let phase = 0;

    const frame = (ts) => {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      phase += dt * (reduced ? 0 : 11);
      let lift = 0;
      if (jump.current > 0) {
        jump.current -= dt;
        lift = Math.sin((1 - Math.max(0, jump.current) / 0.55) * Math.PI) * 38;
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, c.width, c.height);
      // свечение под ногами
      const glow = g.createRadialGradient(c.width / 2, c.height - 14, 4, c.width / 2, c.height - 14, 70);
      glow.addColorStop(0, "rgba(255,43,58,.55)");
      glow.addColorStop(1, "rgba(255,43,58,0)");
      g.fillStyle = glow;
      g.fillRect(0, c.height - 90, c.width, 90);
      drawCharacter(g, { face, skin, x: c.width / 2, y: c.height - 14 - lift, phase, air: lift > 1, scale: 1.25 });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [face, skin]);

  return (
    <canvas
      ref={ref}
      className="runner-preview"
      width="220"
      height="170"
      onClick={() => (jump.current = 0.55)}
      aria-hidden="true"
    />
  );
}

export default RunnerPreview;
