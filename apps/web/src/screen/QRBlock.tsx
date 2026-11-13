import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import styles from "./QRBlock.module.css";

const DESIGN_WIDTH = 1920;
const CODE_UNITS = 240;

/** DESIGN.md 6.17, the /screen size: joins the installation from the room. */
export function QRBlock() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const url = `${location.origin}/?mode=remote`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let live = true;
    const css = getComputedStyle(document.documentElement);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(CODE_UNITS * (window.innerWidth / DESIGN_WIDTH) * dpr);
    QRCode.toCanvas(canvas, url, {
      errorCorrectionLevel: "M",
      margin: 4,
      width,
      color: { dark: css.getPropertyValue("--bg").trim(), light: css.getPropertyValue("--lamp-white").trim() },
    }).then(
      () => {
        // qrcode sets an inline size in CSS px; drop it so the class sizes the canvas and the dpr pixels stay sharp.
        canvas.style.width = "";
        canvas.style.height = "";
        if (live) setState("ready");
      },
      () => live && setState("error"),
    );
    return () => {
      live = false;
    };
  }, [url]);

  return (
    <div className={`${styles.qr} ${styles.qrScreen}`}>
      {state !== "error" && <canvas ref={canvasRef} className={styles.code} role="img" aria-label="QR code to join LAMPA" />}
      <p className={state === "error" ? `${styles.caption} ${styles.url}` : styles.caption}>{state === "error" ? url : "Scan to join from here"}</p>
    </div>
  );
}
