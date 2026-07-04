/**
 * Synth Copy — a hidden synth patch drones on ("Question"): waveform,
 * filter type + cutoff, and an LFO routed to pitch, filter or amp. Rebuild
 * the patch on your own voice ("Yours"), confirm.
 *
 * The whole synth is always visible. The chosen level decides how many
 * parameters are quizzed (the rest are given — shown disabled at their
 * target values): L1 waveform · L2 +cutoff · L3 +filter type · L4+ +LFO.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ABLoopPlayer } from '../audioCore';
import { ensureCtx } from '../../audio/engine';
import { freqAccuracy, linearAccuracy, fmtFreq } from '../scoring';
import { useStageGame, usePlayerTeardown } from '../useStageGame';
import { GameShell, ABToggle } from '../GameShell';
import { getProgress } from '../progress';

const GAME_ID = 'synth-copy';

const WAVES = ['sine', 'triangle', 'sawtooth', 'square'] as const;
const WAVE_LABELS = ['sine', 'tri', 'saw', 'sq'];
const FILTERS = ['lowpass', 'highpass'] as const;
const LFO_TARGETS = ['pitch', 'filter', 'amp'] as const;

type Wave = (typeof WAVES)[number];
type FilterT = (typeof FILTERS)[number];
type LfoTarget = (typeof LFO_TARGETS)[number];

export interface Patch {
  wave: Wave;
  filterType: FilterT;
  cutoff: number;      // Hz
  lfoTarget: LfoTarget;
  lfoRate: number;     // Hz
  lfoDepth: number;    // 0..1 (0 = LFO off)
}

const BASE_HZ = 110;

function levelCfg(level: number) {
  return {
    stages: 6,
    adjustCutoff: level >= 2,
    adjustFilterType: level >= 3,
    adjustLfo: level >= 4,
    cutoffZeroOct: Math.max(2 - (level - 2) * 0.25, 1),
  };
}

/** Combined patch accuracy over the adjustable parts (verified numerically). */
export function patchAccuracy(
  guess: Patch,
  target: Patch,
  adj: { cutoff: boolean; filterType: boolean; lfo: boolean },
  cutoffZeroOct: number,
): number {
  const parts = [guess.wave === target.wave ? 1 : 0];
  if (adj.cutoff) parts.push(freqAccuracy(guess.cutoff, target.cutoff, cutoffZeroOct));
  if (adj.filterType) parts.push(guess.filterType === target.filterType ? 1 : 0);
  if (adj.lfo) {
    parts.push(
      (
        (guess.lfoTarget === target.lfoTarget ? 1 : 0) +
        freqAccuracy(guess.lfoRate, target.lfoRate, 2) +
        linearAccuracy(guess.lfoDepth, target.lfoDepth, 1)
      ) / 3,
    );
  }
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

// Cutoff slider: 0..1 ↔ 100..12000 Hz (log)
export const sliderToCutoff = (v: number) => Math.round(100 * Math.pow(12000 / 100, v));
export const cutoffToSlider = (hz: number) => Math.log(hz / 100) / Math.log(12000 / 100);

// ─── Synth voice ─────────────────────────────────────────────────────────────

interface Voice {
  setPatch: (p: Patch) => void;
  stop: () => void;
}

function makeVoice(dest: AudioNode): Voice {
  const ctx = ensureCtx();
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();

  osc.frequency.value = BASE_HZ;
  filter.Q.value = 1.5;
  amp.gain.value = 0.5;
  lfo.type = 'sine';
  lfoGain.gain.value = 0;

  osc.connect(filter);
  filter.connect(amp);
  amp.connect(dest);
  lfo.connect(lfoGain);
  osc.start();
  lfo.start();

  let connectedTo: LfoTarget | null = null;

  const setPatch = (p: Patch) => {
    osc.type = p.wave;
    filter.type = p.filterType;
    filter.frequency.value = p.cutoff;
    lfo.frequency.value = p.lfoRate;

    if (connectedTo !== p.lfoTarget) {
      try { lfoGain.disconnect(); } catch { /* not connected yet */ }
      if (p.lfoTarget === 'pitch') lfoGain.connect(osc.detune);
      else if (p.lfoTarget === 'filter') lfoGain.connect(filter.detune);
      else lfoGain.connect(amp.gain);
      connectedTo = p.lfoTarget;
    }
    // depth scaling per destination (cents / cents / linear gain)
    lfoGain.gain.value =
      p.lfoTarget === 'pitch' ? p.lfoDepth * 400 :
      p.lfoTarget === 'filter' ? p.lfoDepth * 2400 :
      p.lfoDepth * 0.35;
  };

  const stop = () => {
    try { osc.stop(); lfo.stop(); } catch { /* already stopped */ }
    osc.disconnect(); lfo.disconnect(); lfoGain.disconnect(); filter.disconnect(); amp.disconnect();
  };

  return { setPatch, stop };
}

// ─── Game ────────────────────────────────────────────────────────────────────

const DEFAULT_PATCH: Patch = {
  wave: 'sawtooth',
  filterType: 'lowpass',
  cutoff: 12000,
  lfoTarget: 'pitch',
  lfoRate: 2,
  lfoDepth: 0,
};

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const logUniform = (lo: number, hi: number) => lo * Math.pow(hi / lo, Math.random());

export function SynthCopy() {
  const [level, setLevel] = useState(() => getProgress(GAME_ID).level);
  const [stagesSel, setStagesSel] = useState<number | null>(null);
  const cfg = levelCfg(level);

  const playerRef = useRef<ABLoopPlayer | null>(null);
  const voicesRef = useRef<[Voice, Voice] | null>(null);
  const targetRef = useRef<Patch>(DEFAULT_PATCH);
  const [patch, setPatch] = useState<Patch>(DEFAULT_PATCH);
  const [ab, setAb] = useState(0);
  const [reveal, setReveal] = useState<Patch | null>(null);

  const ensurePlayer = useCallback((): ABLoopPlayer => {
    if (playerRef.current) return playerRef.current;
    const player = new ABLoopPlayer(2, 0.2);
    player.passthrough(0);
    player.passthrough(1);
    player.startSilent();
    const v0 = makeVoice(player.chain(0).input);
    const v1 = makeVoice(player.chain(1).input);
    voicesRef.current = [v0, v1];
    playerRef.current = player;
    return player;
  }, []);

  const onStage = useCallback(() => {
    setReveal(null);
    setAb(0);
    const target: Patch = {
      wave: pick(WAVES),
      filterType: cfg.adjustFilterType ? pick(FILTERS) : 'lowpass',
      cutoff: cfg.adjustCutoff ? Math.round(logUniform(200, 8000)) : 12000,
      lfoTarget: cfg.adjustLfo ? pick(LFO_TARGETS) : 'pitch',
      lfoRate: cfg.adjustLfo ? Math.round(logUniform(0.5, 8) * 10) / 10 : 2,
      lfoDepth: cfg.adjustLfo ? Math.round((0.4 + Math.random() * 0.6) * 100) / 100 : 0,
    };
    targetRef.current = target;
    // your voice starts at the locked params + neutral quizzed params
    const start: Patch = {
      wave: 'sine',
      filterType: cfg.adjustFilterType ? 'lowpass' : target.filterType,
      cutoff: cfg.adjustCutoff ? 2000 : target.cutoff,
      lfoTarget: target.lfoTarget,
      lfoRate: cfg.adjustLfo ? 2 : target.lfoRate,
      lfoDepth: cfg.adjustLfo ? 0 : target.lfoDepth,
    };
    setPatch(start);
    const p = ensurePlayer();
    voicesRef.current![0].setPatch(target);
    voicesRef.current![1].setPatch(start);
    p.select(0);
  }, [cfg.adjustCutoff, cfg.adjustFilterType, cfg.adjustLfo, ensurePlayer]);

  const game = useStageGame({ gameId: GAME_ID, level, stages: stagesSel ?? cfg.stages, onStage });
  usePlayerTeardown(game.phase, playerRef);

  // voices die with the player
  useEffect(() => {
    if (game.phase === 'complete' || game.phase === 'intro') {
      voicesRef.current?.forEach((v) => v.stop());
      voicesRef.current = null;
    }
  }, [game.phase]);
  useEffect(() => () => { voicesRef.current?.forEach((v) => v.stop()); voicesRef.current = null; }, []);

  const change = (p: Partial<Patch>) => {
    setPatch((prev) => {
      const next = { ...prev, ...p };
      voicesRef.current?.[1].setPatch(next);
      return next;
    });
  };

  const selectAb = (i: number) => {
    setAb(i);
    playerRef.current?.select(i);
  };

  const confirm = () => {
    if (game.phase !== 'playing') return;
    const acc = patchAccuracy(
      patch,
      targetRef.current,
      { cutoff: cfg.adjustCutoff, filterType: cfg.adjustFilterType, lfo: cfg.adjustLfo },
      cfg.cutoffZeroOct,
    );
    setReveal(targetRef.current);
    game.submit(acc);
  };

  const locked = !!reveal || game.phase !== 'playing';

  return (
    <GameShell
      game={game}
      level={level}
      maxLevel={6}
      onLevel={setLevel}
      onStages={setStagesSel}
      title="Synth Copy"
      instruction="Rebuild the synth patch by ear"
      accent="#6d8fb3"
      controls={
        <>
          <ABToggle labels={['Question', 'Yours']} active={ab} onSelect={selectAb} />
          <button className="studio-confirm" onClick={confirm} disabled={game.phase !== 'playing'}>
            ✓ Confirm
          </button>
        </>
      }
    >
      <div className="synth-panel">
        <div className="synth-row">
          <span className="synth-label">Wave</span>
          {WAVES.map((w, i) => (
            <button
              key={w}
              className={`synth-pill${patch.wave === w ? ' on' : ''}`}
              disabled={locked}
              onClick={() => change({ wave: w })}
            >
              {WAVE_LABELS[i]}
            </button>
          ))}
        </div>

        <div className={`synth-row${!cfg.adjustFilterType ? ' given' : ''}`}>
          <span className="synth-label">Filter</span>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`synth-pill${patch.filterType === f ? ' on' : ''}`}
              disabled={locked || !cfg.adjustFilterType}
              onClick={() => change({ filterType: f })}
            >
              {f === 'lowpass' ? 'LP' : 'HP'}
            </button>
          ))}
        </div>

        <div className={`synth-row${!cfg.adjustCutoff ? ' given' : ''}`}>
          <span className="synth-label">Cutoff</span>
          <input
            type="range" min={0} max={1} step={0.005}
            value={cutoffToSlider(patch.cutoff)}
            disabled={locked || !cfg.adjustCutoff}
            onChange={(e) => change({ cutoff: sliderToCutoff(Number(e.target.value)) })}
          />
          <span className="synth-val">{fmtFreq(patch.cutoff)}</span>
        </div>

        <div className={`synth-row${!cfg.adjustLfo ? ' given' : ''}`}>
          <span className="synth-label">LFO →</span>
          {LFO_TARGETS.map((t) => (
            <button
              key={t}
              className={`synth-pill${patch.lfoTarget === t ? ' on' : ''}`}
              disabled={locked || !cfg.adjustLfo}
              onClick={() => change({ lfoTarget: t })}
            >
              {t}
            </button>
          ))}
        </div>
        <div className={`synth-row${!cfg.adjustLfo ? ' given' : ''}`}>
          <span className="synth-label">Rate</span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={Math.log(patch.lfoRate / 0.5) / Math.log(8 / 0.5)}
            disabled={locked || !cfg.adjustLfo}
            onChange={(e) => change({ lfoRate: Math.round(0.5 * Math.pow(8 / 0.5, Number(e.target.value)) * 10) / 10 })}
          />
          <span className="synth-val">{patch.lfoRate} Hz</span>
          <span className="synth-label">Depth</span>
          <input
            type="range" min={0} max={1} step={0.01}
            value={patch.lfoDepth}
            disabled={locked || !cfg.adjustLfo}
            onChange={(e) => change({ lfoDepth: Number(e.target.value) })}
          />
          <span className="synth-val">{patch.lfoDepth}</span>
        </div>

        {reveal && (
          <div className="synth-reveal">
            Target: {reveal.wave} · {reveal.filterType === 'lowpass' ? 'LP' : 'HP'} @ {fmtFreq(reveal.cutoff)}
            {reveal.lfoDepth > 0
              ? ` · LFO ${reveal.lfoTarget} ${reveal.lfoRate} Hz, depth ${reveal.lfoDepth}`
              : ' · no LFO'}
          </div>
        )}
      </div>
      <div className="studio-hint">
        Level {level} · A/B against the question drone, match the patch, confirm
      </div>
    </GameShell>
  );
}
