/* =========================================================
   Включаем js-режим для CSS-анимаций
   ========================================================= */
(function(){ document.documentElement.classList.add('js'); })();

/* =========================================================
   Reveal + Stagger + Skill Chaos
   ========================================================= */
(function(){
  const supportsIO = 'IntersectionObserver' in window;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Utilities
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const rand  = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const shuffle = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };

  // 1) Basic reveal for .reveal + per-card reveal for .project-card -> .seen
  function onReveal(el){
    if (el.classList.contains('reveal')) el.classList.add('shown');
    if (el.classList.contains('project-card')) el.classList.add('seen');
  }

  // 2) Cascaded container [data-stagger] -> children [data-card] with delays
  function revealStagger(container){
    const items = $$('[data-card]', container);
    if (!items.length){ container.classList.add('shown'); return; }
    const base = 50;         // base delay per item (ms)
    const jitter = 5;       // random noise (ms)
    items.forEach((item, idx) => {
      // compute delay that increases with index + slight randomness
      const delay = reduceMotion ? 0 : (idx * base + rand(0, jitter));
      item.style.transitionDelay = (delay/1000).toFixed(3) + 's';
    });
    container.classList.add('shown');
  }

  // 3) Chaotic skills: turn every .skill in .skill-cloud into pending, then flip to .skill--on in random order
  function initSkills(){
    const clouds = $$('.skill-cloud');
    clouds.forEach(cloud => {
      const skills = $$('.skill', cloud);
      if (!skills.length) return;
      // initialize pending
      skills.forEach(s => {
        s.classList.remove('skill--on');
        s.classList.add('skill--pending');
      });
    });
  }
  function revealSkills(cloud){
    const skills = $$('.skill', cloud);
    if (!skills.length){ return; }
    const seq = shuffle(skills.slice());
    if (reduceMotion){
      seq.forEach(s => { s.classList.remove('skill--pending'); s.classList.add('skill--on'); });
      return;
    }
    const min = 5, max = 10;   // random per-item delay window (ms)
    let acc = 0;
    seq.forEach((el, i) => {
      const d = rand(min, max);
      acc += d;
      setTimeout(() => {
        el.classList.add('skill--on');
        el.classList.remove('skill--pending');
      }, acc);
    });
  }

  // Prepare skills immediately so they start hidden
  initSkills();

  if (!supportsIO){
    // Fallback: reveal everything without animation logic
    $$('.reveal').forEach(el => el.classList.add('shown'));
    $$('.project-card').forEach(el => el.classList.add('seen'));
    $$('[data-stagger]').forEach(revealStagger);
    $$('.skill-cloud').forEach(revealSkills);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries){
      if (!entry.isIntersecting) continue;
      const el = entry.target;
      if (el.hasAttribute('data-stagger')){
        revealStagger(el);
      } else if (el.classList.contains('skill-cloud')){
        revealSkills(el);
      } else {
        onReveal(el);
      }
      io.unobserve(el);
    }
  }, { root:null, rootMargin:'0px 0px -8% 0px', threshold:0.15 });

  // Observe targets once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    $$('.reveal, .project-card, [data-stagger], .skill-cloud').forEach(el => io.observe(el));
  });
})();

/* =========================================================
   0) Drawer (бургер): открытие/закрытие
   ========================================================= */
(() => {
  const toggle   = document.querySelector('.menu-toggle');
  const menu     = document.getElementById('main-menu');
  const backdrop = document.getElementById('menu-backdrop');
  if (!toggle || !menu || !backdrop) return;

  const isMobile = () =>
    window.matchMedia('(max-width: 1200px) or (hover: none) or (pointer: coarse)').matches;

  function openDrawer(){
    menu.classList.add('open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Закрыть меню');
    toggle.innerHTML = '<svg class="i" aria-hidden="true"><use href="#icon-x"></use></svg>';
    backdrop.hidden = false;
    requestAnimationFrame(()=>backdrop.classList.add('show'));
  }

  function closeDrawer(){
    menu.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.innerHTML = '<svg class="i" aria-hidden="true"><use href="#icon-burger"></use></svg>';
    backdrop.classList.remove('show');
    setTimeout(() => { backdrop.hidden = true; }, 180);
  }

  toggle.addEventListener('click', () => {
    if (!isMobile()) return;
    menu.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  backdrop.addEventListener('click', closeDrawer);
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeDrawer(); });
  window.addEventListener('resize', () => { if (!isMobile()) closeDrawer(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeDrawer();
  });
})();

/* =========================================================
   1) Плавный скролл по якорям
   ========================================================= */
(() => {
  const links = document.querySelectorAll('.menu a[href^="#"], a.link[href^="#"]');
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
})();

/* =========================================================
   2) Lightbox для изображений (минимал)
   ========================================================= */
(() => {
  const imgs = document.querySelectorAll('a.ulightbox');
  if (!imgs.length) return;

  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `
    <button class="lightbox-close" aria-label="Закрыть (Esc)">
      <svg class="i"><use href="#icon-x"></use></svg>
    </button>
    <div class="lightbox-inner" role="dialog" aria-modal="true"></div>`;
  document.body.appendChild(overlay);
  const inner = overlay.querySelector('.lightbox-inner');
  const closeBtn = overlay.querySelector('.lightbox-close');

  function open(src){
    inner.innerHTML = `<img src="${src}" alt="">`;
    overlay.classList.add('show');
    document.body.classList.add('no-scroll');
    closeBtn.focus();
  }
  function close(){
    overlay.classList.remove('show');
    document.body.classList.remove('no-scroll');
    inner.innerHTML = '';
  }

  imgs.forEach(a => {
    a.addEventListener('click', (e) => {
      const img = a.getAttribute('href');
      if (img) {
        e.preventDefault();
        open(img);
      }
    });
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('show')) close();
  });
})();

/* =========================================================
   3) Кнопка «вверх»
   ========================================================= */
(() => {
  const arrow = document.getElementById('go-top');
  if (!arrow) return;

  const onScroll = () => {
    if (window.scrollY > 320) arrow.classList.add('show');
    else arrow.classList.remove('show');
  };
  window.addEventListener('scroll', onScroll);
  onScroll();

  function goTop(){
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch(_) {
      document.documentElement.scrollTop = 0; document.body.scrollTop = 0;
    }
  }
  arrow.addEventListener('click', goTop);
  arrow.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goTop(); }
  });
})();

/* =========================================================
   4) CLI терминал: эмуляция Enter на мобильных/кнопкой + безопасный fullscreen
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const cliOutput    = document.getElementById('cli-output');
  const cliInputDiv  = document.getElementById('cli-input');
  const fullBtn      = document.getElementById('cli-fullscreen-btn');
  const cliContainer = document.getElementById('pipboy-cli');
  if (!cliOutput || !cliInputDiv || !fullBtn || !cliContainer) return;

  // Настройки ввода
  cliInputDiv.setAttribute('enterkeyhint', 'send');
  cliInputDiv.setAttribute('aria-multiline', 'false');
  cliInputDiv.setAttribute('autocapitalize', 'off');
  cliInputDiv.setAttribute('autocorrect', 'off');
  cliInputDiv.setAttribute('spellcheck', 'false');

  const d = document;
  const isFS    = () => !!(d.fullscreenElement || d.webkitFullscreenElement);
  const isTouch = () => window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const enterFS = (el) => {
    try {
      if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } catch (_) {}
  };
  const exitFS = () => {
    try {
      if (d.exitFullscreen) d.exitFullscreen();
      else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
    } catch (_) {}
  };

  d.addEventListener('fullscreenchange', syncFSUI);
  d.addEventListener('webkitfullscreenchange', syncFSUI);
  function syncFSUI() {
    const active = isFS();
    cliContainer.classList.toggle('fullscreen', active);
    fullBtn.textContent = active ? 'Exit' : 'Enter';
    fullBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
    if (active) cliInputDiv.focus();
  }

  // === ТВОЙ ОРИГИНАЛЬНЫЙ ВЫВОД И КОНТЕНТ ===
  
  // Helper: convert [label](url) and bare URLs to safe anchor tags
  function renderTextWithLinks(text) {
    try {
      if (text == null) return '';
      let s = String(text);

      // Preserve markdown-style links first
      const mdLinks = [];
      s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (m, label, url) => {
        const esc = (t) => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        const a = '<a class="cli-link" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(label) + '</a>';
        mdLinks.push(a);
        return '%%MDLINK' + (mdLinks.length-1) + '%%';
      });

      // Escape the rest
      s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

      // Bare links
      s = s.replace(/https?:\/\/[^\s<]+/gi, (url) => {
        return '<a class="cli-link" href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
      });

      // Restore markdown links
      s = s.replace(/%%MDLINK(\d+)%%/g, (m, i) => mdLinks[parseInt(i,10)] || '');
      return s;
    } catch(e) {
      // Fallback: basic escape
      return String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }
  }

function appendOutput(text){
    const p = document.createElement('p');
    p.className = 'cli-line';
    // Важно: оставляем твою функцию рендера ссылок
    p.innerHTML = renderTextWithLinks(text);
    cliOutput.appendChild(p);
    const scrollHost = cliOutput.parentElement || cliOutput;
    scrollHost.scrollTop = scrollHost.scrollHeight;
  }
  function clearOutput() {
    cliOutput.innerHTML = '';
    appendOutput('> Напишите /help для справки');
  }

  // --- команды/данные ---
  const mail = 'a23059@ya.ru';
  const fullYears = 29;

  function showSkillsDetails() {
    appendOutput('- Управление проектами: Waterfall, Agile-принципы, Scrum, Kanban, Разработка ТЗ, Прототипирование, Gant, Написание документации и инструкций, Фасилитация встреч, Деловая переписка, Приоритизация под бизнес-цели, Стрессоустойчивость.');
    appendOutput('- Программы: Kaiten, Notion, Trello, Jira, Google (docs / sheets), Miro, Figma.');
    appendOutput('- Аналитика: Яндекс.Метрика, А/Б-тест.');
    appendOutput('- Dev инструменты: HTML, CSS, HTTP-запросы, REST API.');
    appendOutput('- CMS: uCoz, uApi, Tilda, Flexbe, uKit, WordPress, Open Cart.');
    appendOutput('- Администрирование: DNS, SSL.');
    appendOutput('- Маркетинг: SEO, Директ.');
  }

  function processCommand(rawCmd) {
    const command = (rawCmd || '').trim();
    if (!command) return;
    appendOutput('> ' + command);

    const low = command.toLowerCase();

    switch (low) {
      case '/help':
        appendOutput('/help      – список команд');
        appendOutput('/now       – чем занимаюсь сейчас');
        appendOutput('/past      – чем занимался раньше');
        appendOutput('/pet       – пет-проекты в работе');
        appendOutput('/hero      – возраст и гражданство');
        appendOutput('/skills    – что умею');
        appendOutput('/live      – где живу');
        appendOutput('/hobby     – чем увлекаюсь');
        appendOutput('/contact   – мессенджеры и почта');
        appendOutput('/date      – дата последнего обновления сайта');
        appendOutput('/reset     – очистить терминал');
        break;

      case '/now':
        appendOutput('- [Divly.ru](https://divly.ru/) - менеджер продукта, проект-менеджер;');
        appendOutput('- [BoardCRM.io](https://boardcrm.io/) - менеджер разработки на поддержке, поддержка юзеров;');
        appendOutput('- [Kwork.ru](https://kwork.ru/user/dmitryzaharov/) - делаю сайты, ботов, настраиваю email-рассылки.');
        break;

      case '/past':
        appendOutput('- [Divly.ru](https://divly.ru/) - до 2021 был аккаунт-менеджером;');
        appendOutput('- [Яндекс Бизнес](https://business.yandex.ru/) - оператор Яндекс справочника.');
        break;

      case '/pet':
        appendOutput('- [ubot.help](https://ubot.help/) - проект-менеджер, разработчик, технический писатель.');
        break;

      case '/hero':
        appendOutput(`- Мне ${fullYears} лет.`);
        appendOutput('- Я гражданин России.');
        break;

      case '/skills':
        appendOutput('- Hard: agile-принципы и методологии, Trello, Kaiten, Notion, Разработка ТЗ, Tilda, uCoz, uApi, Miro, A/B-эксперименты');
        appendOutput('- Soft: взаимодействие на всех этапах, фасилитация, деловая переписка');
        appendOutput('\u00A0');
        appendOutput('Если хотите подробный список введите Yes.');
        break;

      case 'yes':
      case 'y':
        showSkillsDetails();
        break;

      case '/live':
        appendOutput('Азербайджан, г.Баку');
        break;

      case '/hobby':
        appendOutput('- Веду [ubot.help](https://ubot.help/);');
        appendOutput('- любого рода медиа и не только контент;');
        appendOutput('- пытаюсь паять всякое.');
        break;

      case '/contact':
        appendOutput('- Telegram: [@default_db](https://t.me/default_db)');
        appendOutput('- Max: [там пока нет юзернеймов](https://max.ru/u/f9LHodD0cOK0vFx-6OeQSJlpWBuaGBmPyn5lXvlf0eqwbMBf1TPxqi7S3Ko)');
        appendOutput('- Хабр: [dmitriizakharov](https://career.habr.com/dmitriizakharov)');
        appendOutput(`- Почта: ${mail}`);
        break;

      case '/date':
        appendOutput('- Сайт обновлялся последний раз 10 сентября 2025 года');
        appendOutput('- [Следить на Github](https://github.com/dfltdlbb/zakharov/)');
        break;

      case '/reset':
        clearOutput();
        break;

      default:
        appendOutput('Не известная команда. Напишите /help для справки.');
    }
  }

// === обработчики ввода (фиксы Enter на мобилках) ===
const getPlain = () => cliInputDiv.innerText || cliInputDiv.textContent || '';
const containsBR = () => /<br\s*\/?>/i.test(cliInputDiv.innerHTML);
const containsDivLine = () => /<div>/i.test(cliInputDiv.innerHTML);
const containsLineBreakText = () => /\n/.test(getPlain());

function submitCommandIfAny() {
  const raw = getPlain();
  const cmd = raw.replace(/\n+/g, '').trim();
  if (!cmd) { cliInputDiv.innerHTML = ''; return; }

if (!isTouch()) enterFS(cliContainer);

  processCommand(cmd);
  cliInputDiv.innerHTML = '';
}

// 1) Десктоп: стандартный Enter
cliInputDiv.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    submitCommandIfAny();
  }
});
// 2) Мобилки: ловим beforeinput с insertLineBreak
cliInputDiv.addEventListener('beforeinput', (e) => {
  if (e.inputType === 'insertLineBreak') {
    e.preventDefault();
    submitCommandIfAny();
  }
});
// 3) Мобилки: fallback — ловим появление \n или <br>/<div>
cliInputDiv.addEventListener('input', () => {
  if (containsLineBreakText() || containsBR() || containsDivLine()) {
    submitCommandIfAny();
  }
});
// 4) Очень старые браузеры (keypress)
cliInputDiv.addEventListener('keypress', (e) => {
  if (e.keyCode === 13) {
    e.preventDefault();
    submitCommandIfAny();
  }
});

// Esc — выход из полноэкрана
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isFS()) exitFS(); });

// === Кнопка Enter/Exit у терминала ===
// - Если сейчас fullscreen активен — выходим из FS (без эмуляции Enter)
// - Если fullscreen НЕ активен — эмулируем Enter,
//   а вход в fullscreen разрешаем только на десктопе
fullBtn.addEventListener('click', () => {
  if (isFS()) {
    exitFS();
    return;
  }

  // Всегда эмулируем Enter
  try {
    cliInputDiv.focus();
    const ev = new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true
    });
    cliInputDiv.dispatchEvent(ev);
  } catch (_) {}

  // Фолбэк: если synthetic keydown проигнорировали
  queueMicrotask(() => {
    try { submitCommandIfAny(); } catch (_) {}
  });

  // ⛔️ На мобильных не входим в fullscreen
  if (!isTouch()) {
    enterFS(cliContainer);
  }
});

// === Кнопка Enter в intro (если есть) — тоже жмёт Enter в CLI ===
const introEnterBtn = document.querySelector('#intro-enter-btn, .intro .enter-btn, [data-enter-trigger]');
if (introEnterBtn) {
  introEnterBtn.addEventListener('click', () => {
    try {
      cliInputDiv.focus();
      const ev = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      cliInputDiv.dispatchEvent(ev);
    } catch (_) {}
    queueMicrotask(() => {
      try { submitCommandIfAny(); } catch (_) {}
    });
  });
}

// Стартовый текст
clearOutput();
});

/* =========================================================
   5) «А чего так мало?» — запуск по вьюпорту, быстрый тайпинг
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const moreCard = document.querySelector('#more-projects-card, .more-card');
  if (!moreCard) return;

  const titleEl = moreCard.querySelector('.typer-text');
  const paraEl  = moreCard.querySelector('.typer-paragraph');
  const btn     = moreCard.querySelector('#more-btn, .more-btn');
  let played = false;

  if (btn) {
    if (!btn.querySelector('.btn-label')) {
      const label = document.createElement('span');
      label.className = 'btn-label';
      label.textContent = 'Открыть список';
      btn.appendChild(label);
    }
  }

  function inView(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const vw = window.innerWidth  || document.documentElement.clientWidth;
    return r.top < vh * 0.85 && r.bottom > vh * 0.15 && r.left < vw && r.right > 0;
  };

  function typeText(el, text, speed) {
    return new Promise((resolve) => {
      el.textContent = '';
      let i = 0;
      const tick = () => {
        el.textContent += text[i++];
        if (i < text.length) setTimeout(tick, speed);
        else resolve();
      };
      tick();
    });
  }

  async function playTyper() {
    if (played) return;
    played = true;
    const t1 = 'А чего так мало?';
    const t2 = 'Я показываю актуальный уровень качества моей работы. Все более ранние примеры не репрезентативны, но если они действительно вас интересуют, пишите, покажу.';

    if (titleEl) await typeText(titleEl, t1, 15);
    if (paraEl)  await typeText(paraEl,  t2, 5);
    if (btn)     btn.classList.add('show');
  }

  const onScroll = () => { if (inView(moreCard)) playTyper(); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  setTimeout(onScroll, 200);
});

/* =========================================================
   6) Мелкие UX-хелперы: копирование e-mail, «mailto:»
   ========================================================= */
(() => {
  const copyBtn = document.querySelector('[data-copy-mail]');
  const mailLink = document.querySelector('a[href^="mailto:"]');
  const mail = (mailLink && mailLink.getAttribute('href') || '').replace(/^mailto:/, '') || 'a23059@ya.ru';

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(mail);
        copyBtn.classList.add('done');
        copyBtn.setAttribute('aria-label', 'Скопировано!');
        setTimeout(() => {
          copyBtn.classList.remove('done');
          copyBtn.setAttribute('aria-label', 'Скопировать e-mail');
        }, 1500);
      } catch(_) {}
    });
  }

  const contactBtn = document.querySelector('[data-mailto]');
  if (contactBtn) {
    contactBtn.addEventListener('click', () => {
      const subject = 'Привет! Вопрос по сотрудничеству';
      const body = 'Расскажите, пожалуйста, о своём проекте: цели, сроки, бюджет.';
      const link = `mailto:${mail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = link;
    });
  }
})();
