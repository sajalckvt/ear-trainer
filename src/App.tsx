import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EXERCISES } from './exercises';
import { useQuizState } from './hooks/useQuizState';
import { useTrainingTimer } from './hooks/useTrainingTimer';
import { loadSoundfont, registerAudioUnlock, pm, type InstrumentId } from './audio/engine';
import { keyToOffset } from './audio/theory';
import { NavTabs } from './components/Controls';
import { TrainPage } from './pages/TrainPage';
import { ReferencePage } from './pages/ReferencePage';
import { SAMPLE_LO, SAMPLE_HI, NN } from './data/constants';

type Screen = 'train' | 'ref';

// ─── Mistake tracking ────────────────────────────────────────────────────────

export interface MistakeEntry {
  guess: string;
  correct: string;
  exerciseId: string;
  levelIndex: number;
}

/** Analyse the last N mistakes and return the top confusion pairs with advice. */
export function analyzeMistakes(
  mistakes: MistakeEntry[],
  exerciseId: string,
): { pair: string; count: number; tip: string }[] {
  // Only analyse mistakes from the CURRENT exercise — confusion pairs from
  // other exercises (e.g. chord-quality mix-ups) must never surface while
  // the user is training something unrelated (e.g. interval distance).
  const scoped = mistakes.filter((m) => m.exerciseId === exerciseId);
  if (scoped.length < 3) return [];

  // Count confusion pairs: "guessed X, was Y"
  const counts: Record<string, number> = {};
  for (const m of scoped) {
    if (m.guess === m.correct) continue;
    const key = `${m.guess}→${m.correct}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  // Sort by frequency
  const sorted = Object.entries(counts)
    .filter(([, n]) => n >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  return sorted.map(([key, count]) => {
    const [guess, correct] = key.split('→');
    return { pair: `${guess} → ${correct}`, count, tip: confusionTip(guess, correct) };
  });
}

function confusionTip(guess: string, correct: string): string {
  const pair = [guess, correct].sort().join('|');
  const tips: Record<string, string> = {
    'IV|V':     'IV feels open/stable; V feels tense, wants to pull back to I',
    'I|IV':     'I is fully home; IV steps away — listen for the resolution feel',
    'I|vi':     'vi shares 2 notes with I but has a minor, darker colour',
    'IV|vi':    'vi starts on the 6th degree (minor); IV is brighter and major',
    'ii|IV':    'Both subdominant — ii is minor (softer), IV is major (brighter)',
    'ii|V':     'ii is subdominant, V is dominant — V has more pull toward I',
    'V|V7':     'V7 adds a ♭7 — that tritone inside is the difference you hear',
    'I|Imaj7':  'Imaj7 has a maj7 on top — listen for the dreamy added colour',
    'bVII|IV':  '♭VII has a flat root (Mixolydian); IV is diatonic and brighter',
    'bVI|IV':   '♭VI sits a half-step below V — darker and more dramatic than IV',
    'V9|V7':    'V9 adds a 9th above — fuller, less raw than the plain V7',
    'V7b9|V7':  'V7♭9 has a chromatic ♭9 — listen for the Spanish/flamenco edge',
  };
  return tips[pair] ?? `You often pick ${guess} when the answer is ${correct} — listen for the quality difference`;
}

// ─── Key nudge ────────────────────────────────────────────────────────────────
// After KEY_NUDGE_STREAK consecutive correct answers, auto-rotate to a new key
// and play a I-IV-V-I cadence to orient the user.

const KEY_NUDGE_STREAK = 8;

function nextKey(current: string): string {
  const keys = [...NN];
  const idx = keys.indexOf(current as typeof NN[number]);
  // Cycle through common practice keys: cycle by a 4th (5 semitones)
  const next = (idx + 5) % 12;
  return keys[next];
}

function playOrientingCadence(keyName: string, instId: InstrumentId): void {
  const offset = keyToOffset(keyName);
  let root = 60 + offset;
  while (root + 7 > SAMPLE_HI) root -= 12;
  while (root < SAMPLE_LO) root += 12;
  // I chord
  [0, 4, 7].forEach((iv) => pm(instId, root + iv, 0));
  // IV chord
  [0, 4, 7].forEach((iv) => pm(instId, root + 5 + iv, 0.7));
  // V chord
  [0, 4, 7].forEach((iv) => pm(instId, root + 7 + iv, 1.4));
  // I chord
  [0, 4, 7].forEach((iv) => pm(instId, root + iv, 2.1));
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  useEffect(() => {
    registerAudioUnlock();
    loadSoundfont().catch((err) => console.error('Soundfont load failed:', err));
  }, []);

  const [screen, setScreen] = useState<Screen>('train');
  const [exerciseId, setExerciseId] = useState<string>('interval');
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [keyName, setKeyName] = useState<string>('C');
  const [cadenceEnabled, setCadenceEnabled] = useState<boolean>(false);
  const [spread, setSpread] = useState<boolean>(false);
  const [arpeggio, setArpeggio] = useState<boolean>(true);
  const [humanize, setHumanize] = useState<boolean>(false);
  // Dynamics vary automatically by default; user may lock to a fixed level.
  const [varyDynamics, setVaryDynamics] = useState<boolean>(true);
  const [dynamics, setDynamics] = useState<'soft' | 'medium' | 'hard'>('medium');
  const [modeChordCount, setModeChordCount] = useState<number>(2);
  const [distanceDirection, setDistanceDirection] = useState<'asc' | 'desc' | 'both'>('both');
  // Interval placement mode: anchored (fixed root) or free (random pitches).
  const [intervalMode, setIntervalMode] = useState<'anchored' | 'free'>('anchored');
  const [instrument, setInstrument] = useState<InstrumentId>('acoustic_grand_piano');
  const [progressionLength, setProgressionLength] = useState<number | undefined>(undefined);

  // Mistake tracking — rolling buffer of last 50 wrong answers
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [keyNudge, setKeyNudge] = useState<{ toKey: string } | null>(null);
  // Item 2: the mistake-pattern insight shows for exactly one turn, then auto-dismisses.
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const nudgeStreakRef = useRef(0);

  const activeExercise = useMemo(
    () => EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0],
    [exerciseId]
  );

  // -1 signals 'varying' to the exercises; otherwise a fixed base velocity.
  const dynamicsVel = varyDynamics
    ? -1
    : (dynamics === 'soft' ? 0.5 : dynamics === 'hard' ? 1 : 0.75);

  const { session, nextQuestion, replay, answer, resetScore, resetQuestion } = useQuizState({
    exercise: activeExercise, levelIndex, keyName, direction, distanceDirection,
    cadenceEnabled, spread, arpeggio, humanize, dynamics: dynamicsVel,
    modeChordCount, instrument, progressionLength, intervalMode,
  });

  const { formatted: timerLabel, reset: resetTimer } = useTrainingTimer();

  // Track mistakes and correct streaks for nudging
  const handleAnswer = useCallback((guess: string | number) => {
    answer(guess);
  }, [answer]);

  // Watch session feedback to track results
  const prevFeedbackRef = useRef(session.feedback);
  useEffect(() => {
    const fb = session.feedback;
    if (!fb || fb === prevFeedbackRef.current) return;
    prevFeedbackRef.current = fb;

    if (!fb.ok && session.question) {
      const correctId = String(session.question.pickId);
      const guessStr = String(fb.guess);
      if (guessStr !== correctId) {
        setMistakes((prev) => {
          const entry: MistakeEntry = {
            guess: guessStr,
            correct: correctId,
            exerciseId,
            levelIndex,
          };
          const next = [...prev, entry];
          return next.length > 50 ? next.slice(-50) : next;
        });
        setShowInsights(true);
      }
      nudgeStreakRef.current = 0;
    } else if (fb.ok) {
      nudgeStreakRef.current += 1;
      if (nudgeStreakRef.current >= KEY_NUDGE_STREAK) {
        nudgeStreakRef.current = 0;
        const newKey = nextKey(keyName);
        setKeyName(newKey);
        setKeyNudge({ toKey: newKey });
        playOrientingCadence(newKey, instrument);
        // Auto-dismiss after 4s
        setTimeout(() => setKeyNudge(null), 4000);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.feedback]);

  const handleExerciseChange = useCallback((id: string) => {
    setExerciseId(id);
    setLevelIndex(0);
    resetQuestion();
  }, [resetQuestion]);

  const handleLevelChange = useCallback((i: number) => {
    setLevelIndex(i);
    resetQuestion();
  }, [resetQuestion]);

  // Item 2: advancing to the next question clears the one-turn insight.
  const handleNext = useCallback(() => {
    setShowInsights(false);
    nextQuestion();
  }, [nextQuestion]);

  const mistakeInsights = showInsights ? analyzeMistakes(mistakes, exerciseId) : [];

  return (
    <div className="app">
      <div className="hdr">
        <h1>♪ Ear Trainer</h1>
        <div className="sub">Intervals · Distance · Chords · Progressions · Modes · Scales</div>
      </div>

      <NavTabs screen={screen} onChange={setScreen} />

      {/* Key nudge banner */}
      {keyNudge && (
        <div style={{
          margin: '0 0 10px',
          padding: '10px 14px',
          background: 'rgba(99,102,241,0.12)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 10,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>🎹</span>
          <div>
            <span style={{ fontWeight: 700, color: '#a78bfa' }}>Key change → {keyNudge.toKey}</span>
            <span style={{ color: '#666', marginLeft: 8 }}>Great streak! Here's a I–IV–V–I to orient you.</span>
          </div>
          <button
            onClick={() => setKeyNudge(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14 }}
          >✕</button>
        </div>
      )}

      <TrainPage
        visible={screen === 'train'}
        exercises={EXERCISES}
        activeExercise={activeExercise}
        onExerciseChange={handleExerciseChange}
        levelIndex={levelIndex}
        onLevelChange={handleLevelChange}
        direction={direction}
        onDirectionChange={setDirection}
        keyName={keyName}
        onKeyChange={setKeyName}
        cadenceEnabled={cadenceEnabled}
        onCadenceChange={setCadenceEnabled}
        spread={spread}
        onSpreadChange={setSpread}
        arpeggio={arpeggio}
        onArpeggioChange={setArpeggio}
        humanize={humanize}
        onHumanizeChange={setHumanize}
        varyDynamics={varyDynamics}
        onVaryDynamicsChange={setVaryDynamics}
        dynamics={dynamics}
        onDynamicsChange={setDynamics}
        distanceDirection={distanceDirection}
        onDistanceDirectionChange={setDistanceDirection}
        intervalMode={intervalMode}
        onIntervalModeChange={setIntervalMode}
        modeChordCount={modeChordCount}
        onModeChordCountChange={setModeChordCount}
        progressionLength={progressionLength}
        onProgressionLengthChange={setProgressionLength}
        instrument={instrument}
        onInstrumentChange={setInstrument}
        question={session.question}
        feedback={session.feedback}
        quizPhase={session.quizPhase}
        correct={session.correct}
        total={session.total}
        streak={session.streak}
        best={session.best}
        nearMisses={session.nearMisses}
        timerLabel={timerLabel}
        onStart={nextQuestion}
        onReplay={replay}
        onNext={handleNext}
        onGuess={handleAnswer}
        onResetScore={resetScore}
        onResetTimer={resetTimer}
        mistakeInsights={mistakeInsights}
        onDismissInsights={() => setShowInsights(false)}
      />

      <ReferencePage
        visible={screen === 'ref'}
        instrument={instrument}
        onInstrumentChange={setInstrument}
      />
    </div>
  );
}
