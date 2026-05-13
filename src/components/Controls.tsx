import type { Exercise } from '../exercises/types';
import { INSTS, NN } from '../data/constants';
import type { InstrumentId } from '../audio/engine';

// ─── Nav (Train / Reference tabs) ──────────────────────────────────────────
export function NavTabs({
  screen,
  onChange,
}: {
  screen: 'train' | 'ref';
  onChange: (s: 'train' | 'ref') => void;
}) {
  return (
    <div className="nav-row">
      <button className={`nb${screen === 'train' ? ' on' : ''}`} onClick={() => onChange('train')}>
        🎯 Train
      </button>
      <button className={`nb${screen === 'ref' ? ' on' : ''}`} onClick={() => onChange('ref')}>
        📚 Reference
      </button>
    </div>
  );
}

// ─── Phase selector (which exercise is active) ────────────────────────────
export function PhaseSelector({
  exercises,
  activeId,
  onChange,
}: {
  exercises: ReadonlyArray<Exercise<unknown>>;
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="phase-row">
      {exercises.map((ex) => (
        <button
          key={ex.id}
          className={`phase-btn${activeId === ex.id ? ' on' : ''}`}
          onClick={() => onChange(ex.id)}
        >
          {ex.name}
        </button>
      ))}
    </div>
  );
}

// ─── Level + Direction pills ──────────────────────────────────────────────
export function LevelDirRow({
  levels,
  levelIndex,
  onLevelChange,
  showDirection,
  direction,
  onDirectionChange,
}: {
  levels: ReadonlyArray<{ n: string }>;
  levelIndex: number;
  onLevelChange: (i: number) => void;
  showDirection: boolean;
  direction: 'asc' | 'desc';
  onDirectionChange: (d: 'asc' | 'desc') => void;
}) {
  return (
    <div className="ctrl-row">
      <div className="pg">
        {levels.map((lv, i) => (
          <button
            key={lv.n}
            className={`pill${levelIndex === i ? ' on' : ''}`}
            onClick={() => onLevelChange(i)}
          >
            {lv.n}
          </button>
        ))}
      </div>
      {showDirection && (
        <div className="pg">
          {(['asc', 'desc'] as const).map((d) => (
            <button
              key={d}
              className={`pill${direction === d ? ' on' : ''}`}
              onClick={() => onDirectionChange(d)}
            >
              {d === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Distance direction toggle ────────────────────────────────────────────
export function DistanceDirectionToggle({
  value,
  onChange,
}: {
  value: 'asc' | 'desc' | 'both';
  onChange: (v: 'asc' | 'desc' | 'both') => void;
}) {
  return (
    <div className="ctrl-row">
      <div className="pg">
        {(['asc', 'desc', 'both'] as const).map((d) => (
          <button
            key={d}
            className={`pill${value === d ? ' on' : ''}`}
            onClick={() => onChange(d)}
          >
            {d === 'asc' ? '↑ Asc' : d === 'desc' ? '↓ Desc' : '↕ Both'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Key selector ─────────────────────────────────────────────────────────
export function KeyRow({
  keyName,
  onChange,
}: {
  keyName: string;
  onChange: (k: string) => void;
}) {
  return (
    <div className="key-row">
      {NN.map((k) => (
        <button
          key={k}
          className={`kb${keyName === k ? ' on' : ''}`}
          onClick={() => onChange(k)}
        >
          {k}
        </button>
      ))}
    </div>
  );
}

// ─── Cadence toggle ───────────────────────────────────────────────────────
export function CadenceToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="trow">
      <span>I–IV–V cadence</span>
      <span
        role="switch"
        aria-checked={on}
        tabIndex={0}
        className={`tog${on ? ' on' : ''}`}
        onClick={() => onChange(!on)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onChange(!on);
        }}
      />
    </div>
  );
}

// ─── Spread voicing toggle (chord exercise only) ──────────────────────────
export function SpreadToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="trow">
      <span>
        Spread voicing
        <span className="trow-sub"> · chord tones across 1 octave</span>
      </span>
      <span
        role="switch"
        aria-checked={on}
        tabIndex={0}
        className={`tog${on ? ' on' : ''}`}
        onClick={() => onChange(!on)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onChange(!on);
        }}
      />
    </div>
  );
}

// ─── Arpeggio toggle (chord exercise only) ────────────────────────────────
export function ArpeggioToggle({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="trow">
      <span>
        Arpeggiate first
        <span className="trow-sub"> · {on ? 'note-by-note, then stacked' : 'stacked only'}</span>
      </span>
      <span
        role="switch"
        aria-checked={on}
        tabIndex={0}
        className={`tog${on ? ' on' : ''}`}
        onClick={() => onChange(!on)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onChange(!on);
        }}
      />
    </div>
  );
}

// ─── Instrument picker ────────────────────────────────────────────────────
export function InstrumentPicker({
  instrument,
  onChange,
}: {
  instrument: InstrumentId;
  onChange: (id: InstrumentId) => void;
}) {
  return (
    <div className="inst-row">
      {INSTS.map((inst) => (
        <button
          key={inst.id}
          className={`ib${instrument === inst.id ? ' on' : ''}`}
          onClick={() => onChange(inst.id as InstrumentId)}
        >
          {inst.ic} {inst.lb}
        </button>
      ))}
    </div>
  );
}
