import { useCallback, useEffect, useMemo, useState } from "react";
import { lessons } from "../data";

type AcademyProps = {
  onLaunchMission: () => void;
};

export function Academy({ onLaunchMission }: AcademyProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<string, boolean>>({});

  const lesson = lessons[activeIndex];
  const isFirst = activeIndex === 0;
  const isLast = activeIndex === lessons.length - 1;
  const answer = answers[lesson.id];
  const questionRevealed = revealedQuestions[lesson.id] ?? false;

  const move = useCallback((direction: -1 | 1) => {
    setActiveIndex((current) => Math.min(lessons.length - 1, Math.max(0, current + direction)));
  }, []);

  useEffect(() => {
    if (!isPresenting) return undefined;

    const handleKeydown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;

      if (event.key === "ArrowRight" || event.key === "PageDown") {
        event.preventDefault();
        move(1);
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault();
        move(-1);
      }
      if (event.key === "Escape") setIsPresenting(false);
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [isPresenting, move]);

  const progress = useMemo(() => `${((activeIndex + 1) / lessons.length) * 100}%`, [activeIndex]);

  const chooseLesson = (index: number) => {
    setActiveIndex(index);
    setShowNotes(false);
  };

  const revealAnswer = () => {
    if (answer === undefined) return;
    setRevealedQuestions((current) => ({ ...current, [lesson.id]: true }));
  };

  return (
    <section className={`academy ${isPresenting ? "is-presenting" : ""}`} aria-labelledby="academy-title">
      <header className="academy-intro">
        <div>
          <p className="eyebrow">PRESENTACIÓN INTERACTIVA</p>
          <h2 id="academy-title">Academia SOA</h2>
          <p>Presenta las diapositivas, utiliza tus notas y valida la comprensión antes de llevar al público al laboratorio.</p>
        </div>
        <button type="button" className="secondary-action academy-launch" onClick={() => setIsPresenting(true)}>
          Iniciar presentación <span aria-hidden="true">↗</span>
        </button>
      </header>

      <div className="academy-progress" aria-label={`Progreso: diapositiva ${activeIndex + 1} de ${lessons.length}`}>
        <span style={{ width: progress }} />
      </div>

      <div className="lesson-layout">
        <nav className="lesson-selector" aria-label="Diapositivas de la presentación">
          {lessons.map((item, index) => (
            <button key={item.id} type="button" className={index === activeIndex ? "is-selected" : ""} aria-current={index === activeIndex ? "step" : undefined} onClick={() => chooseLesson(index)}>
              <span>{String(index + 1).padStart(2, "0")}</span>{item.subtitle}
            </button>
          ))}
        </nav>

        <article className="presentation-deck" aria-live="polite">
          <div className="presentation-toolbar">
            <span className="slide-counter">{String(activeIndex + 1).padStart(2, "0")} / {String(lessons.length).padStart(2, "0")}</span>
            <span>{isPresenting ? "MODO PRESENTACIÓN · ← → para avanzar" : "VISTA DEL PRESENTADOR"}</span>
            {isPresenting && <button type="button" className="text-action" onClick={() => setIsPresenting(false)}>Salir (Esc)</button>}
          </div>

          <figure className="lesson-image-wrap">
            <img src={lesson.image} alt={`Diapositiva ${activeIndex + 1}: ${lesson.title}`} width="1536" height="1024" loading={activeIndex === 0 ? "eager" : "lazy"} />
            <figcaption>{lesson.subtitle}</figcaption>
          </figure>

          <div className="presentation-content">
            <div className="lesson-copy">
              <p className="eyebrow">{lesson.subtitle}</p>
              <h3>{lesson.title}</h3>
              <p>{lesson.concept}</p>
              <div className="lesson-mission"><span>MISIÓN EN EL LAB</span>{lesson.mission}</div>
              <button type="button" className="primary-action" onClick={onLaunchMission}>Probarlo en Mission Control <span aria-hidden="true">→</span></button>
            </div>

            <aside className="presenter-tools" aria-label="Herramientas del presentador">
              <button type="button" className="notes-toggle" aria-expanded={showNotes} onClick={() => setShowNotes((current) => !current)}>
                <span>NOTAS DEL ORADOR</span><span aria-hidden="true">{showNotes ? "−" : "+"}</span>
              </button>
              {showNotes && (
                <ul className="speaker-notes">
                  {lesson.notes.map((note) => <li key={note}>{note}</li>)}
                </ul>
              )}

              <form className="lesson-quiz" onSubmit={(event) => { event.preventDefault(); revealAnswer(); }}>
                <p className="eyebrow">PREGUNTA RÁPIDA</p>
                <fieldset>
                  <legend>{lesson.question.prompt}</legend>
                  {lesson.question.choices.map((choice, index) => (
                    <label key={choice} className={questionRevealed && index === lesson.question.correctIndex ? "is-correct" : questionRevealed && answer === index ? "is-incorrect" : ""}>
                      <input type="radio" name={`question-${lesson.id}`} checked={answer === index} onChange={() => setAnswers((current) => ({ ...current, [lesson.id]: index }))} />
                      <span>{choice}</span>
                    </label>
                  ))}
                </fieldset>
                <button type="submit" className="secondary-action" disabled={answer === undefined}>Revisar respuesta</button>
                {questionRevealed && <p className={`quiz-feedback ${answer === lesson.question.correctIndex ? "is-success" : ""}`} role="status">{answer === lesson.question.correctIndex ? "Correcto. " : "Repásalo: "}{lesson.question.explanation}</p>}
              </form>
            </aside>
          </div>

          <footer className="presentation-controls">
            <button type="button" className="secondary-action" onClick={() => move(-1)} disabled={isFirst}><span aria-hidden="true">←</span> Anterior</button>
            <p>Diapositiva <strong>{activeIndex + 1}</strong> de {lessons.length}</p>
            <button type="button" className="primary-action" onClick={() => move(1)} disabled={isLast}>Siguiente <span aria-hidden="true">→</span></button>
          </footer>
        </article>
      </div>
    </section>
  );
}
