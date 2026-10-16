'use strict';
(() => {
  const games = [
    { name: 'Recife', page: 'recife.html', prefixes: ['mare-solo-', 'mare-duo-', 'mare-quartet-'] },
    { name: 'Abismo', page: 'abismo.html', prefixes: ['mare-semantico-'] },
    { name: 'Cardume', page: 'cardume.html', prefixes: ['mare-cardume-daily-', 'mare-cardume-free-'] },
    { name: 'Corrente', page: 'corrente.html', prefixes: ['mare-corrente-daily-', 'mare-corrente-free-'] },
    { name: 'Concha', page: 'concha.html', prefixes: ['mare-concha-daily-', 'mare-concha-free-'] },
    { name: 'Trilha', page: 'trilha.html', prefixes: ['mare-trilha-daily-', 'mare-trilha-free-'] },
    { name: 'Enigma', page: 'enigma.html', prefixes: ['mare-enigma-daily-', 'mare-enigma-free-'] },
    { name: 'Náufrago', page: 'forca.html', prefixes: ['mare-forca-daily-', 'mare-forca-free-'] },
    { name: 'Sinais', page: 'criptograma.html', prefixes: ['mare-criptograma-daily-', 'mare-criptograma-free-'] },
    { name: 'Pérola', page: 'perola.html', prefixes: ['mare-perola-free-index'] },
    { name: 'Farol', page: 'farol.html', prefixes: ['mare-farol-free-index'] },
    { name: 'Marujo', page: 'marujo.html', prefixes: ['mare-marujo-daily-', 'mare-marujo-free-', 'mare-marulho-daily-', 'mare-marulho-free-'] }
  ];
  let savedKeys = [];
  let lastVisited = null;
  try {
    savedKeys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter(Boolean);
    lastVisited = localStorage.getItem('mare-last-played');
  } catch { /* O catálogo continua funcional sem armazenamento. */ }
  const hasProgress = game => savedKeys.some(key => game.prefixes.some(prefix => key.startsWith(prefix) && (game.page !== 'abismo.html' || /^mare-semantico-\d+$/.test(key))));
  const selected = games.find(game => game.page === lastVisited && hasProgress(game)) || games.find(hasProgress);
  const resumeSection = document.getElementById('continuar');
  const resumeNavLink = document.querySelector('.mar-top nav a[href="#continuar"]');
  if (resumeSection) resumeSection.hidden = !selected;
  if (resumeNavLink) resumeNavLink.hidden = !selected;
  if (selected) {
    const label = document.getElementById('mar-resume-label');
    const link = document.getElementById('mar-resume-link');
    if (label && link) {
      label.textContent = 'Retome sua expedição em ' + selected.name + '.';
      link.href = selected.page;
      link.textContent = 'Continuar em ' + selected.name + ' ↗';
    }
  }
  document.querySelectorAll('a[href]').forEach(link => {
    const game = games.find(item => link.getAttribute('href')?.split('?')[0] === item.page);
    if (!game) return;
    link.addEventListener('click', () => {
      try { localStorage.setItem('mare-last-played', game.page); } catch {}
    });
  });
})();