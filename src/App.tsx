import { useCallback, useEffect, useMemo, useState } from 'react';
import { EXERCISES } from './exercises';
import { useQuizState } from './hooks/useQuizState';
import { useTrainingTimer } from './hooks/useTrainingTimer';
import { loadSoundfont, registerAudioUnlock, type InstrumentId } from './audio/engine';
import { NavTabs } from './components/Controls';
import { TrainPage } from './pages/TrainPage';
import { ReferencePage } from './pages/ReferencePage';

type Screen = 'train' | 'ref';

export default function App() {
  // ─── Initialize audio and load soundfont once ────────────────────────────
  useEffect(() => {
    registerAudioUnlock();
    loadSoundfont().catch((err) => console.error('Soundfont load failed:', err));
  }, []);

  // ─── App-level settings state ────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('train');
  const [exerciseId, setExerciseId] = useState<string>('interval');
  const [levelIndex, setLevelIndex] = useState<number>(0);
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [keyName, setKeyName] = useState<string>('C');
  const [cadenceEnabled, setCadenceEnabled] = useState<boolean>(false);
  const [instrument, setInstrument] = useState<InstrumentId>('acoustic_grand_piano');

  const activeExercise = useMemo(
    () => EXERCISES.find((e) => e.id === exerciseId) ?? EXERCISES[0],
    [exerciseId]
  );

  // ─── Quiz session ────────────────────────────────────────────────────────
  const { session, nextQuestion, replay, answer, resetScore, resetQuestion } = useQuizState({
    exercise: activeExercise,
    levelIndex,
    keyName,
    direction,
    cadenceEnabled,
    instrument,
  });

  // ─── Weekly timer ────────────────────────────────────────────────────────
  const { formatted: timerLabel, reset: resetTimer } = useTrainingTimer();

  // ─── Event handlers that also reset the current question ────────────────
  const handleExerciseChange = useCallback((id: string) => {
    setExerciseId(id);
    setLevelIndex(0);
    resetQuestion();
  }, [resetQuestion]);

  const handleLevelChange = useCallback((i: number) => {
    setLevelIndex(i);
    resetQuestion();
  }, [resetQuestion]);

  return (
    <div className="app">
      <div className="hdr">
        <h1>♪ Ear Trainer</h1>
        <div className="sub">Intervals &amp; Triads</div>
      </div>

      <NavTabs screen={screen} onChange={setScreen} />

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
        instrument={instrument}
        onInstrumentChange={setInstrument}
        question={session.question}
        feedback={session.feedback}
        correct={session.correct}
        total={session.total}
        streak={session.streak}
        best={session.best}
        timerLabel={timerLabel}
        onStart={nextQuestion}
        onReplay={replay}
        onNext={nextQuestion}
        onGuess={answer}
        onResetScore={resetScore}
        onResetTimer={resetTimer}
      />

      <ReferencePage
        visible={screen === 'ref'}
        instrument={instrument}
        onInstrumentChange={setInstrument}
      />
    </div>
  );
}
