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

  let audio;
  let enabled = false;
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
        await audio.suspend();
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
