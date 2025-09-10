// card-hover-scroll.js
document.addEventListener('DOMContentLoaded', () => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const cards = document.querySelectorAll('[data-hover-scroll]');
  if (!cards.length) return;

  const DEFAULT_CYCLE_DURATION  = 12500; // мс: вниз и обратно
  const DEFAULT_RETURN_DURATION = 600;   // мс: быстрый возврат

  // Режимы по ширине: планшеты ведём как touch/mobile
  const isDesktop = () => window.matchMedia('(min-width: 1201px) and (hover: hover) and (pointer: fine)').matches;
  const isTabletW = () => window.matchMedia('(min-width: 601px) and (max-width: 1024px)').matches;
  const isMobileLike = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  cards.forEach(initCard);

  function initCard(card) {
    const shot = card.querySelector('.shot');
    const img  = shot ? shot.querySelector('img') : null;
    if (!shot || !img) return;

    // базовые стили безопасности
    if (getComputedStyle(shot).overflow !== 'hidden') shot.style.overflow = 'hidden';
    img.style.willChange = 'transform';

    const cycleDuration  = Number(card.getAttribute('data-cycle-duration'))  || DEFAULT_CYCLE_DURATION;
    const returnDuration = Number(card.getAttribute('data-return-duration')) || DEFAULT_RETURN_DURATION;

    let anim = null;
    let resizeTimer = null;

    function computeDelta() {
      const containerH = shot.clientHeight || card.clientHeight || 0;
      const imgH = img.getBoundingClientRect().height || 0;
      return Math.max(0, Math.round(imgH - containerH));
    }

    function startAnimation() {
      if (!img || anim) return;
      if (!img.complete) { img.addEventListener('load', startAnimation, { once: true }); return; }
      const delta = computeDelta();
      if (delta <= 0) return;

      img.style.transition = 'none';
      anim = img.animate(
        [
          { transform: 'translateY(0px)' },
          { transform: `translateY(-${delta}px)` },
          { transform: 'translateY(0px)' }
        ],
        { duration: cycleDuration, iterations: 1, easing: 'ease-in-out', fill: 'none' }
      );
      anim.onfinish = () => { anim = null; img.style.transition = ''; img.style.transform = ''; };
    }

    function smoothReturnFromComputed(matrixStr) {
      let y = 0;
      try { y = new DOMMatrixReadOnly(matrixStr).m42 || 0; } catch (_) { y = 0; }
      img.style.transform = `translateY(${y}px)`;
      img.getBoundingClientRect();
      img.style.transition = `transform ${returnDuration}ms ease`;
      img.style.transform = 'translateY(0)';
      const onEnd = (e) => {
        if (e.propertyName !== 'transform') return;
        img.style.transition = '';
        img.style.transform = '';
        img.removeEventListener('transitionend', onEnd);
      };
      img.addEventListener('transitionend', onEnd);
    }

    function stopAnimation() {
      if (!img) return;

      if (!anim) {
        const t = getComputedStyle(img).transform || 'none';
        if (t !== 'none') smoothReturnFromComputed(t);
        return;
      }

      const t = getComputedStyle(img).transform || 'none';
      let y = 0;
      try { y = new DOMMatrixReadOnly(t).m42 || 0; } catch (_) { y = 0; }

      anim.cancel(); anim = null;
      img.style.transform = `translateY(${y}px)`;
      img.getBoundingClientRect();
      img.style.transition = `transform ${returnDuration}ms ease`;
      img.style.transform = 'translateY(0)';
      const onEnd = (e) => {
        if (e.propertyName !== 'transform') return;
        img.style.transition = '';
        img.style.transform = '';
        img.removeEventListener('transitionend', onEnd);
      };
      img.addEventListener('transitionend', onEnd);
    }

    // --- выбор режима: desktop (hover) или touch (tablet + mobile) ---
    const mode = isDesktop() ? 'desktop' : ((isTabletW() || isMobileLike()) ? 'touch' : 'touch');

    if (mode === 'desktop') {
      // только hover
      card.addEventListener('mouseenter', startAnimation);
      card.addEventListener('mouseleave', stopAnimation);
    } else {
      // touch-логика: автозапуск во вьюпорте (порог 0.8), плюс фокус/тач
      if (!card.hasAttribute('tabindex')) card.tabIndex = 0;
      card.setAttribute('role', card.getAttribute('role') || 'group');
      card.setAttribute('aria-label', card.getAttribute('aria-label') || 'Карточка предпросмотра');

      card.addEventListener('focusin', startAnimation);
      card.addEventListener('focusout', stopAnimation);

      card.addEventListener('touchstart', startAnimation, { passive: true });
      card.addEventListener('touchend',   stopAnimation);
      card.addEventListener('touchcancel',stopAnimation);

      const io = new IntersectionObserver(([entry]) => {
        if (!entry) return;
        if (document.activeElement === card) return; // фокус имеет приоритет
        if (entry.isIntersecting) startAnimation();
        else stopAnimation();
      }, { threshold: 0.8 });

      io.observe(card);

      document.addEventListener('visibilitychange', () => { if (document.hidden) stopAnimation(); });
    }

    // общий ресайз: сброс подвисаний и переоценка размеров
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (anim) { anim.cancel(); anim = null; }
        img.style.transition = '';
        img.style.transform  = '';
      }, 120);
    }, { passive: true });

    // Esc — ручная остановка (когда карточка в фокусе)
    card.addEventListener('keydown', (e) => { if (e.key === 'Escape') stopAnimation(); });
  }
});
