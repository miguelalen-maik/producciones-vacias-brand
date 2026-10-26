// Keep the approved desktop canvas; responsive layouts use their native width.
function fitDesktopCanvas() {
  const width = document.documentElement.clientWidth;
  const scale = width >= 1200 ? width / 1680 : 1;
  const headerHeight = width >= 1200 ? 76 * scale : width >= 768 ? 92 : 76;
  document.documentElement.style.setProperty('--desktop-scale', scale);
  document.documentElement.style.setProperty('--header-offset', `${headerHeight}px`);
}
fitDesktopCanvas();
window.addEventListener('resize', fitDesktopCanvas);

const menu = document.querySelector('#responsive-menu');
const menuToggle = document.querySelector('.menu-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let menuAnimations = [];
let menuClosing = false;

function animateMenu(opening) {
  const elements = [menu.querySelector('.menu-header'), menu.querySelector('.menu-content')];
  const current = elements.map(element => ({
    opacity: getComputedStyle(element).opacity,
    transform: getComputedStyle(element).transform,
  }));
  menuAnimations.forEach(animation => animation.cancel());
  menuAnimations = [];
  if (reducedMotion.matches || !menu.animate) return Promise.resolve();
  menuAnimations = elements.map((element, index) => element.animate([
    opening ? { opacity: 0, transform: 'translateY(6px)' } : current[index],
    opening ? { opacity: 1, transform: 'translateY(0)' } : { opacity: 0, transform: 'translateY(4px)' },
  ], { duration: opening ? 180 : 140, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }));
  return Promise.all(menuAnimations.map(animation => animation.finished.catch(() => {})));
}

function closeMenu({ immediate = false } = {}) {
  if (!menu.open) return;
  if (immediate || reducedMotion.matches) {
    menuAnimations.forEach(animation => animation.cancel());
    menuClosing = false;
    menu.close();
  } else if (!menuClosing) {
    menuClosing = true;
    animateMenu(false).then(() => {
      if (menuClosing) {
        menuClosing = false;
        menu.close();
      }
    });
  }
}

menuToggle.addEventListener('click', () => {
  menu.showModal();
  document.documentElement.classList.add('menu-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  menu.querySelector('.menu-close').focus({ preventScroll: true });
  animateMenu(true);
});
menu.querySelector('.menu-close').addEventListener('click', closeMenu);
// Section links close immediately so navigation never waits for an animation.
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => closeMenu({ immediate: true })));
menu.addEventListener('cancel', event => {
  event.preventDefault();
  closeMenu();
});
menu.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const controls = [...menu.querySelectorAll('a[href], button:not([disabled])')];
  const first = controls[0];
  const last = controls[controls.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});
menu.addEventListener('close', () => {
  menuAnimations.forEach(animation => animation.cancel());
  menuAnimations = [];
  menuClosing = false;
  document.documentElement.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
});
window.matchMedia('(min-width: 1200px)').addEventListener('change', event => {
  if (event.matches && menu.open) closeMenu({ immediate: true });
});

// Both cards previously had identical copy. Reserve that existing text height
// so the shorter, corrected poster copy keeps its button and surrounding layout in place.
const templateCopy = document.querySelector('[aria-labelledby="templates-heading"] .download-card > div');
const posterCopy = document.querySelector('[aria-labelledby="posters-heading"] .download-card > div');
function preservePosterCardHeight() {
  posterCopy.style.minHeight = `${templateCopy.offsetHeight}px`;
}
preservePosterCardHeight();
if ('ResizeObserver' in window) new ResizeObserver(preservePosterCardHeight).observe(templateCopy);
else window.addEventListener('resize', preservePosterCardHeight);
document.fonts.ready.then(preservePosterCardHeight);

// Progressive enhancement: content is visible by default, even without JS or
// IntersectionObserver. Animate each item once, only as it enters the viewport.
const revealed = new WeakSet();
const revealAnimations = new Set();
let revealObserver;
const revealTargets = document.querySelectorAll([
  '.hero-copy', '.hero-poster', '.concept-copy', '.business-card',
  '.logo-section img', '.palettes figure', '.colors-copy', '.type-copy', '.type-specimens',
  '.claims-copy', '.claims-collection img', '.claims-collection ul',
  '.applications .section-heading', '.ticket', '.dead-finks', '.kit-heading',
  '.kit-group h3', '.preview-card', '.download-card',
  '.contact', '.footer-meta', '.romance-logo', '.footer-bottom',
].join(','));

function setupReveals() {
  if (reducedMotion.matches || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  revealObserver = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) =>
      a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
    let cardIndex = 0;
    visible.forEach(({ target }) => {
      revealObserver.unobserve(target);
      if (revealed.has(target)) return;
      revealed.add(target);
      const card = target.classList.contains('business-card');
      // Never fade away a control while the user is interacting with it.
      if (target.matches(':hover') || target.contains(document.activeElement)) return;
      const animation = target.animate([
        { opacity: 0, transform: `translateY(${card ? 14 : 10}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: card ? 380 : 350, delay: card ? cardIndex++ * 100 : 0,
        easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards' });
      revealAnimations.add(animation);
      animation.finished.catch(() => {}).finally(() => revealAnimations.delete(animation));
    });
  }, { threshold: 0, rootMargin: '0px 0px -16px 0px' });
  revealTargets.forEach(target => { if (!revealed.has(target)) revealObserver.observe(target); });
}
setupReveals();

// Focus and pointer interaction always take priority over an entrance effect.
function finishInteractedReveal(event) {
  revealAnimations.forEach(animation => {
    if (animation.effect.target.contains(event.target)) animation.finish();
  });
}
document.addEventListener('focusin', finishInteractedReveal);
document.addEventListener('pointerdown', finishInteractedReveal, { passive: true });
reducedMotion.addEventListener('change', () => {
  revealObserver?.disconnect();
  revealAnimations.forEach(animation => animation.cancel());
  if (reducedMotion.matches) {
    menuAnimations.forEach(animation => animation.cancel());
    if (menuClosing) closeMenu({ immediate: true });
  } else setupReveals();
});

// Relative, same-origin files work on static hosting, including subdirectories.
document.querySelectorAll('.download-card button').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.externalUrl) {
      window.open(button.dataset.externalUrl, '_blank', 'noopener,noreferrer');
    } else if (button.dataset.downloadUrl) {
      const link = document.createElement('a');
      link.href = button.dataset.downloadUrl;
      link.download = button.dataset.downloadName || '';
      document.body.append(link);
      link.click();
      link.remove();
    }
  });
});
