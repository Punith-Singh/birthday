(() => {
  'use strict';
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sound-control';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.innerHTML = '<span aria-hidden="true">♪</span><b>Sound off</b>';
  document.body.append(toggle);

  const musicButton = document.createElement('button');
  musicButton.type = 'button';
  musicButton.className = 'sound-control music-control';
  musicButton.setAttribute('aria-pressed', 'false');
  musicButton.innerHTML = '<span aria-hidden="true">♫</span><b>Play birthday music</b>';
  document.body.append(musicButton);

  let audio;
  let enabled = false;
  let musicPlaying = false;
  let musicTimer;
  let musicVolume;
  const melody = [
    [392, .5], [392, .25], [440, .75], [392, .75], [523.25, .75], [493.88, 1.5],
    [392, .5], [392, .25], [440, .75], [392, .75], [587.33, .75], [523.25, 1.5],
    [392, .5], [392, .25], [783.99, .75], [659.25, .75], [523.25, .75], [493.88, .75], [440, 1.5],
    [698.46, .5], [698.46, .25], [659.25, .75], [523.25, .75], [587.33, .75], [523.25, 1.75]
  ];
  function startMelody() {
    if (!musicPlaying || !audio || audio.state !== 'running') return;
    let start = audio.currentTime + .05;
    const beat = .38;
    melody.forEach(([frequency, duration]) => {
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      const length = duration * beat;
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(.0001, start);
      envelope.gain.exponentialRampToValueAtTime(.09, start + .025);
      envelope.gain.exponentialRampToValueAtTime(.0001, start + Math.max(.12, length * .9));
      oscillator.connect(envelope).connect(musicVolume);
      oscillator.start(start);
      oscillator.stop(start + Math.max(.13, length));
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
      start += length;
    });
    musicTimer = setTimeout(startMelody, (start - audio.currentTime + .7) * 1000);
  }
  musicButton.addEventListener('click', async () => {
    if (musicPlaying) {
      musicPlaying = false;
      clearTimeout(musicTimer);
      musicVolume.disconnect();
      musicVolume = null;
    } else {
      try {
        audio = audio || new AudioEngine();
        await audio.resume();
        if (audio.state !== 'running') return;
        musicVolume = audio.createGain();
        musicVolume.gain.value = .5;
        musicVolume.connect(audio.destination);
        musicPlaying = true;
        startMelody();
      } catch {
        musicPlaying = false;
      }
    }
    musicButton.setAttribute('aria-pressed', String(musicPlaying));
    musicButton.querySelector('b').textContent = musicPlaying ? 'Pause birthday music' : 'Play birthday music';
  });
  function play(notes, interval = .13) {
    if (!enabled || !audio || audio.state !== 'running') return;
    notes.forEach((frequency, index) => {
      const time = audio.currentTime + index * interval;
      const oscillator = audio.createOscillator();
      const volume = audio.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      volume.gain.setValueAtTime(.0001, time);
      volume.gain.exponentialRampToValueAtTime(.035, time + .025);
      volume.gain.exponentialRampToValueAtTime(.0001, time + .8);
      oscillator.connect(volume).connect(audio.destination);
      oscillator.start(time);
      oscillator.stop(time + .82);
      oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
    });
  }
  toggle.addEventListener('click', async () => {
    try {
      audio = audio || new AudioEngine();
      if (enabled) {
        enabled = false;
      } else {
        await audio.resume();
        enabled = audio.state === 'running';
      }
      toggle.setAttribute('aria-pressed', String(enabled));
      toggle.querySelector('b').textContent = enabled ? 'Sound on' : 'Sound off';
      if (enabled) play([523.25, 659.25, 783.99]);
    } catch {
      enabled = false;
      toggle.setAttribute('aria-pressed', 'false');
      toggle.querySelector('b').textContent = 'Sound off';
    }
  });
  document.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control || control === toggle) return;
    if (control.id === 'enter') play([392, 523.25, 659.25, 783.99]);
    else if (control.id === 'openLetter' || control.id === 'drawNote' || control.closest('.jar-nav')) play([659.25, 783.99, 1046.5]);
    else if (control.id === 'wishButton') play([523.25, 659.25]);
  });
  const counter = document.getElementById('candleCount');
  if (counter) {
    new MutationObserver(() => {
      if (counter.hidden) return;
      if (/^[123]$/.test(counter.textContent.trim())) play([659.25]);
    }).observe(counter, { childList: true, characterData: true, subtree: true });
  }
  const stage = document.getElementById('cakeStage');
  if (stage) {
    let wasClapping = false;
    new MutationObserver(() => {
      const clapping = stage.classList.contains('is-clapping');
      if (clapping && !wasClapping) play([523.25, 659.25, 783.99, 1046.5], .11);
      wasClapping = clapping;
    }).observe(stage, { attributes: true, attributeFilter: ['class'] });
  }
})();
