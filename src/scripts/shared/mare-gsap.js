'use strict';
/* Progressive GSAP choreography for MARÉ. Gameplay and navigation never depend
   on this script or on availability of the third-party CDN. */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const allowed = () => !reduce.matches &&
    document.documentElement.dataset.mareMotion !== 'reduce' &&
    document.documentElement.dataset.mareFocus !== 'on' &&
    !navigator.connection?.saveData;
  if (!allowed()) return;

  const attach = (src) => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  const init = async () => {
    try {
      if (!window.gsap) await attach('https://cdn.jsdelivr.net/npm/gsap@3.15.0/dist/gsap.min.js');
    } catch { return; }
    if (!allowed() || !window.gsap) return;
    const gsap = window.gsap;
    const mm = gsap.matchMedia();
    let observer;
    const hero = document.querySelector('.mare-studio-hero');
    const cards = [...document.querySelectorAll('.mar-catalog .mar-game')];

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      if (!allowed()) return;
      const scope = hero || document.body;
      const ctx = gsap.context(() => {
        if (hero) {
          const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
          tl.from('.mare-studio-hero__eyebrow', { y: 14, autoAlpha: 0, duration: .55 })
            .from('.mare-studio-hero__copy h1', { y: 34, autoAlpha: 0, duration: .95 }, '-=.28')
            .from('.mare-studio-hero__copy p', { y: 20, autoAlpha: 0, duration: .7 }, '-=.55')
            .from('.mare-studio-hero__actions a', { y: 16, autoAlpha: 0, duration: .55, stagger: .11 }, '-=.40')
            .from('.mare-studio-hero__visual', { scale: .95, autoAlpha: 0, duration: 1.2, ease: 'power2.out' }, '-=1.05');
        } else {
          const intro = document.querySelector('.topbar, .mar-top');
          if (intro) gsap.from(intro, { y: -12, autoAlpha: 0, duration: .7, ease: 'power2.out', clearProps: 'all' });
        }

        if (cards.length) {
          const reveal = (items) => gsap.fromTo(items,
            { y: 28, autoAlpha: 0, scale: .975 },
            { y: 0, autoAlpha: 1, scale: 1, stagger: .07, duration: .7, ease: 'power3.out', overwrite: 'auto', clearProps: 'transform,opacity,visibility' });
          if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(entries => {
              const visible = entries.filter(entry => entry.isIntersecting).map(entry => entry.target);
              if (!visible.length) return;
              visible.forEach(card => observer.unobserve(card));
              reveal(visible);
            }, { threshold: .08, rootMargin: '0px 0px 70px 0px' });
            cards.forEach(card => observer.observe(card));
          } else reveal(cards);
        }
      }, scope);
      return () => { observer?.disconnect(); observer = null; ctx.revert(); };
    });

    const sync = () => { if (!allowed()) { observer?.disconnect(); mm.revert(); gsap.set([...cards, ...document.querySelectorAll('.mare-studio-hero__copy *, .mare-studio-hero__visual')], { clearProps: 'all' }); } };
    reduce.addEventListener?.('change', sync);
    window.addEventListener('mare:accessibility', sync);
    window.addEventListener('pagehide', () => {
      observer?.disconnect();
      reduce.removeEventListener?.('change', sync);
      window.removeEventListener('mare:accessibility', sync);
      mm.revert();
    }, { once: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
