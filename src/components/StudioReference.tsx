/**
 * StudioReference — the theory + mnemonics behind the Studio games, rendered
 * inside the Reference tab. Each subsection has an anchor id that the games'
 * 📖 buttons jump to (via the 'et-goto-ref' event handled in App).
 */

export function StudioReference() {
  return (
    <div className="sref">
      <h2 className="sref-h2">🎛️ Studio — the theory behind the games</h2>

      <section id="ref-eq">
        <h3 className="sref-h3">Frequency landmarks</h3>
        <p className="sref-p">
          For EQ Boost, EQ Copy, EQ Match and Pan + Frequency. Learn these zones by
          name and the rulers stop feeling abstract.
        </p>
        <table className="sref-table">
          <thead>
            <tr><th>Range</th><th>Name</th><th>It sounds…</th><th>Mnemonic</th></tr>
          </thead>
          <tbody>
            <tr><td>40–80 Hz</td><td>Sub / boom</td><td>rumble you feel more than hear</td><td>"the truck outside"</td></tr>
            <tr><td>100–250 Hz</td><td>Mud</td><td>thick, blanket-y warmth</td><td>"mud lives at 200"</td></tr>
            <tr><td>250–500 Hz</td><td>Boxiness</td><td>cardboard-box hollowness</td><td>"singing into a box"</td></tr>
            <tr><td>500 Hz–1 kHz</td><td>Honk</td><td>hooty, horn-like</td><td>"cup your hands over your mouth"</td></tr>
            <tr><td>1–2 kHz</td><td>Nasal</td><td>pinched, telephone-y</td><td>"hold your nose"</td></tr>
            <tr><td>2–5 kHz</td><td>Presence / edge</td><td>forward, harsh when boosted</td><td>"where shouting lives"</td></tr>
            <tr><td>5–8 kHz</td><td>Sibilance</td><td>S's and T's spit at you</td><td>"essss"</td></tr>
            <tr><td>8 kHz+</td><td>Air</td><td>shimmer, sparkle, hiss</td><td>"open a window"</td></tr>
          </tbody>
        </table>
        <p className="sref-p">
          Sweep and listen: when hunting a frequency, imagine boosting a narrow band and
          sweeping it — the spot that jumps out is your answer; engineers find by boosting,
          then cut. And anchor your octaves: A is 110, 220, 440, 880 Hz — every doubling is
          one octave, which is exactly how the game rulers are spaced.
        </p>
      </section>

      <section id="ref-dynamics">
        <h3 className="sref-h3">Compression</h3>
        <p className="sref-p">For Compression, Compressor Copy, Gain Difference and Mix Balance.</p>
        <ul className="sref-ul">
          <li>
            <strong>Attack</strong> = how fast it grabs. Fast attack (0–10 ms) kills the
            transient — drums lose their snap. Slow attack (50 ms+) lets the hit punch
            through, then squashes the tail. Mnemonic: <em>"fast attack, flat drums."</em>
          </li>
          <li>
            <strong>Release</strong> = how fast it lets go. Fast release pumps and breathes
            with the beat; slow release sounds smooth but can choke.
            Mnemonic: <em>"hear it breathing? release is fast."</em>
          </li>
          <li>
            <strong>Ratio</strong> = how hard: 2:1 gentle glue, 4:1 obvious control, 8:1+ squash.
          </li>
          <li>
            <strong>Makeup gain</strong> exists because compression turns things down —
            always level-match before judging, or the louder one just "sounds better."
          </li>
        </ul>
      </section>

      <section id="ref-time">
        <h3 className="sref-h3">Delay times</h3>
        <p className="sref-p">For Delay Time.</p>
        <table className="sref-table">
          <thead><tr><th>ms</th><th>You perceive</th></tr></thead>
          <tbody>
            <tr><td>&lt; 30</td><td>no echo — thickening / doubling</td></tr>
            <tr><td>50–120</td><td>slapback — a tight "flam", rockabilly vocal</td></tr>
            <tr><td>120–350</td><td>distinct short echo, still attached to the note</td></tr>
            <tr><td>&gt; 350</td><td>separate repeats — count them against the beat</td></tr>
          </tbody>
        </table>
        <p className="sref-p">
          Mnemonic: <em>"under 30 is a twin, under 120 a slap, past 350 an answer."</em>{' '}
          Tip: at 120 BPM a quarter note is 500 ms and an eighth is 250 ms — learn to hear
          delays as note values.
        </p>
      </section>

      <section id="ref-space">
        <h3 className="sref-h3">Space: pan, width, reverb</h3>
        <p className="sref-p">For Pan Position, Stereo Width and Reverb Difference.</p>
        <ul className="sref-ul">
          <li>
            <strong>Pan</strong>: level differences between your ears place a sound.
            Close your eyes and point at it before answering.
          </li>
          <li>
            <strong>Width</strong>: mono lives in the center; widening pushes decorrelated
            content to the edges. If nothing would change when you imagine collapsing it to
            mono, it was narrow.
          </li>
          <li>
            <strong>Reverb</strong>: decay length reads as room size — longer tail, bigger
            room. Wet/dry reads as distance — wetter, further away.
          </li>
        </ul>
      </section>

      <section id="ref-synthesis">
        <h3 className="sref-h3">Waveforms &amp; synthesis</h3>
        <p className="sref-p">For Synth Copy and Distortion.</p>
        <ul className="sref-ul">
          <li>
            <strong>sine</strong> = pure, no overtones ("a whistle") ·{' '}
            <strong>triangle</strong> = soft, flute-like ·{' '}
            <strong>saw</strong> = buzzy and full, every harmonic ("a brass section in a
            box") · <strong>square</strong> = hollow, woody, odd harmonics only ("a
            clarinet from a Game Boy")
          </li>
          <li>
            <strong>Filter</strong>: low-pass removes sparkle (darker); high-pass removes
            body (thinner).
          </li>
          <li>
            <strong>LFO destinations</strong>: pitch = <em>vibrato</em>, filter ={' '}
            <em>wah</em>, amp = <em>tremolo</em>. Mnemonic:{' '}
            <em>"vibrato wobbles the note, tremolo wobbles the volume."</em>
          </li>
          <li>
            <strong>Distortion</strong> adds harmonics — listen for fuzz on the note's tail
            and a "smaller but louder" feel.
          </li>
        </ul>
      </section>

      <section id="ref-rhythm">
        <h3 className="sref-h3">Rhythm</h3>
        <p className="sref-p">For Beat Copy.</p>
        <ul className="sref-ul">
          <li>Anchor on the kick's downbeat, then find the snare's backbeat (2 &amp; 4), then fill in the hats last.</li>
          <li>Transcribe in passes: one lane per listen, not everything at once.</li>
        </ul>
      </section>
    </div>
  );
}
