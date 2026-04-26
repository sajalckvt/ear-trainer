import { m2d } from '../audio/theory';
import type { Exercise, Question, FeedbackInfo } from '../exercises/types';
import type { Feedback } from '../hooks/useQuizState';
import type { InstrumentId } from '../audio/engine';
import {
  PhaseSelector, LevelDirRow, KeyRow, CadenceToggle, InstrumentPicker,
} from '../components/Controls';
import { ScoreBar } from '../components/ScoreBar';
import { PlayArea } from '../components/PlayArea';
import { AnswerGrid } from '../components/AnswerGrid';
import { Piano } from '../components/Piano';
import { Fretboard } from '../components/Fretboard';

interface TrainPageProps {
  visible: boolean;
  // Exercise selection + settings
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
  instrument: InstrumentId;
  onInstrumentChange: (id: InstrumentId) => void;
  // Quiz state
  question: (Question & { pickId: string | number }) | null;
  feedback: Feedback | null;
  correct: number;
  total: number;
  streak: number;
  best: number;
  // Timer
  timerLabel: string;
  // Handlers
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
    instrument, onInstrumentChange,
    question, feedback, correct, total, streak, best,
    timerLabel,
    onStart, onReplay, onNext, onGuess, onResetScore, onResetTimer,
  } = props;

  // Correct-answer id (for highlighting the right button after a guess)
  const correctId =
    feedback && question
      ? question.pickId
      : null;

  // Answer options for current level
  const answers = activeExercise.answers(levelIndex);

  // Feedback label (the name of the correct answer)
  const correctLabel = correctId !== null
    ? activeExercise.feedback(correctId).label
    : null;

  const feedbackInfo: FeedbackInfo | null =
    correctId !== null ? activeExercise.feedback(correctId) : null;

  // Build highlight maps for piano + fretboard
  const highlights: Record<number, string> = {};
  if (question) {
    highlights[question.root] = '#6366f1'; // root always purple
    if (feedback) {
      const accent = feedbackInfo?.color ?? '#6366f1';
      question.notes.forEach((n) => {
        if (n !== question.root) highlights[n] = accent;
      });
    }
  }

  // Piano header label: either "Root: C4" while playing, or note list after answer
  let pianoLabel = '';
  let pianoLabelColor = '#6366f1';
  if (question && feedback) {
    pianoLabel = question.notes.map(m2d).join(' ');
    pianoLabelColor = feedbackInfo?.color ?? '#6366f1';
  } else if (question) {
    pianoLabel = `Root: ${m2d(question.root)}`;
  }

  return (
    <div className={`screen${visible ? ' vis' : ''}`}>
      <PhaseSelector
        exercises={exercises}
        activeId={activeExercise.id}
        onChange={onExerciseChange}
      />

      <LevelDirRow
        levels={activeExercise.levels}
        levelIndex={levelIndex}
        onLevelChange={onLevelChange}
        showDirection={activeExercise.usesDirection}
        direction={direction}
        onDirectionChange={onDirectionChange}
      />

      <KeyRow keyName={keyName} onChange={onKeyChange} />

      <CadenceToggle on={cadenceEnabled} onChange={onCadenceChange} />

      <InstrumentPicker instrument={instrument} onChange={onInstrumentChange} />

      <ScoreBar
        correct={correct}
        total={total}
        streak={streak}
        best={best}
        timerLabel={timerLabel}
        onResetScore={onResetScore}
        onResetTimer={onResetTimer}
      />

      <PlayArea
        hasQuestion={!!question}
        rootMidi={question?.root ?? null}
        feedback={feedback}
        correctLabel={correctLabel}
        feedbackInfo={feedbackInfo}
        onStart={onStart}
        onReplay={onReplay}
        onNext={onNext}
      />

      <AnswerGrid
        answers={answers}
        correctId={correctId}
        guessedId={feedback?.guess ?? null}
        locked={!!feedback}
        onGuess={onGuess}
      />

      <Piano
        highlights={highlights}
        headerLabel={pianoLabel}
        headerColor={pianoLabelColor}
      />

      <Fretboard highlights={highlights} />

      <Roadmap activePhase={activeExercise.id === 'interval' ? 1 : 2} />
    </div>
  );
}

function Roadmap({ activePhase }: { activePhase: 1 | 2 }) {
  const p1Style = activePhase === 1
    ? { background: '#6366f1', color: '#fff' }
    : { background: '#16162e', color: '#444' };
  const p1TextColor = activePhase === 1 ? '#a5b4fc' : '#383848';
  const p2Style = activePhase === 2
    ? { background: '#c084fc', color: '#fff' }
    : { background: '#16162e', color: '#444' };
  const p2TextColor = activePhase === 2 ? '#c084fc' : '#383848';

  const badge = (n: number, style: React.CSSProperties) => (
    <span style={{
      width: 18, height: 18, borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 9, fontWeight: 700, ...style,
    }}>{n}</span>
  );
  const step = (n: number, label: string, bgStyle: React.CSSProperties, textColor: string, margin: string) => (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      margin,
    }}>
      {badge(n, bgStyle)}
      <span style={{ fontSize: 10, fontWeight: 600, color: textColor }}>{label}</span>
    </span>
  );

  return (
    <div className="roadmap">
      <span style={{ fontSize: 9, color: '#383848', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Roadmap</span>
      <br />
      {step(1, 'Intervals', p1Style, p1TextColor, '4px 5px')}
      <span style={{ color: '#222' }}>→</span>
      {step(2, 'Triads', p2Style, p2TextColor, '0 5px')}
      <span style={{ color: '#222' }}>→</span>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '0 5px' }}>
        <span style={{
          width: 18, height: 18, borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: '#16162e', fontSize: 9, fontWeight: 700, color: '#444',
        }}>3</span>
        <span style={{ fontSize: 10, color: '#383848', fontWeight: 600 }}>Progressions</span>
      </span>
    </div>
  );
}
