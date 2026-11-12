const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const starfield = document.querySelector('.starfield');
if (!reducedMotion.matches) {
  for (let i = 0; i < 34; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty('--s', `${Math.random() * 2 + 1}px`);
    star.style.setProperty('--o', `${Math.random() * .5 + .2}`);
    star.style.setProperty('--d', `${Math.random() * 3 + 2}s`);
    star.style.setProperty('--delay', `${-Math.random() * 4}s`);
    starfield.append(star);
  }
}
const letterButton = document.getElementById('openLetter');
const letter = document.getElementById('letterCard');
const letterMessage = document.getElementById('letterMessage');
letterButton.addEventListener('click', () => {
  const opening = letterButton.getAttribute('aria-expanded') !== 'true';
  letterButton.setAttribute('aria-expanded', String(opening));
  letterMessage.hidden = !opening;
  letter.classList.toggle('is-open', opening);
  letterButton.querySelector('.open-letter-text').textContent = opening ? 'Close your letter' : 'Open your letter';
});
const wishButton = document.getElementById('wishButton');
const flame = document.getElementById('flame');
const wishResult = document.getElementById('wishResult');
let candleOut = false;
wishButton.addEventListener('click', () => {
  candleOut = !candleOut;
  flame.classList.toggle('out', candleOut);
  wishButton.querySelector('span').textContent = candleOut ? 'Make another wish' : 'Blow out the candle';
  wishResult.textContent = candleOut ? 'May your wish find its way to you. Happy birthday, Roseantic! ♡' : '';
  if (candleOut && !reducedMotion.matches) {
    for (let i = 0; i < 65; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti';
      piece.style.left = `${Math.random() * 100}vw`;
      piece.style.backgroundColor = ['#f0cf9e', '#e4a4b5', '#eed9d0', '#b891bf'][i % 4];
      piece.style.setProperty('--x', `${Math.random() * 240 - 120}px`);
      piece.style.animationDelay = `${Math.random() * .8}s`;
      document.body.append(piece);
      setTimeout(() => piece.remove(), 4600);
    }
  }
});
const hero = document.querySelector('.hero');
const heroImage = document.querySelector('.hero-image');
if (!reducedMotion.matches && window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 851px)').matches) {
  hero.addEventListener('pointermove', event => {
    const bounds = hero.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - .5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - .5) * 10;
    heroImage.style.transform = `scale(1.055) translate(${x}px, ${y}px)`;
  });
  hero.addEventListener('pointerleave', () => { heroImage.style.transform = ''; });
}
