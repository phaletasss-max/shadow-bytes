import type { ServiceState, TraceState } from "../types";

type DotState = ServiceState | TraceState;

export function StatusDot({ state, label }: { state: DotState; label?: string }) {
  return <i className={`status-dot ${state.toLowerCase()}`} aria-label={label} />;
}

