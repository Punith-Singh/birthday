(() => {
  'use strict';
  const AudioEngine = window.AudioContext || window.webkitAudioContext;
  if (!AudioEngine) return;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sound-control';
  toggle.setAttribute('aria-pressed', 'true');
  toggle.innerHTML = '<span aria-hidden="true">♪</span><b>Sound on</b>';
  document.body.append(toggle);

  const musicButton = document.createElement('button');
  musicButton.type = 'button';
  musicButton.className = 'sound-control music-control';
  musicButton.setAttribute('aria-pressed', 'false');
  musicButton.innerHTML = '<span aria-hidden="true">♫</span><b>Play birthday music</b>';
  const audioControls = document.createElement('div');
  audioControls.className = 'audio-controls';
  audioControls.setAttribute('role', 'group');
  audioControls.setAttribute('aria-label', 'Birthday audio controls');
  audioControls.append(toggle, musicButton);
  document.body.append(audioControls);

  let audio;
  let enabled = true;
  const song = new Audio('birthday-song.mp3?v=vocal-20261126');
  song.loop = true;
  song.volume = .42;
  song.preload = 'metadata';
  let musicRequested = true;
  let startingMusic = false;

  function syncMusicButton() {
    const playing = !song.paused;
    musicButton.setAttribute('aria-pressed', String(playing));
    musicButton.querySelector('b').textContent = playing ? 'Pause birthday music' : 'Play birthday music';
  }
  async function beginMusic() {
    if (!musicRequested || !song.paused || startingMusic) return;
    startingMusic = true;
    try {
      await song.play();
    } catch {
      // A first tap is required by many browsers before sound can play.
    } finally {
      startingMusic = false;
      syncMusicButton();
    }
  }
  musicButton.addEventListener('click', () => {
    if (!song.paused) {
      musicRequested = false;
      song.pause();
      syncMusicButton();
    } else {
      musicRequested = true;
      beginMusic();
    }
  });
  function unlockAudio(event) {
    if (event.target.closest('.sound-control')) return;
    if (musicRequested) beginMusic();
    if (enabled) {
      try {
        audio = audio || new AudioEngine();
        if (audio.state !== 'running') audio.resume().catch(() => {});
      } catch {}
    }
  }
  document.addEventListener('pointerdown', unlockAudio, { capture: true });
  document.addEventListener('keydown', unlockAudio, { capture: true });
  song.addEventListener('play', syncMusicButton);
  song.addEventListener('pause', syncMusicButton);
  beginMusic();
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
  function applause() {
    if (!enabled || !audio || audio.state !== 'running') return;
    const length = Math.floor(audio.sampleRate * .13);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) samples[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audio.sampleRate * .025));
    for (let i = 0; i < 19; i++) {
      const source = audio.createBufferSource();
      const filter = audio.createBiquadFilter();
      const volume = audio.createGain();
      const start = audio.currentTime + i * .12 + Math.random() * .05;
      source.buffer = buffer;
      source.playbackRate.value = .8 + Math.random() * .45;
      filter.type = 'bandpass';
      filter.frequency.value = 900 + Math.random() * 1100;
      filter.Q.value = .7;
      volume.gain.value = .13 + Math.random() * .1;
      source.connect(filter).connect(volume).connect(audio.destination);
      source.start(start);
      source.onended = () => { source.disconnect(); filter.disconnect(); volume.disconnect(); };
    }
  }
  document.addEventListener('click', event => {
    const control = event.target.closest('button');
    if (!control || control === toggle) return;
    if (control.id === 'enter') play([392, 523.25, 659.25, 783.99]);
    else if (control.id === 'openLetter' || control.id === 'drawNote' || control.closest('.jar-nav')) play([659.25, 783.99, 1046.5]);
    else if (control.id === 'wishButton') {
      control.classList.remove('wish-button-pressed');
      void control.offsetWidth;
      control.classList.add('wish-button-pressed');
      control.addEventListener('animationend', () => control.classList.remove('wish-button-pressed'), { once: true });
      play([523.25, 659.25]);
    }
  });
  const counter = document.getElementById('candleCount');
  if (counter) {
    new MutationObserver(() => {
      if (counter.hidden) return;
      if (/^[123]$/.test(counter.textContent.trim())) play([659.25]);
    }).observe(counter, { childList: true, characterData: true, subtree: true });
  }
  const stage = document.getElementById('cakeStage');
  const wishButton = document.getElementById('wishButton');
  const wishAction = document.querySelector('.wish-action');
  if (wishButton && wishAction) {
    const hand = document.createElement('span');
    hand.className = 'wish-tap-hand';
    hand.setAttribute('aria-hidden', 'true');
    hand.textContent = '👆🏻';
    wishAction.append(hand);
    function positionHand() {
      hand.style.setProperty('--hand-x', (wishButton.offsetLeft + wishButton.offsetWidth * .78 - 18) + 'px');
      hand.style.setProperty('--hand-y', (wishButton.offsetTop + wishButton.offsetHeight - 8) + 'px');
      hand.hidden = wishButton.disabled;
    }
    new MutationObserver(positionHand).observe(wishButton, { attributes: true, attributeFilter: ['disabled'], childList: true, subtree: true });
    if (window.ResizeObserver) new ResizeObserver(positionHand).observe(wishAction);
    window.addEventListener('resize', positionHand, { passive: true });
    positionHand();
  }
  if (stage) {
    let wasClapping = false;
    new MutationObserver(() => {
      const clapping = stage.classList.contains('is-clapping');
      if (clapping && !wasClapping) applause();
      wasClapping = clapping;
    }).observe(stage, { attributes: true, attributeFilter: ['class'] });
  }
})();
