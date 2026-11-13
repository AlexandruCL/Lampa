import type { ReactNode } from "react";
import { Button } from "../Button/Button";
import { Icon } from "../Icon/Icon";
import styles from "./Notice.module.css";

type Props = {
  children: ReactNode;
  action?: { label: string; onClick: () => void };
} & (
  | { variant: "info"; icon?: "headphones" }
  | { variant: "error" | "connection"; icon?: never }
);

export function Notice(props: Props) {
  const { variant, children, action } = props;
  const icon = variant === "info" ? props.icon : "alert";
  return (
    <div className={`${styles.notice} ${styles[variant]}`} role={variant === "error" ? "alert" : "status"}>
      {icon && (
        <span className={styles.icon}>
          <Icon name={icon} />
        </span>
      )}
      <p className={styles.text}>{children}</p>
      {action && (
        <span className={styles.action}>
          <Button variant="quiet" onClick={action.onClick}>
            {action.label}
          </Button>
        </span>
      )}
    </div>
  );
}
