(() => {
  const root = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Открытка всегда начинается с первого экрана
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  /* ---------- Музыка ---------- */

  const audio = document.getElementById('music');
  const musicBtn = document.getElementById('music-btn');
  const MAX_VOLUME = 0.7;
  let wantsMusic = false;
  let fadeTimer;

  // На iPhone громкость менять нельзя — там трек просто играет сразу на полную
  function fadeTo(target, ms, done) {
    clearInterval(fadeTimer);
    const start = audio.volume;
    const t0 = performance.now();
    fadeTimer = setInterval(() => {
      const k = Math.min((performance.now() - t0) / ms, 1);
      audio.volume = start + (target - start) * k;
      if (k === 1) {
        clearInterval(fadeTimer);
        if (done) done();
      }
    }, 30);
  }

  function setMusicUI(on) {
    musicBtn.setAttribute('aria-pressed', String(on));
    musicBtn.setAttribute('aria-label', on ? 'Выключить музыку' : 'Включить музыку');
  }

  function playMusic() {
    wantsMusic = true;
    clearInterval(fadeTimer);
    audio.volume = 0;
    setMusicUI(true);
    return audio.play().then(() => fadeTo(MAX_VOLUME, 1800));
  }

  function pauseMusic() {
    wantsMusic = false;
    setMusicUI(false);
    fadeTo(0, 400, () => audio.pause());
  }

  function startMusic() {
    playMusic()
      .then(() => { musicBtn.hidden = false; })
      .catch(() => {
        // файла нет — кнопку не показываем; иначе даём включить вручную
        if (audio.error) return;
        wantsMusic = false;
        setMusicUI(false);
        musicBtn.hidden = false;
      });
  }

  audio.addEventListener('error', () => { musicBtn.hidden = true; });

  musicBtn.addEventListener('click', () => {
    if (wantsMusic) pauseMusic();
    else playMusic().catch(() => setMusicUI(false));
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause();
    else if (wantsMusic) audio.play().catch(() => {});
  });

  /* ---------- Заставка ---------- */

  const intro = document.getElementById('intro');

  document.getElementById('open-btn').addEventListener('click', () => {
    startMusic();
    root.classList.add('is-open');
    root.classList.remove('is-locked');
    setTimeout(() => intro.remove(), 1200);
  }, { once: true });

  document.querySelector('.scroll-cue').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('reason-1').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  /* ---------- Появление блоков при прокрутке ---------- */

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      revealObserver.unobserve(entry.target);
      if (entry.target.classList.contains('stats')) countUp(entry.target);
    });
  }, { threshold: 0.28, rootMargin: '0px 0px -6% 0px' });

  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------- Счётчики в финале ---------- */

  const counters = document.querySelectorAll('[data-count]');
  const formatNumber = (n) => n.toLocaleString('ru-RU');
  counters.forEach((el) => { el.textContent = '0'; });

  function countUp(scope) {
    scope.querySelectorAll('[data-count]').forEach((el) => {
      const target = Number(el.dataset.count);
      const duration = reduceMotion ? 0 : 2200;
      const t0 = performance.now();
      const tick = (now) => {
        const k = duration ? Math.min((now - t0) / duration, 1) : 1;
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = formatNumber(Math.round(target * eased));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- Лента фото: дублируем для бесконечной прокрутки ---------- */

  const marquee = document.querySelector('.marquee');
  marquee.querySelectorAll('.marquee__track').forEach((track) => {
    [...track.children].forEach((img) => track.appendChild(img.cloneNode(true)));
  });

  new IntersectionObserver(([entry]) => {
    marquee.classList.toggle('is-running', entry.isIntersecting);
  }).observe(marquee);

  /* ---------- Параллакс и полоска прогресса ---------- */

  const progress = document.getElementById('progress');
  const parallaxEls = reduceMotion ? [] : [...document.querySelectorAll('[data-parallax]')];
  let ticking = false;

  function onFrame() {
    ticking = false;
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;

    for (const el of parallaxEls) {
      const box = el.parentElement.getBoundingClientRect();
      if (box.bottom < -200 || box.top > vh + 200) continue;
      // чем больше коэффициент, тем «глубже» и медленнее движется элемент
      const fromCenter = box.top + box.height / 2 - vh / 2;
      const shift = -fromCenter * Number(el.dataset.parallax);
      el.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0)`;
    }
  }

  function requestFrame() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(onFrame);
  }

  window.addEventListener('scroll', requestFrame, { passive: true });
  window.addEventListener('resize', requestFrame);
  onFrame();

  /* ---------- Сердечки ---------- */

  const loveBtn = document.getElementById('love-btn');
  const heartSvg = loveBtn.querySelector('svg').innerHTML;
  const colors = ['#ff8fa8', '#ffd1dc', '#e9b8a6', '#ff5c7f', '#ffffff'];

  loveBtn.addEventListener('click', () => {
    for (let i = 0; i < 18; i++) {
      const heart = document.createElement('span');
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.4;
      const dist = 90 + Math.random() * 110;
      heart.className = 'burst';
      heart.innerHTML = `<svg viewBox="0 0 24 24">${heartSvg}</svg>`;
      heart.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      heart.style.setProperty('--dy', `${Math.sin(angle) * dist - 60}px`);
      heart.style.setProperty('--s', (0.6 + Math.random() * 0.9).toFixed(2));
      heart.style.setProperty('--r', `${Math.round(Math.random() * 80 - 40)}deg`);
      heart.style.setProperty('--c', colors[i % colors.length]);
      loveBtn.appendChild(heart);
      setTimeout(() => heart.remove(), 1600);
    }
    if (navigator.vibrate) navigator.vibrate(25);
  });
})();
