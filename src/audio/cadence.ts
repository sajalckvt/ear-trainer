import { pm, type InstrumentId } from './engine';
import { SAMPLE_LO, SAMPLE_HI } from '../data/constants';

/**
 * Play a simple single-note I-IV-V-I cadence in the key of `rootMidi`,
 * then fire `cb` once the cadence completes.
 *
 * The root is shifted up/down an octave if needed to keep I+P5 in sample range.
 */
export function playCadence(
  rootMidi: number,
  instId: InstrumentId,
  enabled: boolean,
  cb: () => void
): void {
  if (!enabled) {
    cb();
    return;
  }
  let I = rootMidi;
  while (I + 7 > SAMPLE_HI) I -= 12;
  while (I < SAMPLE_LO) I += 12;

  pm(instId, I, 0);
  setTimeout(() => pm(instId, I + 5, 0), 400);
  setTimeout(() => pm(instId, I + 7, 0), 800);
  setTimeout(() => pm(instId, I, 0), 1200);
  setTimeout(cb, 1800);
}
