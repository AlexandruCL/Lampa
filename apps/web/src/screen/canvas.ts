import type { Site } from "@lampa/shared";
import type { RefObject } from "react";
import { glowAlpha, glowLine, haloAlpha } from "./glow";
import { layout, MAP_WIDTH, SITE_RADIUS } from "./projection";

const EASE_MS = 1200;
const HALO_REACH = 1.6;
const LABEL_GAP = 10;
const NAME = { weight: 600, size: 30, line: 36 };
const META = { weight: 400, size: 22, line: 28 };

type Ease = { from: number; to: number; start: number };

// Canvas gradients interpolate without premultiplying, so fading to "transparent" would darken the halo edge.
// shortcut: assumes --lamp reads back as an opaque #rrggbb, parse other formats if the token changes.
function clearOf(ctx: CanvasRenderingContext2D, color: string): string {
  ctx.fillStyle = color;
  const n = parseInt(String(ctx.fillStyle).slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, 0)`;
}

export function startCanvas(
  canvas: HTMLCanvasElement,
  sites: Site[],
  glowRef: RefObject<Record<string, number>>,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  const [bg, lamp, line, text, text2, fontUi, fontDisplay] = [
    "--bg",
    "--lamp",
    "--line",
    "--text",
    "--text-2",
    "--font-ui",
    "--font-display",
  ].map(token);
  const lampClear = clearOf(ctx, lamp);

  const byId = new Map(sites.map((s) => [s.id, s]));
  const placed = layout(sites);
  const eases = new Map<string, Ease>(placed.map((p) => [p.id, { from: 0, to: 0, start: 0 }]));

  let dpr = 1;
  let frame = 0;
  let fontsReady = false;
  void document.fonts.ready.then(() => {
    fontsReady = true;
  });

  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  };

  const shownGlow = (id: string, now: number) => {
    const e = eases.get(id)!;
    const t = Math.min(1, (now - e.start) / EASE_MS);
    const shown = e.from + (e.to - e.from) * (1 - (1 - t) ** 3);
    const target = glowRef.current[id] ?? 0;
    if (target !== e.to) Object.assign(e, { from: shown, to: target, start: now });
    return shown;
  };

  const drawLabel = (lines: [string, typeof NAME, string, string][], x: number, y: number, r: number, side: string, s: number) => {
    const height = lines.reduce((sum, [, f]) => sum + f.line, 0) * s;
    let top = side === "below" ? y + r + LABEL_GAP * s : y - r - LABEL_GAP * s - height;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = 1;
    for (const [str, f, family, color] of lines) {
      ctx.font = `${f.weight} ${f.size * s}px ${family}`;
      ctx.fillStyle = color;
      const half = Math.min(ctx.measureText(str).width / 2, canvas.width / 2);
      ctx.fillText(str, Math.min(Math.max(x, half), canvas.width - half), top + (f.line * s) / 2);
      top += f.line * s;
    }
  };

  const draw = (now: number) => {
    // The canvas spans the 1380-unit map area, so one design unit is canvas.width / 1380 device pixels.
    const s = canvas.width / MAP_WIDTH;
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const p of placed) {
      const site = byId.get(p.id)!;
      const [x, y, r] = [p.x * s, p.y * s, SITE_RADIUS * s];
      if (site.is_memorial) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = line;
        ctx.lineWidth = dpr;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        if (fontsReady) drawLabel([[site.name, NAME, fontDisplay, text2]], x, y, r, p.label, s);
        continue;
      }
      const glow = shownGlow(p.id, now);
      const halo = ctx.createRadialGradient(x, y, 0, x, y, HALO_REACH * r);
      halo.addColorStop(0, lamp);
      halo.addColorStop(1, lampClear);
      ctx.globalAlpha = haloAlpha(glow);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(x, y, HALO_REACH * r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = glowAlpha(glow);
      ctx.fillStyle = lamp;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (fontsReady) {
        drawLabel(
          [
            [site.name, NAME, fontDisplay, text],
            [glowLine(glow), META, fontUi, text2],
          ],
          x,
          y,
          r,
          p.label,
          s,
        );
      }
    }
  };

  const tick = (now: number) => {
    draw(now);
    frame = requestAnimationFrame(tick);
  };
  const onVisibility = () => {
    cancelAnimationFrame(frame);
    if (!document.hidden) frame = requestAnimationFrame(tick);
  };

  fit();
  window.addEventListener("resize", fit);
  document.addEventListener("visibilitychange", onVisibility);
  onVisibility();

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", fit);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
