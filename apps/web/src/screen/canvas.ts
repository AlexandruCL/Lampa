import type { MapLine, Site } from "@lampa/shared";
import type { RefObject } from "react";
import { candleAlpha, candleDecay, candlePosition, CANDLE_HALO, CANDLE_RADIUS_U, type Candle } from "./candles";
import { glowLine, haloAlpha } from "./glow";
import { layout, MAP_WIDTH, projectLines, SITE_RADIUS } from "./projection";
import { mixHex, paneShare, slotShape, SLOTS } from "./rose";
import type { ScreenEffect } from "./useScreenSocket";
import type { WindowsState } from "./windows";

const EASE_MS = 1200;
const HALO_REACH = 1.6;
const LABEL_GAP = 10;
const NAME = { weight: 600, size: 30, line: 36 };
const META = { weight: 400, size: 22, line: 28 };

// DESIGN.md 5.5 and 5.6.
export const PANE_FLASH_MS = 1400;
export const PANE_RING_MS = 1200;
const PANE_RING_GROWTH = 0.3;
const PANE_RING_ALPHA = 0.5;
export const FLARE_IN_MS = 600;
export const FLARE_HOLD_MS = 1200;
export const FLARE_OUT_MS = 1600;
export const FLARE_EMPTY_MS = 800;
const FLARE_REACH = 2.6;
const REDUCED_MS = 600;
const CANDLE_HALO_ALPHA = 0.25;

type Ease = { from: number; to: number; start: number };
type Refs = {
  glowRef: RefObject<Record<string, number>>;
  windowsRef: RefObject<WindowsState>;
  effectsRef: RefObject<ScreenEffect[]>;
  candlesRef: RefObject<Candle[]>;
};

const easeOut = (t: number) => 1 - (1 - t) ** 3;
const progress = (elapsed: number, ms: number) => Math.min(1, Math.max(0, elapsed / ms));

// shortcut: assumes colour tokens read back as opaque #rrggbb, parse other formats if a token changes.
function hexOf(ctx: CanvasRenderingContext2D, color: string): string {
  ctx.fillStyle = color;
  return String(ctx.fillStyle);
}

// Canvas gradients interpolate without premultiplying, so fading to "transparent" would darken the halo edge.
function rgbaOf(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function startCanvas(
  canvas: HTMLCanvasElement,
  sites: Site[],
  lines: MapLine[],
  { glowRef, windowsRef, effectsRef, candlesRef }: Refs,
): () => void {
  const ctx = canvas.getContext("2d");
  const art = document.createElement("canvas");
  const artCtx = art.getContext("2d");
  if (!ctx || !artCtx) return () => {};
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => css.getPropertyValue(name).trim();
  const [line, lineStrong, river, text, text2, fontUi, fontDisplay] = [
    "--line",
    "--line-strong",
    "--river",
    "--text",
    "--text-2",
    "--font-ui",
    "--font-display",
  ].map(token);
  const [bg, lamp, lampWhite, surface2] = ["--bg", "--lamp", "--lamp-white", "--surface-2"].map((n) => hexOf(ctx, token(n)));
  const lampClear = rgbaOf(lamp, 0);
  const candleHaloIn = rgbaOf(lampWhite, CANDLE_HALO_ALPHA);
  const candleHaloOut = rgbaOf(lampWhite, 0);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const paneMs = reduced ? REDUCED_MS : Math.max(PANE_FLASH_MS, PANE_RING_MS);
  const completeMs = reduced ? REDUCED_MS : FLARE_IN_MS + FLARE_HOLD_MS + FLARE_OUT_MS;

  const byId = new Map(sites.map((s) => [s.id, s]));
  const placed = layout(sites, lines);
  const projected = projectLines(sites, lines);
  const shapes = Array.from({ length: SLOTS }, (_, i) => slotShape(i));

  let dpr = 1;
  let frame = 0;
  let fontsReady = false;
  void document.fonts.ready.then(() => {
    fontsReady = true;
  });

  // DESIGN.md 5.5: the map art and the window frames are drawn once per size and copied each frame.
  const drawArt = () => {
    const u = canvas.width / MAP_WIDTH;
    art.width = canvas.width;
    art.height = canvas.height;
    artCtx.fillStyle = bg;
    artCtx.fillRect(0, 0, art.width, art.height);
    for (const l of projected) {
      const isRiver = l.kind === "river";
      artCtx.globalAlpha = isRiver ? 0.35 : 0.5;
      artCtx.strokeStyle = isRiver ? river : lineStrong;
      artCtx.lineWidth = (isRiver ? 14 : 2) * u;
      artCtx.lineJoin = "round";
      artCtx.lineCap = isRiver ? "round" : "butt";
      artCtx.setLineDash(isRiver ? [] : [10 * u, 8 * u]);
      artCtx.beginPath();
      l.points.forEach((p, i) => (i ? artCtx.lineTo(p.x * u, p.y * u) : artCtx.moveTo(p.x * u, p.y * u)));
      artCtx.stroke();
    }
    artCtx.globalAlpha = 1;
    artCtx.setLineDash([]);
    artCtx.strokeStyle = lineStrong;
    artCtx.lineWidth = 1.5 * dpr;
    for (const p of placed) {
      if (byId.get(p.id)!.is_memorial) continue;
      artCtx.beginPath();
      artCtx.arc(p.x * u, p.y * u, (SITE_RADIUS + 2) * u, 0, Math.PI * 2);
      artCtx.stroke();
    }
  };
  const eases = new Map<string, Ease>(placed.map((p) => [p.id, { from: 0, to: 0, start: 0 }]));
  const candleEases = new Map<string, Ease>();
  let candleGlow: Record<string, number> | null = null;

  const fit = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    drawArt();
  };

  const shownGlow = (id: string, now: number) => {
    const e = eases.get(id)!;
    const shown = e.from + (e.to - e.from) * easeOut(progress(now - e.start, EASE_MS));
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

  // Angles from slotShape start at 12 o'clock; canvas angles start at 3 o'clock. Both run clockwise on screen.
  const slot = (x: number, y: number, r: number, i: number, fill: string, alpha = 1) => {
    const { r0, r1, a0, a1 } = shapes[i];
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, r1 * r, a0 - Math.PI / 2, a1 - Math.PI / 2);
    ctx.arc(x, y, r0 * r, a1 - Math.PI / 2, a0 - Math.PI / 2, true);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.stroke();
  };

  // DESIGN.md 5.5: a new point fades in from 0, and every alpha is recomputed and eased on each glow update.
  // Reduced motion keeps these fades (5.6).
  const drawCandles = (x: number, y: number, r: number, s: number, now: number) => {
    const candles = candlesRef.current;
    const recompute = glowRef.current !== candleGlow;
    candleGlow = glowRef.current;
    const ids = new Set(candles.map((c) => c.id));
    for (const id of candleEases.keys()) if (!ids.has(id)) candleEases.delete(id);
    const point = CANDLE_RADIUS_U * s;
    const reach = CANDLE_HALO * point;
    for (const c of candles) {
      let e = candleEases.get(c.id);
      if (!e) candleEases.set(c.id, (e = { from: 0, to: candleAlpha(candleDecay(c.litAt, Date.now())), start: now }));
      const shown = e.from + (e.to - e.from) * easeOut(progress(now - e.start, EASE_MS));
      if (recompute) Object.assign(e, { from: shown, to: candleAlpha(candleDecay(c.litAt, Date.now())), start: now });
      const { dx, dy } = candlePosition(c.id);
      const [cx, cy] = [x + dx * r, y + dy * r];
      ctx.globalAlpha = shown;
      const halo = ctx.createRadialGradient(cx, cy, point, cx, cy, reach);
      halo.addColorStop(0, candleHaloIn);
      halo.addColorStop(1, candleHaloOut);
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, reach, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = lampWhite;
      ctx.beginPath();
      ctx.arc(cx, cy, point, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  /** 0 to 1: how far the complete flare is from rest (rise, hold, settle). */
  const flareLevel = (elapsed: number) => {
    if (elapsed < FLARE_IN_MS) return easeOut(elapsed / FLARE_IN_MS);
    if (elapsed < FLARE_IN_MS + FLARE_HOLD_MS) return 1;
    return 1 - easeOut(progress(elapsed - FLARE_IN_MS - FLARE_HOLD_MS, FLARE_OUT_MS));
  };

  const drawWindow = (siteId: string, x: number, y: number, r: number, glow: number, effects: ScreenEffect[], now: number) => {
    const complete = effects.find((e) => e.kind === "complete");
    const flare = complete && !reduced ? flareLevel(now - complete.at) : 0;
    const reach = HALO_REACH + (FLARE_REACH - HALO_REACH) * flare;
    const halo = ctx.createRadialGradient(x, y, 0, x, y, reach * r);
    halo.addColorStop(0, lamp);
    halo.addColorStop(1, lampClear);
    ctx.globalAlpha = haloAlpha(glow) + (1 - haloAlpha(glow)) * flare;
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, reach * r, 0, Math.PI * 2);
    ctx.fill();

    // DESIGN.md 6.6: the gaps between the rings are leading too, so the window sits on a --bg disk over the halo.
    ctx.globalAlpha = 1;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    const panes = windowsRef.current.windows[siteId]?.panes ?? [];
    const share = paneShare(glow);
    ctx.strokeStyle = bg;
    ctx.lineWidth = Math.max(1.5 * dpr, 0.012 * r);
    ctx.lineJoin = "miter";
    for (let i = 0; i < SLOTS; i++) {
      const hex = panes[i];
      if (!hex) {
        slot(x, y, r, i, surface2);
        continue;
      }
      const fill = mixHex(hex, bg, share);
      const flash = effects.find((e) => e.kind === "pane" && e.slot === i && e.hex === hex);
      if (!flash) slot(x, y, r, i, fill);
      else if (reduced) {
        slot(x, y, r, i, surface2);
        slot(x, y, r, i, fill, progress(now - flash.at, REDUCED_MS));
      } else slot(x, y, r, i, mixHex(fill, lampWhite, easeOut(progress(now - flash.at, PANE_FLASH_MS))));
    }

    if (complete?.kind === "complete") {
      const elapsed = now - complete.at;
      // Full-brightness panes during rise and hold, then a cross-fade to the current window over the last 800ms.
      const alpha = reduced
        ? 1 - progress(elapsed, REDUCED_MS)
        : 1 - progress(elapsed - (completeMs - FLARE_EMPTY_MS), FLARE_EMPTY_MS);
      complete.panes.forEach((hex, i) => slot(x, y, r, i, hex ? mixHex(hex, bg, 1) : surface2, alpha));
    }

    if (!reduced) {
      for (const e of effects) {
        if (e.kind !== "pane") continue;
        const t = progress(now - e.at, PANE_RING_MS);
        if (t >= 1) continue;
        ctx.globalAlpha = PANE_RING_ALPHA * (1 - t);
        ctx.strokeStyle = text;
        ctx.lineWidth = 2 * (canvas.width / MAP_WIDTH);
        ctx.beginPath();
        ctx.arc(x, y, r * (1 + PANE_RING_GROWTH * t), 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  };

  const draw = (now: number) => {
    effectsRef.current = effectsRef.current.filter((e) => now - e.at < (e.kind === "pane" ? paneMs : completeMs));
    // The canvas spans the 1380-unit map area, so one design unit is canvas.width / 1380 device pixels.
    const s = canvas.width / MAP_WIDTH;
    ctx.globalAlpha = 1;
    // drawImage throws on a 0-size source, which the map is while hidden below 1024px.
    if (art.width && art.height) ctx.drawImage(art, 0, 0);
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
        drawCandles(x, y, r, s, now);
        if (fontsReady) drawLabel([[site.name, NAME, fontDisplay, text2]], x, y, r, p.label, s);
        continue;
      }
      const glow = shownGlow(p.id, now);
      drawWindow(p.id, x, y, r, glow, effectsRef.current.filter((e) => e.siteId === p.id), now);
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
