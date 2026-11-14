import { useState } from "react";
import type { ArchiveImage } from "../audio/clips";
import { Sheet } from "../phone/Sheet";
import styles from "./Archive.module.css";

/** An archive image as shown in Talk: the alt text already in the visitor's language. */
export type ShownImage = { id: string; src: string; alt: string; credit: string; year: string };

export const shownImage = (image: ArchiveImage, lang: string): ShownImage => ({
  id: image.id,
  src: `/archive/${image.file}`,
  alt: image.alt[lang] ?? image.alt.en ?? "",
  credit: image.credit,
  year: image.year,
});

/** DESIGN 7.4: opened from Talk's image card only. */
export function ArchiveSheet({ image, onClose }: { image: ShownImage; onClose: () => void }) {
  const [state, setState] = useState<"loading" | "loaded" | "error">("loading");
  return (
    <Sheet title="Archive image" onClose={onClose}>
      {state === "error" ? (
        <p className={styles.error}>This image did not load.</p>
      ) : (
        <>
          {state === "loading" && <div className={styles.loading}>Loading image</div>}
          <img
            className={state === "loading" ? styles.hidden : styles.image}
            src={image.src}
            alt={image.alt}
            onLoad={() => setState("loaded")}
            onError={() => setState("error")}
          />
        </>
      )}
      <p className={styles.alt}>{image.alt}</p>
      <p className={styles.meta}>
        {image.credit}, {image.year}
      </p>
    </Sheet>
  );
}
