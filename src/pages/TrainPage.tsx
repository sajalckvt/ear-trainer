import { useState, useEffect, useRef } from 'react';
import { m2d } from '../audio/theory';
import type { Exercise, Question, FeedbackInfo } from '../exercises/types';
import type { Feedback, QuizPhase } from '../hooks/useQuizState';
import { pm, type InstrumentId } from '../audio/engine';
import {
  PhaseSelector, LevelDirRow, KeyRow, CadenceToggle, SpreadToggle, ArpeggioToggle, DistanceDirectionToggle, ModeChordCountToggle, InstrumentPicker,
} from '../components/Controls';
import { ScoreBar } from '../components/ScoreBar';
import { PlayArea } from '../components/PlayArea';
import { AnswerGrid } from '../components/AnswerGrid';
import { ProgressionAnswerBuilder } from '../components/ProgressionAnswerBuilder';
import { Piano } from '../components/Piano';
import { Fretboard } from '../components/Fretboard';
import { FeedbackSheet } from '../components/FeedbackSheet';
import { MelodyBoard } from '../components/MelodyBoard';
import {
  CHORD_STEP,
  progressionChordNotes,
  playProgressionChord,
  type ProgressionPayload,
} from '../exercises/progression';
import { MODE_MAP } from '../data/modes';
import { SCALE_MAP } from '../data/scales';
import { PROGRESSION_CHORD_MAP } from '../data/progressions';

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
  distanceDirection: 'asc' | 'desc' | 'both';
  onDistanceDirectionChange: (v: 'asc' | 'desc' | 'both') => void;
  modeChordCount: number;
  onModeChordCountChange: (v: number) => void;
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
    distanceDirection, onDistanceDirectionChange,
    modeChordCount, onModeChordCountChange,
    instrument, onInstrumentChange,
    question, feedback, quizPhase,
    correct, total, streak, best, nearMisses,
    timerLabel,
    onStart, onReplay, onNext, onGuess, onResetScore, onResetTimer,
  } = props;

  const [sheetDismissed, setSheetDismissed] = useState(false);

  // ─── Progression playback animation ───────────────────────────────────────
  // For the progression exercise, we step a `progChordIdx` index forward in
  // sync with audio playback so piano/fretboard/slots all highlight only the
  // chord that's currently sounding (with a dim "trail" on the previous one).
  //
  // After answer, the user can click any slot to set this index manually and
  // re-hear just that chord — the step-through review.
  const [progChordIdx, setProgChordIdx] = useState<number | null>(null);
  const progTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearProgTimers = () => {
    progTimersRef.current.forEach(clearTimeout);
    progTimersRef.current = [];
  };

  /** Schedule the chord-index animation. cadenceDelay matches the audio delay
   *  introduced by playCadence (1800ms when enabled, 0 otherwise). */
  const startProgressionAnimation = (chordCount: number, cadenceDelay: number) => {
    clearProgTimers();
    setProgChordIdx(null);  // clear immediately
    for (let i = 0; i < chordCount; i++) {
      const t = setTimeout(
        () => setProgChordIdx(i),
        cadenceDelay + i * CHORD_STEP * 1000,
      );
      progTimersRef.current.push(t);
    }
  };

  // Cancel any in-flight animation when the question changes or unmounts
  useEffect(() => () => clearProgTimers(), []);
  useEffect(() => {
    // When the question id changes (new question), reset and stop any leftover timers
    clearProgTimers();
    setProgChordIdx(null);
  }, [question?.pickId]);

  // The animation for the first play of a new question is started by the
  // useEffect below (deps on question.pickId). handleReplay needs its own
  // call since replays don't generate a new question.
  const handleReplay = () => {
    onReplay();
    if (activeExercise.id === 'progression' && question) {
      const chordCount = (question.payload as ProgressionPayload).chordIds.length;
      const cadenceDelay = cadenceEnabled ? 1800 : 0;
      startProgressionAnimation(chordCount, cadenceDelay);
    }
  };

  // When a new progression question arrives, auto-start its animation.
  // (For onStart the question is freshly generated inside the hook; we
  // detect this via the question id changing while quizPhase === 'playing'.)
  useEffect(() => {
    if (activeExercise.id !== 'progression') return;
    if (quizPhase !== 'playing' || !question) return;
    const chordCount = (question.payload as ProgressionPayload).chordIds.length;
    const cadenceDelay = cadenceEnabled ? 1800 : 0;
    startProgressionAnimation(chordCount, cadenceDelay);
    // The effect deliberately only depends on the question id + exercise id —
    // we want it to fire once per new question, not on every re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.pickId, activeExercise.id]);

  // Step-through (post-answer): clicking a slot replays that chord and
  // sets the highlight index. Only valid once the answer is locked in.
  const handleSlotReview = (idx: number) => {
    if (!question) return;
    clearProgTimers();
    setProgChordIdx(idx);
    playProgressionChord(question as { payload: ProgressionPayload }, idx, instrument);
  };

  // Play a chord by its Roman-numeral id — used during entry so the user
  // hears the chord they just picked. Voices the chord in the question's key.
  const handlePlayChord = (chordId: string) => {
    if (!question) return;
    const ch = PROGRESSION_CHORD_MAP[chordId];
    if (!ch) return;
    const keyRoot = (question.payload as ProgressionPayload).keyRoot;
    let rm = keyRoot + ch.rootOffset;
    while (rm + Math.max(...ch.iv) > 79) rm -= 12;
    while (rm < 57) rm += 12;
    ch.iv.forEach((iv: number) => pm(instrument, rm + iv, 0));
  };

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
    if (activeExercise.id === 'progression') {
      // ── Progression mode ─────────────────────────────────────────────
      // Before the user answers, we deliberately HIDE the chord notes —
      // otherwise they could just read the chord off the piano keys/labels
      // and there's nothing to identify. We only show the key tonic so the
      // user keeps the key in view. The active slot in the slot bar still
      // pulses to indicate which chord is currently playing.
      //
      // After answer (quizPhase === 'answered'), the full chord notes are
      // revealed and the step-through review is enabled.
      const payload = question.payload as ProgressionPayload;
      if (quizPhase === 'answered' && progChordIdx !== null) {
        const live = '#a78bfa';
        const curr = progressionChordNotes(
          question as { payload: ProgressionPayload }, progChordIdx,
        );
        curr.forEach((n) => { highlights[n] = live; });
      }
      // Key tonic always shown so the user keeps the key in view
      highlights[payload.keyRoot] = highlights[payload.keyRoot] ?? '#6366f1';
    } else if (activeExercise.id === 'modeHarmony') {
      // ── Modal Harmony: hide notes pre-answer, show tonic + diagnostic after
      highlights[question.root] = '#6366f1';
      if (quizPhase === 'answered') {
        const modePayload = question.payload as { modeId: string; keyRoot: number };
        const mode = MODE_MAP[modePayload.modeId];
        if (mode) {
          // Tonic chord notes in accent
          const tonicRoot = modePayload.keyRoot + mode.tonic.rootOffset;
          mode.tonic.iv.forEach((iv) => { highlights[tonicRoot + iv] = mode.co; });
          // Diagnostic chord notes in a lighter colour
          const diagRoot = modePayload.keyRoot + mode.diagnostic.rootOffset;
          mode.diagnostic.iv.forEach((iv) => { highlights[diagRoot + iv] = '#a78bfa'; });
        }
      }
    } else if (activeExercise.id === 'scaleId') {
      // ── Scale: show only root pre-answer; ascending notes post-answer.
      // Descending notes excluded — showing both up and down was the mess.
      highlights[question.root] = '#6366f1';
      if (quizPhase === 'answered' && feedbackInfo) {
        const scalePayload = question.payload as { scaleId: string; keyRoot: number };
        const scale = SCALE_MAP[scalePayload.scaleId];
        if (scale) {
          const accent = scale.co;
          const softer = accent + '99'; // 60% opacity via hex alpha
          scale.intervals.forEach((iv) => {
            const n = scalePayload.keyRoot + iv;
            highlights[n] = iv === 0 ? accent : softer;
          });
          const octave = scalePayload.keyRoot + 12;
          if (octave <= 79) highlights[octave] = accent;
        }
      }
    } else {
      // ── Standard exercises: original behaviour
      highlights[question.root] = '#6366f1';
      if (quizPhase === 'answered' && feedbackInfo) {
        const accent = feedbackInfo.color;
        question.notes.forEach((n) => { if (n !== question.root) highlights[n] = accent; });
      }
    }
  }

  let pianoLabel = '';
  let pianoLabelColor = '#6366f1';
  if (activeExercise.id === 'progression' && question) {
    const payload = question.payload as ProgressionPayload;
    if (quizPhase === 'answered' && progChordIdx !== null) {
      // Post-answer: show the chord identity in the label
      const chId = payload.chordIds[progChordIdx];
      pianoLabel = `Chord ${progChordIdx + 1} of ${payload.chordIds.length} · ${chId}`;
      pianoLabelColor = '#a78bfa';
    } else if (progChordIdx !== null) {
      // During playback (pre-answer): hint at progress without revealing the chord
      pianoLabel = `Chord ${progChordIdx + 1} of ${payload.chordIds.length}`;
      pianoLabelColor = '#a78bfa';
    } else {
      pianoLabel = question.displayLabel ?? `Key: ${m2d(payload.keyRoot)}`;
    }
  } else if (activeExercise.id === 'modeHarmony' && question) {
    if (quizPhase === 'answered') {
      const modePayload = question.payload as { modeId: string };
      const mode = MODE_MAP[modePayload.modeId];
      pianoLabel = mode ? `${mode.tonic.rn} → ${mode.diagnostic.rn} · ${mode.n}` : '';
      pianoLabelColor = mode?.co ?? '#6366f1';
    } else {
      pianoLabel = 'Listen for the diagnostic chord pair';
      pianoLabelColor = '#6366f1';
    }
  } else if (question && quizPhase === 'answered') {
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
      {activeExercise.id === 'distance' && (
        <DistanceDirectionToggle value={distanceDirection} onChange={onDistanceDirectionChange} />
      )}
      {activeExercise.id !== 'melody' && <KeyRow keyName={keyName} onChange={onKeyChange} />}
      {activeExercise.id !== 'melody' && <CadenceToggle on={cadenceEnabled} onChange={onCadenceChange} />}
      {activeExercise.id === 'triad' && <SpreadToggle on={spread} onChange={onSpreadChange} />}
      {activeExercise.id === 'triad' && <ArpeggioToggle on={arpeggio} onChange={onArpeggioChange} />}
      {activeExercise.id === 'modeHarmony' && <ModeChordCountToggle value={modeChordCount} onChange={onModeChordCountChange} />}
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
            onReplay={handleReplay}
            onNext={handleNext}
          />

          {activeExercise.id === 'progression' && question ? (
            <ProgressionAnswerBuilder
              answers={answers}
              slotCount={(question.payload as { chordIds: string[] }).chordIds.length}
              guessedString={feedback?.guess !== undefined ? String(feedback.guess) : null}
              correctString={quizPhase === 'answered' && correctId !== null ? String(correctId) : null}
              locked={quizPhase === 'answered'}
              activeChordIdx={progChordIdx}
              onSubmit={onGuess}
              onReviewSlot={handleSlotReview}
              onPlayChord={handlePlayChord}
            />
          ) : (
            <AnswerGrid
              answers={answers}
              correctId={quizPhase === 'answered' ? correctId : null}
              guessedId={feedback?.guess ?? null}
              locked={quizPhase === 'answered'}
              onGuess={onGuess}
            />
          )}

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
    { id: 'interval',    n: 1, label: 'Intervals',    color: '#6366f1' },
    { id: 'distance',    n: 2, label: 'Distance',     color: '#8b5cf6' },
    { id: 'triad',       n: 3, label: 'Chords',       color: '#c084fc' },
    { id: 'progression', n: 4, label: 'Progressions', color: '#e879f9' },
    { id: 'modeHarmony', n: 5, label: 'Modes',        color: '#06b6d4' },
    { id: 'scaleId',     n: 6, label: 'Scales',       color: '#10b981' },
    { id: null,          n: 7, label: 'More soon',    color: null },
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
