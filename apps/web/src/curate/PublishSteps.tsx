import { Button, Icon } from "../components";
import { STEPS } from "./placeForm";
import styles from "./AddPlace.module.css";

export type StepState = { status: "pending" | "active" | "done" | "failed"; error?: string };

// Read after the label, so the state is not carried by the icon's colour alone.
const SPOKEN: Record<StepState["status"], string> = {
  pending: "waiting",
  active: "in progress",
  done: "done",
  failed: "failed",
};

/** DESIGN.md 7.15 publishing: one row per step; a failed step offers "Try again" for that step. */
export function PublishSteps({ steps, onRetry }: { steps: StepState[]; onRetry: (index: number) => void }) {
  return (
    <ol className={styles.steps}>
      {STEPS.map((step, i) => {
        const state = steps[i] ?? { status: "pending" };
        return (
          <li key={step.key} className={`${styles.step} ${styles[state.status] ?? ""}`} aria-current={state.status === "active" ? "step" : undefined}>
            <span className={styles.stepMark} aria-hidden="true">
              {state.status === "active" && <span className={styles.spinner} />}
              {state.status === "done" && <Icon name="check" />}
              {state.status === "failed" && <Icon name="alert" />}
            </span>
            <span className={styles.stepBody}>
              <span>
                {step.label}
                <span className={styles.srOnly}>, {SPOKEN[state.status]}</span>
              </span>
              {state.status === "failed" && (
                <>
                  <span className={styles.stepError} role="alert">
                    {state.error}
                  </span>
                  <Button variant="secondary" onClick={() => onRetry(i)}>
                    Try again
                  </Button>
                </>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
