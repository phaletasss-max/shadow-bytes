import { useState } from "react";
import { lessons } from "../data";

export function Academy({ onLaunchMission }: { onLaunchMission: () => void }) {
  const [selectedId, setSelectedId] = useState(lessons[0].id);
  const lesson = lessons.find((item) => item.id === selectedId) ?? lessons[0];

  return (
    <section className="academy" aria-labelledby="academy-title">
      <div className="academy-intro">
        <p className="eyebrow">PRESENTACIÓN INTERACTIVA</p>
        <h2 id="academy-title">Academia SOA</h2>
        <p>Usa las diapositivas del equipo como guía y conviértelas en una prueba visible dentro del laboratorio.</p>
      </div>
      <div className="lesson-layout">
        <div className="lesson-selector" aria-label="Temas de la presentación">
          {lessons.map((item, index) => (
            <button key={item.id} type="button" className={item.id === lesson.id ? "is-selected" : ""} aria-pressed={item.id === lesson.id} onClick={() => setSelectedId(item.id)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.subtitle}
            </button>
          ))}
        </div>
        <article className="lesson-detail">
          <div className="lesson-image-wrap"><img src={lesson.image} alt={`Diapositiva: ${lesson.title}`} loading="lazy" /></div>
          <div className="lesson-copy">
            <p className="eyebrow">{lesson.subtitle}</p>
            <h3>{lesson.title}</h3>
            <p>{lesson.concept}</p>
            <div className="lesson-mission"><span>MISIÓN EN EL LAB</span>{lesson.mission}</div>
            <button type="button" className="primary-action" onClick={onLaunchMission}>Probarlo en Mission Control <span aria-hidden="true">→</span></button>
          </div>
        </article>
      </div>
    </section>
  );
}

