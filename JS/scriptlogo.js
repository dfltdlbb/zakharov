(function(){
  const el    = document.getElementById('logo-typer');
  const caret = document.querySelector('.caret');
  const logo  = document.querySelector('.logo');
  if(!el || !logo) return;

  const phrases = [
    '#ProjectManager',
    '#ManagerIT',
    '#AccountManager',
    '#CustomerSuccess',
    '#DmitriiZaharov'
  ];

  const prefix = ''; // поставь '#' если нужно
  let idx = 0, pos = 0, dir = 1; // 1 — печать, -1 — удаление
  let last = 0;

  const typeDelay = 90;
  const pauseType = 800;
  const pauseErase = 220;

  function loop(t){
    const dt = t - last;
    const target = phrases[idx];
    const lastIndex = phrases.length - 1;

    // напечатали слово целиком
    if (dir === 1 && pos === target.length){
      // если это финальная фраза — остаёмся на ней, каретка мигает
      if (idx === lastIndex) {
        el.textContent = prefix + target;
        if (caret) caret.style.display = 'inline';
        return; // стоп цикла
      }
      if (dt < pauseType) return requestAnimationFrame(loop);
      dir = -1; last = t; return requestAnimationFrame(loop);
    }

    // стёрли слово целиком — переходим к следующему
    if (dir === -1 && pos === 0){
      if (dt < pauseErase) return requestAnimationFrame(loop);
      idx = Math.min(idx + 1, lastIndex);
      dir = 1; last = t; return requestAnimationFrame(loop);
    }

    if (dt >= typeDelay){
      pos += dir;
      el.textContent = prefix + target.slice(0, pos);
      last = t;
    }
    if (caret) caret.style.display = 'inline';
    requestAnimationFrame(loop);
  }

  setTimeout(()=>requestAnimationFrame(loop), 200);
})();
