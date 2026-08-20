import type { LabMode } from "../types";

type Props = {
  mode: LabMode;
  liveAvailable: boolean;
  onChange: (mode: LabMode) => void;
};

export function ModeSwitch({ mode, liveAvailable, onChange }: Props) {
  return (
    <div className="mode-switch" aria-label="Modo de ejecución">
      <button
        type="button"
        className={mode === "sandbox" ? "is-selected" : ""}
        aria-pressed={mode === "sandbox"}
        onClick={() => onChange("sandbox")}
      >
        Sandbox
      </button>
      <button
        type="button"
        className={mode === "live" ? "is-selected" : ""}
        aria-pressed={mode === "live"}
        onClick={() => onChange("live")}
      >
        Live <span className={liveAvailable ? "signal online" : "signal"} aria-label={liveAvailable ? "servicios disponibles" : "servicios no detectados"} />
      </button>
    </div>
  );
}

