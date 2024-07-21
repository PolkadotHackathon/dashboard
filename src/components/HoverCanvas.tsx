import { useRef, useEffect } from "react";

import useResize from "../hooks/useResize.ts";

export default function DeformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dimensions = useResize();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas element is not available.");
      return;
    }

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("2D context is not available.");
      return;
    }

    let mouseX = 0;
    let mouseY = 0;

    canvas.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function draw() {
      const range = 100;
      const intensity = 5;
      ctx!!.clearRect(0, 0, canvas!!.width, canvas!!.height);

      for (let x = 0; x < canvas!!.width; x += 20) {
        for (let y = 0; y < canvas!!.height; y += 20) {
          const dx = mouseX - x;
          const dy = mouseY - y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const falloff = 1 / (distance / range + 1);
          const angle = Math.atan2(dy, dx);
          const move = -falloff * intensity;

          ctx!!.beginPath();
          ctx!!.arc(
            x + Math.cos(angle) * move,
            y + Math.sin(angle) * move,
            falloff ** 0.3 * 4,
            0,
            Math.PI * 2
          );
          ctx!!.fillStyle = `rgba(255, 255, 255, ${0.5 * falloff ** 2})`;
          ctx!!.fill();
        }
      }
      requestAnimationFrame(draw);
    }

    draw();

    return () => {
      canvas.removeEventListener("mousemove", () => {});
    };
  }, [dimensions]);

  return <canvas className="bg" ref={canvasRef} />;
}
