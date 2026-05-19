import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  life: number;
}

const PARTICLE_COUNT = 80;
const DURATION_MS = 2000;
const GRAVITY = 0.12;

const THEME_VARS = [
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--primary",
  "--accent",
];

const DEFAULT_COLORS = [
  "#7c3aed",
  "#f97316",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#3b82f6",
];

function resolveThemeColors(element: HTMLElement): string[] | null {
  const styles = getComputedStyle(element);
  const probe = document.createElement("div");
  probe.style.display = "none";
  element.appendChild(probe);

  const resolved: string[] = [];
  for (const v of THEME_VARS) {
    const raw = styles.getPropertyValue(v).trim();
    if (!raw) continue;
    probe.style.color = raw;
    const rgb = getComputedStyle(probe).color;
    if (rgb) resolved.push(rgb);
  }

  element.removeChild(probe);
  return resolved.length >= 3 ? resolved : null;
}

function createParticles(
  width: number,
  height: number,
  colors: string[],
): Particle[] {
  const cx = width / 2;
  const cy = height * 0.35;
  return Array.from({ length: PARTICLE_COUNT }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    return {
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      life: 1,
    };
  });
}

interface ConfettiProps {
  active: boolean;
  colors?: string[];
}

export function Confetti({ active, colors }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const maybeCtx = canvas.getContext("2d");
    if (!maybeCtx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const palette = colors ?? resolveThemeColors(parent) ?? DEFAULT_COLORS;

    const g = maybeCtx;
    const particles = createParticles(canvas.width, canvas.height, palette);
    const startTime = performance.now();
    let frameId: number;

    const w = canvas.width;
    const h = canvas.height;

    function draw(now: number) {
      const elapsed = now - startTime;
      if (elapsed > DURATION_MS) {
        g.clearRect(0, 0, w, h);
        return;
      }

      g.clearRect(0, 0, w, h);
      const progress = elapsed / DURATION_MS;

      for (const p of particles) {
        p.x += p.vx;
        p.vy += GRAVITY;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.life = 1 - progress;

        g.save();
        g.translate(p.x, p.y);
        g.rotate((p.rotation * Math.PI) / 180);
        g.globalAlpha = Math.max(0, p.life);
        g.fillStyle = p.color;
        g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        g.restore();
      }

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);

    return () => cancelAnimationFrame(frameId);
  }, [active, colors]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-50"
      aria-hidden="true"
    />
  );
}
