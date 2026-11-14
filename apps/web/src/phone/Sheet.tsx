import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "../components";
import { t } from "../i18n/t";
import styles from "./Sheet.module.css";

const FOCUSABLE = "a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex='-1'])";

/** Bottom sheet (DESIGN.md 6.8). Opening pushes one history entry; every way of closing ends with onClose. */
export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const opener = useRef<Element | null>(null);
  const pushed = useRef(false);
  const popped = useRef(false);

  useEffect(() => {
    opener.current ??= document.activeElement;
    heading.current?.focus();
    if (!pushed.current) {
      pushed.current = true;
      history.pushState(history.state, "");
    }
    const onPop = () => {
      popped.current = true;
      setClosing(true);
    };
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setClosing(true);
    window.addEventListener("popstate", onPop);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Focus goes back to the opener when the sheet is gone.
  useEffect(() => () => void (opener.current as HTMLElement | null)?.focus?.(), []);

  const trap = (e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panel.current) return;
    const items = [heading.current!, ...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const finish = () => {
    if (!popped.current) history.back(); // the popstate it raises finds no listener
    onClose();
  };

  return (
    <div className={styles.root} data-closing={closing || undefined}>
      <div className={styles.backdrop} onClick={() => setClosing(true)} />
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={trap}
        onAnimationEnd={(e) => e.target === e.currentTarget && closing && finish()}
      >
        <span className={styles.handle} aria-hidden="true" />
        <div className={styles.head}>
          <h2 id={titleId} ref={heading} tabIndex={-1} className={styles.title}>{title}</h2>
          <Button variant="icon" icon="close" aria-label={t("sheet.close")} onClick={() => setClosing(true)} />
        </div>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
