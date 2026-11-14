import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Button } from "../components";
import styles from "./AddPlace.module.css";

const COPIED_MS = 2000;

/** DESIGN.md 6.17, the console size: the new place's page as an SVG code, its URL and "Copy link". */
export function PlaceQR({ url }: { url: string }) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let live = true;
    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 4,
      color: { dark: "#0E121A", light: "#FFF4E0" },
    }).then(
      (code) => live && setSvg(code),
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [url]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), COPIED_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = () => {
    // A refused clipboard leaves the label as it was; the URL stays on screen to copy by hand.
    navigator.clipboard?.writeText(url).then(
      () => setCopied(true),
      () => {},
    );
  };

  return (
    <div className={styles.qr}>
      {!failed &&
        (svg ? (
          // The SVG is drawn by qrcode from our own URL, not from user markup.
          <div className={styles.qrCode} role="img" aria-label={`QR code for ${url}`} dangerouslySetInnerHTML={{ __html: svg }} />
        ) : (
          <div className={styles.qrCode} aria-hidden="true" />
        ))}
      <p className={styles.qrUrl}>{url}</p>
      <Button variant="secondary" onClick={copy}>
        {copied ? "Link copied" : "Copy link"}
      </Button>
    </div>
  );
}
