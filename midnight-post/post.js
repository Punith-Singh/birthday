(() => {
  "use strict";

  const byId = (id) => document.getElementById(id);
  const sky = byId("sky");
  const scene = sky.querySelector(".landscape");
  const postbox = byId("postbox");
  const glow = byId("slot-glow");
  const openButton = byId("open-letter");
  const reader = byId("reader");
  const paper = byId("paper");
  const flight = byId("flight");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const canvas = byId("starlight");
  const ctx = canvas.getContext("2d");
  const stars = [];
  const meteors = [];
  const animations = new Set();
  let width = 0;
  let height = 0;
  let skyFrame = 0;
  let nextMeteorAt = 0;
  let trip = 0;
  let wished = false;
  let returnTo = openButton;
  let audio = null;
  let soundEnabled = false;

  function fitPostbox() {
    if (!scene.naturalWidth) return;
    const frame = scene.getBoundingClientRect();
    const stage = sky.getBoundingClientRect();
    const scale = Math.max(frame.width / scene.naturalWidth, frame.height / scene.naturalHeight);
    const artWidth = scene.naturalWidth * scale;
    const artHeight = scene.naturalHeight * scale;
    const [alignX, alignY] = getComputedStyle(scene).objectPosition.split(" ").map(parseFloat);
    const left = frame.left - stage.left + (frame.width - artWidth) * alignX / 100;
    const top = frame.top - stage.top + (frame.height - artHeight) * alignY / 100;

    // Coordinates on the original painting keep the tap target and departure point together at every crop.
    postbox.style.left = left + artWidth * .666 + "px";
    postbox.style.top = top + artHeight * .142 + "px";
    postbox.style.width = artWidth * .231 + "px";
    postbox.style.height = artHeight * .46 + "px";
    glow.style.left = left + artWidth * .761 + "px";
    glow.style.top = top + artHeight * .4 + "px";
    glow.style.width = artWidth * .099 + "px";
  }

  function sizeSky() {
    width = sky.clientWidth;
    height = sky.clientHeight;
    fitPostbox();
    if (!ctx || !width || !height) return;
    const density = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(width * density);
    canvas.height = Math.round(height * density);
    ctx.setTransform(density, 0, 0, density, 0, 0);
    stars.length = 0;
    // Stable stars keep their relative positions when the phone rotates.
    let seed = 27;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const count = Math.min(94, Math.round(width / 15 + 21));
    const skyHeight = scene.clientHeight || height;
    for (let i = 0; i < count; i++) {
      stars.push({
        x: random() * width,
        y: random() * skyHeight * .82,
        radius: .36 + random() * .98,
        phase: random() * Math.PI * 2,
        speed: .55 + random() * .75,
        bright: i % 13 === 0
      });
    }
    drawSky(performance.now());
  }

  function addMeteor(time, isWish) {
    const artHeight = scene.clientHeight || height;
    const side = isWish ? .86 : .56 + Math.random() * .37;
    meteors.push({
      time,
      duration: isWish ? 1550 : 850,
      x: width * side,
      y: artHeight * (isWish ? .14 : .08 + Math.random() * .2),
      dx: -width * (isWish ? .7 : .24),
      dy: artHeight * (isWish ? .29 : .13),
      wish: isWish
    });
  }

  function drawMeteors(time) {
    for (let i = meteors.length - 1; i >= 0; i--) {
      const meteor = meteors[i];
      const p = (time - meteor.time) / meteor.duration;
      if (p >= 1) { meteors.splice(i, 1); continue; }
      if (p < 0) continue;
      const x = meteor.x + meteor.dx * p;
      const y = meteor.y + meteor.dy * (p * .82 + p * p * .18);
      const trail = Math.min(p, meteor.wish ? .29 : .21);
      const tailX = x - meteor.dx * trail;
      const tailY = y - meteor.dy * trail * (.82 + .36 * p);
      const opacity = Math.min(1, p * 9, (1 - p) * 5) * (meteor.wish ? 1 : .68);
      if (trail > 0) {
        const gradient = ctx.createLinearGradient(tailX, tailY, x, y);
        gradient.addColorStop(0, "rgba(230,167,180,0)");
        gradient.addColorStop(1, "rgba(255,226,174," + opacity + ")");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = meteor.wish ? 2 : 1.15;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,240,200," + opacity + ")";
      ctx.beginPath();
      ctx.arc(x, y, meteor.wish ? 2.5 : 1.45, 0, Math.PI * 2);
      ctx.fill();
      if (!meteor.wish) continue;
      for (let j = 1; j <= 9; j++) {
        const spread = j / 10;
        ctx.globalAlpha = opacity * (1 - spread);
        ctx.fillRect(x - meteor.dx * trail * spread, y - meteor.dy * trail * spread + Math.sin(j * 3.2 + p * 6) * spread * 14, 1.7, 1.7);
      }
      ctx.globalAlpha = 1;
    }
  }

  function drawSky(time) {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const pulse = (1 + Math.sin(star.phase + time * .001 * star.speed)) * .5;
      ctx.fillStyle = "rgba(253,230,196," + (.16 + .58 * pulse) + ")";
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      ctx.fill();
      if (star.bright && pulse > .55) {
        ctx.globalAlpha = .5 * pulse;
        ctx.fillRect(star.x - .5, star.y - 3 * pulse, 1, 6 * pulse);
        ctx.fillRect(star.x - 2.6 * pulse, star.y - .5, 5.2 * pulse, 1);
        ctx.globalAlpha = 1;
      }
    }
    if (!reducedMotion.matches) {
      if (time > nextMeteorAt) {
        addMeteor(time, false);
        nextMeteorAt = time + 6200 + Math.random() * 3400;
      }
      drawMeteors(time);
    }
  }

  function skyLoop(time) {
    drawSky(time);
    skyFrame = requestAnimationFrame(skyLoop);
  }

  function syncSky() {
    cancelAnimationFrame(skyFrame);
    if (!ctx || document.hidden || reader.open) return;
    nextMeteorAt = performance.now() + 2100;
    if (reducedMotion.matches) { drawSky(0); return; }
    skyFrame = requestAnimationFrame(skyLoop);
  }

  // A short original music-box phrase, played only after the sound switch is touched.
  function chime(notes) {
    if (!soundEnabled || !audio || audio.state !== "running") return;
    notes.forEach((frequency, index) => {
      const start = audio.currentTime + index * .16;
      for (const harmonic of [1, 2]) {
        const bell = audio.createOscillator();
        const volume = audio.createGain();
        bell.type = "sine";
        bell.frequency.value = frequency * harmonic;
        volume.gain.setValueAtTime(.0001, start);
        volume.gain.exponentialRampToValueAtTime(harmonic === 1 ? .047 : .011, start + .016);
        volume.gain.exponentialRampToValueAtTime(.0001, start + 1.17);
        bell.connect(volume).connect(audio.destination);
        bell.start(start);
        bell.stop(start + 1.2);
        bell.onended = () => { bell.disconnect(); volume.disconnect(); };
      }
    });
  }

  async function toggleSound() {
    const control = byId("sound");
    const next = !soundEnabled;
    soundEnabled = next;
    try {
      if (next) {
        const AudioEngine = window.AudioContext || window.webkitAudioContext;
        audio = audio || new AudioEngine();
        await audio.resume();
        chime([523.25, 659.25, 783.99]);
      } else if (audio) {
        await audio.suspend();
      }
    } catch {
      soundEnabled = false;
    }
    control.setAttribute("aria-pressed", String(soundEnabled));
    control.setAttribute("aria-label", soundEnabled ? "Turn off music box" : "Turn on music box");
    byId("sound-label").textContent = soundEnabled ? "Sound on" : "Sound off";
  }

  function animate(element, frames, timing) {
    const animation = element.animate(frames, timing);
    animations.add(animation);
    return animation.finished.catch(() => {});
  }

  function clearAnimations() {
    animations.forEach((animation) => animation.cancel());
    animations.clear();
  }

  function showPaper() {
    clearAnimations();
    reader.dataset.phase = "reading";
    byId("greeting").focus({ preventScroll: true });
  }

  function place(x, y, scaleX, scaleY, angle, tilt) {
    return "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%) rotate(" + angle + "deg) rotateY(" + tilt + "deg) scale(" + scaleX + "," + scaleY + ")";
  }

  async function openLetter(opener) {
    if (reader.open) return;
    const thisTrip = ++trip;
    returnTo = opener === postbox ? openButton : opener;
    const slot = glow.getBoundingClientRect();
    const fromX = scene.naturalWidth ? slot.left + slot.width / 2 : innerWidth * .76;
    const fromY = Math.max(6, scene.naturalWidth ? slot.top + slot.height / 2 : innerHeight * .32);
    reader.dataset.phase = "flying";
    reader.showModal();
    document.documentElement.classList.add("reading");
    byId("paper-slot").scrollTop = 0;
    reader.focus({ preventScroll: true });
    syncSky();
    chime([440, 554.37, 659.25, 830.61]);
    if (reducedMotion.matches || typeof flight.animate !== "function") { showPaper(); return; }

    const area = reader.getBoundingClientRect();
    const toX = area.width / 2;
    const toY = area.height * .49;
    const atCentre = place(toX, toY, 1, 1, 0, 0);
    const guard = () => thisTrip === trip && reader.open && reader.dataset.phase === "flying";
    const route = animate(flight, [
      { transform: place(fromX, fromY, .17, .045, -2, -23), opacity: .1, offset: 0 },
      { transform: place(fromX - 8, fromY - 12, .48, .28, -7, -17), opacity: 1, offset: .2 },
      { transform: place(fromX + (toX - fromX) * .55, Math.max(50, Math.min(fromY, toY) - area.height * .09), .88, .88, -14, 16), opacity: 1, offset: .48 },
      { transform: atCentre, opacity: 1, offset: .82 },
      { transform: atCentre, opacity: 1, offset: 1 }
    ], { duration: 1150, easing: "cubic-bezier(.25,.64,.29,1)", fill: "both" });

    animate(flight.querySelector(".wax"), [{ opacity: 1 }, { opacity: 0 }], { delay: 710, duration: 150, fill: "both" });
    animate(flight.querySelector(".envelope-flap"), [
      { transform: "perspective(400px) rotateX(0)" },
      { transform: "perspective(400px) rotateX(172deg)" }
    ], { delay: 760, duration: 320, easing: "ease-in-out", fill: "both" });
    animate(flight.querySelector(".little-sheet"), [
      { transform: "translateY(0)" }, { transform: "translateY(-48%)" }
    ], { delay: 885, duration: 265, easing: "ease-out", fill: "both" });

    await route;
    if (!guard()) return;
    reader.dataset.phase = "revealing";
    await Promise.all([
      animate(flight, [
        { transform: atCentre, opacity: 1 },
        { transform: place(toX, toY + 55, .9, .9, 4, 0), opacity: 0 }
      ], { duration: 285, easing: "ease-in", fill: "both" }),
      animate(paper, [
        { transform: "perspective(950px) translateY(25px) rotateX(-16deg) scale(.72)", opacity: 0 },
        { opacity: 1, offset: .48 },
        { transform: "perspective(950px) translateY(0) rotateX(0) scale(1)", opacity: 1 }
      ], { duration: 410, easing: "cubic-bezier(.2,.72,.27,1)", fill: "both" })
    ]);
    if (thisTrip === trip && reader.open) showPaper();
  }

  function replayEntrance() {
    const copy = byId("cover-copy");
    copy.classList.remove("is-arriving");
    void copy.offsetWidth;
    copy.classList.add("is-arriving");
  }

  function sendWish() {
    if (!reader.open || reader.dataset.phase === "flying") return;
    wished = true;
    byId("dedication").textContent = "For the year ahead";
    byId("headline").textContent = "I love you,";
    byId("intro").textContent = "Whatever you wished for tonight, I hope I get to be there the day it comes true.";
    byId("open-label").textContent = "Read your letter again";
    byId("announcement").textContent = "Your wish is on its way, Roseantic.";
    chime([523.25, 659.25, 783.99, 1046.5]);
    reader.close("wish");
  }

  function finishReading() {
    if (reader.open) return;
    ++trip;
    clearAnimations();
    document.documentElement.classList.remove("reading");
    reader.removeAttribute("data-phase");
    syncSky();
    if (reader.returnValue === "wish" && wished) {
      window.scrollTo(0, 0);
      replayEntrance();
      if (!reducedMotion.matches) addMeteor(performance.now() + 200, true);
    }
    reader.returnValue = "";
    returnTo.focus({ preventScroll: true });
  }

  if (typeof reader.showModal !== "function") return;
  byId("paper-slot").appendChild(paper);
  document.documentElement.classList.add("enhanced");
  openButton.addEventListener("click", (event) => { event.preventDefault(); openLetter(openButton); });
  postbox.addEventListener("click", () => openLetter(postbox));
  byId("close-letter").addEventListener("click", () => reader.close());
  byId("wish").addEventListener("click", sendWish);
  reader.addEventListener("close", finishReading);
  reader.addEventListener("click", (event) => {
    if (event.target === byId("paper-slot") && reader.dataset.phase === "reading") reader.close();
  });
  if (window.AudioContext || window.webkitAudioContext) {
    byId("sound").addEventListener("click", toggleSound);
  } else {
    byId("sound").hidden = true;
  }
  scene.addEventListener("load", sizeSky);
  if (window.ResizeObserver) new ResizeObserver(sizeSky).observe(sky);
  window.addEventListener("resize", sizeSky, { passive: true });
  document.addEventListener("visibilitychange", syncSky);
  function motionChanged() {
    if (reducedMotion.matches && reader.open && reader.dataset.phase !== "reading") {
      ++trip;
      showPaper();
    }
    syncSky();
  }
  if (reducedMotion.addEventListener) reducedMotion.addEventListener("change", motionChanged);
  else if (reducedMotion.addListener) reducedMotion.addListener(motionChanged);
  sizeSky();
  syncSky();
  replayEntrance();
})();
