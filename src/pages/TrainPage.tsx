import { useState } from 'react';
import { m2d } from '../audio/theory';
import type { Exercise, Question, FeedbackInfo } from '../exercises/types';
import type { Feedback, QuizPhase } from '../hooks/useQuizState';
import type { InstrumentId } from '../audio/engine';
import {
  PhaseSelector, LevelDirRow, KeyRow, CadenceToggle, SpreadToggle, ArpeggioToggle, InstrumentPicker,
} from '../components/Controls';
import { ScoreBar } from '../components/ScoreBar';
import { PlayArea } from '../components/PlayArea';
import { AnswerGrid } from '../components/AnswerGrid';
import { Piano } from '../components/Piano';
import { Fretboard } from '../components/Fretboard';
import { FeedbackSheet } from '../components/FeedbackSheet';
import { MelodyBoard } from '../components/MelodyBoard';

interface TrainPageProps {
  visible: boolean;
  exercises: ReadonlyArray<Exercise<unknown>>;
  activeExercise: Exercise<unknown>;
  onExerciseChange: (id: string) => void;
  levelIndex: number;
  onLevelChange: (i: number) => void;
  direction: 'asc' | 'desc';
  onDirectionChange: (d: 'asc' | 'desc') => void;
  keyName: string;
  onKeyChange: (k: string) => void;
  cadenceEnabled: boolean;
  onCadenceChange: (v: boolean) => void;
  spread: boolean;
  onSpreadChange: (v: boolean) => void;
  arpeggio: boolean;
  onArpeggioChange: (v: boolean) => void;
  instrument: InstrumentId;
  onInstrumentChange: (id: InstrumentId) => void;
  question: (Question & { pickId: string | number }) | null;
  feedback: Feedback | null;
  quizPhase: QuizPhase;
  correct: number;
  total: number;
  streak: number;
  best: number;
  nearMisses: number;
  timerLabel: string;
  onStart: () => void;
  onReplay: () => void;
  onNext: () => void;
  onGuess: (id: string | number) => void;
  onResetScore: () => void;
  onResetTimer: () => void;
}

export function TrainPage(props: TrainPageProps) {
  const {
    visible, exercises, activeExercise, onExerciseChange,
    levelIndex, onLevelChange, direction, onDirectionChange,
    keyName, onKeyChange, cadenceEnabled, onCadenceChange,
    spread, onSpreadChange,
    arpeggio, onArpeggioChange,
    instrument, onInstrumentChange,
    question, feedback, quizPhase,
    correct, total, streak, best, nearMisses,
    timerLabel,
    onStart, onReplay, onNext, onGuess, onResetScore, onResetTimer,
  } = props;

  const [sheetDismissed, setSheetDismissed] = useState(false);

  // Reset sheet dismissed state when a new question starts
  const handleNext = () => {
    setSheetDismissed(false);
    onNext();
  };

  // The correct answer id (available after first guess)
  const correctId = feedback && question ? question.pickId : null;

  const answers = question
    ? (activeExercise.getQuestionAnswers?.(question as never) ?? activeExercise.answers(levelIndex))
    : activeExercise.answers(levelIndex);

  const correctLabel = correctId !== null
    ? activeExercise.feedback(correctId).label : null;

  const feedbackInfo: FeedbackInfo | null =
    correctId !== null ? activeExercise.feedback(correctId) : null;

  // Hint for close miss (don't reveal the answer)
  const hint = (quizPhase === 'close_miss' && question && feedback)
    ? (activeExercise.getHint?.(question.pickId, feedback.guess) ?? 'You\'re close! Listen again.')
    : null;

  // Piano/fretboard highlights
  const highlights: Record<number, string> = {};
  if (question) {
    highlights[question.root] = '#6366f1';
    if (quizPhase === 'answered' && feedbackInfo) {
      const accent = feedbackInfo.color;
      question.notes.forEach((n) => { if (n !== question.root) highlights[n] = accent; });
    }
  }

  let pianoLabel = '';
  let pianoLabelColor = '#6366f1';
  if (question && quizPhase === 'answered') {
    pianoLabel = question.notes.map(m2d).join(' ');
    pianoLabelColor = feedbackInfo?.color ?? '#6366f1';
  } else if (question) {
    pianoLabel = question.displayLabel ?? `Root: ${m2d(question.root)}`;
  }

  // Sheet visible: open when feedback exists and not dismissed
  const sheetOpen = !sheetDismissed &&
    (quizPhase === 'close_miss' || quizPhase === 'answered');

  return (
    <div className={`screen${visible ? ' vis' : ''}`}>
      <PhaseSelector
        exercises={exercises} activeId={activeExercise.id} onChange={onExerciseChange}
      />
      <LevelDirRow
        levels={activeExercise.levels} levelIndex={levelIndex} onLevelChange={onLevelChange}
        showDirection={activeExercise.usesDirection}
        direction={direction} onDirectionChange={onDirectionChange}
      />
      {activeExercise.id !== 'melody' && <KeyRow keyName={keyName} onChange={onKeyChange} />}
      {activeExercise.id !== 'melody' && <CadenceToggle on={cadenceEnabled} onChange={onCadenceChange} />}
      {activeExercise.id === 'triad' && <SpreadToggle on={spread} onChange={onSpreadChange} />}
      {activeExercise.id === 'triad' && <ArpeggioToggle on={arpeggio} onChange={onArpeggioChange} />}
      <InstrumentPicker instrument={instrument} onChange={onInstrumentChange} />

      <ScoreBar
        correct={correct} total={total} streak={streak} best={best}
        nearMisses={nearMisses} timerLabel={timerLabel}
        onResetScore={onResetScore} onResetTimer={onResetTimer}
      />

      {activeExercise.id === 'melody' ? (
        /* ── Melody board replaces standard Play/Grid flow ── */
        question ? (
          <MelodyBoard
            key={String(question.pickId)}
            question={question as Parameters<typeof MelodyBoard>[0]['question']}
            instrument={instrument}
            onComplete={(clean) => onGuess(clean ? 'complete_clean' : 'complete_retry')}
            onNext={handleNext}
          />
        ) : (
          <div className="play-area">
            <button className="big-btn" onClick={onStart}>▶ Start Training</button>
          </div>
        )
      ) : (
        /* ── Standard interval / distance / triad / pitch flow ── */
        <>
          <PlayArea
            hasQuestion={!!question}
            rootMidi={question?.root ?? null}
            feedback={feedback ? { ok: feedback.ok } : null}
            correctLabel={quizPhase === 'answered' ? correctLabel : null}
            feedbackInfo={quizPhase === 'answered' ? feedbackInfo : null}
            onStart={onStart}
            onReplay={onReplay}
            onNext={handleNext}
          />

          <AnswerGrid
            answers={answers}
            correctId={quizPhase === 'answered' ? correctId : null}
            guessedId={feedback?.guess ?? null}
            locked={quizPhase === 'answered'}
            onGuess={onGuess}
          />

          <Piano highlights={highlights} headerLabel={pianoLabel} headerColor={pianoLabelColor} />
          <Fretboard highlights={highlights} />

          {sheetOpen && feedbackInfo && (
            <FeedbackSheet
              quizPhase={quizPhase}
              correctInfo={feedbackInfo}
              hint={hint}
              instrument={instrument}
              questionRoot={question?.root ?? 60}
              onNext={handleNext}
              onDismiss={() => setSheetDismissed(true)}
            />
          )}
        </>
      )}

      <Roadmap activeId={activeExercise.id} />
    </div>
  );
}

function Roadmap({ activeId }: { activeId: string }) {
  const phases = [
    { id: 'interval', n: 1, label: 'Intervals', color: '#6366f1' },
    { id: 'distance', n: 2, label: 'Distance',  color: '#8b5cf6' },
    { id: 'triad',    n: 3, label: 'Chords',    color: '#c084fc' },
    { id: 'melody',   n: 4, label: 'Melodies',  color: '#fb923c' },
    { id: null,       n: 5, label: 'More soon', color: null },
  ];
  return (
    <div className="roadmap">
      <span style={{ fontSize: 9, color: '#383848', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
        Roadmap
      </span>
      <br />
      {phases.map((p, i) => {
        const active = p.id === activeId;
        const done = p.color !== null;
        const bg = active ? p.color! : done ? '#1a1a2e' : '#16162e';
        const textColor = active ? p.color! : done ? '#555' : '#383848';
        const numColor = active ? '#fff' : done ? '#444' : '#383848';
        return (
          <span key={p.n}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: i === 0 ? '4px 5px' : '0 5px' }}>
              <span style={{
                width: 18, height: 18, borderRadius: '50%', display: 'inline-flex',
                alignItems: 'center', justifyContent: 'center',
                background: bg, fontSize: 9, fontWeight: 700, color: numColor,
              }}>{p.n}</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: textColor }}>{p.label}</span>
            </span>
            {i < phases.length - 1 && <span style={{ color: '#222' }}>→</span>}
          </span>
        );
      })}
    </div>
  );
}
