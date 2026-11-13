import type { ButtonHTMLAttributes, MouseEvent } from "react";
import { Icon, type IconName } from "../Icon/Icon";
import styles from "./Button.module.css";

type Native = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "style">;

type Common = Native & {
  size?: "m" | "l";
  block?: boolean;
  icon?: IconName;
  loading?: boolean;
};

export type ButtonProps =
  | (Common & { variant: "primary" | "secondary" | "quiet" | "danger" })
  | (Common & { variant: "icon"; "aria-label": string });

export function Button(props: ButtonProps) {
  const { variant, size = "m", block, icon, loading, type = "button", onClick, children, ...rest } = props;
  const cls = [styles.button, styles[variant], size === "l" && styles.l, block && styles.block]
    .filter(Boolean)
    .join(" ");
  const handle = (e: MouseEvent<HTMLButtonElement>) => {
    if (loading) return;
    onClick?.(e);
  };
  return (
    <button {...rest} type={type} className={cls} onClick={handle} aria-busy={loading ? "true" : undefined}>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon && <Icon name={icon} />}
      {children}
    </button>
  );
}
