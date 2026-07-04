/**
 * StudioPage — hub for the production-skills games.
 */

import { useState, type ComponentType } from 'react';
import { EqBoost } from '../studio/games/EqBoost';
import { PanPosition } from '../studio/games/PanPosition';
import { GainDifference } from '../studio/games/GainDifference';
import { StereoWidth } from '../studio/games/StereoWidth';
import { DelayTime } from '../studio/games/DelayTime';
import { ReverbDifference } from '../studio/games/ReverbDifference';
import { Compression } from '../studio/games/Compression';
import { Distortion } from '../studio/games/Distortion';
import { EqMatch } from '../studio/games/EqMatch';
import { EqCopy } from '../studio/games/EqCopy';
import { CompressorCopy } from '../studio/games/CompressorCopy';
import { PanFrequency } from '../studio/games/PanFrequency';
import { MixBalance } from '../studio/games/MixBalance';
import { BeatCopy } from '../studio/games/BeatCopy';
import { SynthCopy } from '../studio/games/SynthCopy';
import { getProgress } from '../studio/progress';

interface GameDef {
  id: string;
  name: string;
  category: string;
  blurb: string;
  icon: string;
  Component: ComponentType;
}

const GAMES: GameDef[] = [
  {
    id: 'eq-boost', name: 'EQ Boost', category: 'Equalization', icon: '🔔',
    blurb: 'A bell EQ boosts one frequency in pink noise. Toggle the EQ, then click the frequency.',
    Component: EqBoost,
  },
  {
    id: 'eq-match', name: 'EQ Match', category: 'Equalization', icon: '📈',
    blurb: 'An EQ curve is shown. Two sounds — pick the one processed with it.',
    Component: EqMatch,
  },
  {
    id: 'eq-copy', name: 'EQ Copy', category: 'Equalization', icon: '🎛️',
    blurb: 'A hidden filter shapes the sound. Recreate it with your own filter, then confirm.',
    Component: EqCopy,
  },
  {
    id: 'compressor-copy', name: 'Compressor Copy', category: 'Dynamics', icon: '🔧',
    blurb: 'Most compressor settings are given — pick the missing one by ear.',
    Component: CompressorCopy,
  },
  {
    id: 'pan-frequency', name: 'Pan + Frequency', category: 'Space', icon: '🎯',
    blurb: 'A filtered sound sits at a pan position and a frequency. Click both on the 2D plane.',
    Component: PanFrequency,
  },
  {
    id: 'gain-difference', name: 'Gain Difference', category: 'Gain', icon: '🎚️',
    blurb: 'Compare the loop before and after a gain change. Pick the dB amount.',
    Component: GainDifference,
  },
  {
    id: 'pan-position', name: 'Pan Position', category: 'Space', icon: '🎧',
    blurb: 'Click where the sound sits in the stereo field. Headphones recommended.',
    Component: PanPosition,
  },
  {
    id: 'stereo-width', name: 'Stereo Width', category: 'Space', icon: '↔️',
    blurb: 'Click how wide the sound spreads across the stereo field.',
    Component: StereoWidth,
  },
  {
    id: 'delay-time', name: 'Delay Time', category: 'Time', icon: '⏱️',
    blurb: 'An echo trails the drums. Pick the delay time in milliseconds.',
    Component: DelayTime,
  },
  {
    id: 'reverb-difference', name: 'Reverb Difference', category: 'Time', icon: '🌫️',
    blurb: 'Three sounds — one has different reverb. Find it.',
    Component: ReverbDifference,
  },
  {
    id: 'compression', name: 'Compression', category: 'Dynamics', icon: '🗜️',
    blurb: 'Two sounds — one is heavily compressed. Pick it.',
    Component: Compression,
  },
  {
    id: 'distortion', name: 'Distortion', category: 'Quality', icon: '🔥',
    blurb: 'Two sounds — one is saturated. Pick it.',
    Component: Distortion,
  },
  {
    id: 'mix-balance', name: 'Mix Balance', category: 'Dynamics', icon: '⚖️',
    blurb: 'Four stems play at hidden levels. Recreate the balance on your faders.',
    Component: MixBalance,
  },
  {
    id: 'beat-copy', name: 'Beat Copy', category: 'Rhythm', icon: '🥁',
    blurb: 'Hear a drum pattern, program it on the 16-step grid before time runs out.',
    Component: BeatCopy,
  },
  {
    id: 'synth-copy', name: 'Synth Copy', category: 'Synthesis', icon: '🌊',
    blurb: 'Rebuild a synth patch by ear: waveform, filter, and LFO at higher levels.',
    Component: SynthCopy,
  },
];

export function StudioPage({ visible }: { visible: boolean }) {
  const [gameId, setGameId] = useState<string | null>(null);

  if (!visible) return null;

  const active = GAMES.find((g) => g.id === gameId);
  if (active) {
    const Game = active.Component;
    return (
      <div>
        <button className="studio-back" onClick={() => setGameId(null)}>‹ All games</button>
        <Game />
      </div>
    );
  }

  return (
    <div className="studio-hub">
      {GAMES.map((g) => {
        const prog = getProgress(g.id);
        return (
          <button key={g.id} className="studio-card" onClick={() => setGameId(g.id)}>
            <div className="studio-card-icon">{g.icon}</div>
            <div className="studio-card-body">
              <div className="studio-card-name">
                {g.name} <span className="studio-card-cat">/ {g.category}</span>
              </div>
              <div className="studio-card-blurb">{g.blurb}</div>
              <div className="studio-card-meta">Level {prog.level}{prog.bestScore > 0 ? ` · best ${prog.bestScore}` : ''}</div>
            </div>
            <div className="studio-card-enter">Enter ›</div>
          </button>
        );
      })}
    </div>
  );
}
