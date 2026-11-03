const reducedMotionPreference = matchMedia('(prefers-reduced-motion: reduce)');
let motionOK = !reducedMotionPreference.matches;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const loader = document.querySelector('.loader');
const heroAssets = [...document.querySelectorAll('.football-hero img')];
const readyAssets = Promise.allSettled([document.fonts.ready, ...heroAssets.map(image => image.decode())]);
async function revealSite() {
  await delay(1000);
  loader.classList.add('loading');
  await Promise.all([delay(3000), readyAssets]);
  await delay(1000);
  document.body.classList.remove('is-loading');
  document.body.classList.add('is-ready');
}
const siteReady = revealSite();
const menuButton = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
function toggleMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  mobileMenu.inert = !open;
  mobileMenu.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  document.querySelector('main').inert = open;
  document.querySelector('footer').inert = open;
  if (open) setTimeout(() => mobileMenu.querySelector('a').focus(), motionOK ? 350 : 0);
}
menuButton.addEventListener('click', () => toggleMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
document.querySelector('.brand').addEventListener('click', () => { if (menuButton.getAttribute('aria-expanded') === 'true') toggleMenu(false); });
mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { toggleMenu(false); menuButton.focus(); }
  if (event.key === 'Tab' && menuButton.getAttribute('aria-expanded') === 'true') {
    const items = [menuButton, ...mobileMenu.querySelectorAll('a')];
    const first = items[0], last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
window.addEventListener('resize', () => { if (innerWidth > 980 && menuButton.getAttribute('aria-expanded') === 'true') toggleMenu(false); });

document.querySelectorAll('.faq-item h3 button').forEach(button => {
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    button.setAttribute('aria-expanded', String(open));
    answer.inert = !open;
    answer.classList.toggle('is-open', open);
  });
});

if ('IntersectionObserver' in window && motionOK) {
  document.body.classList.add('has-reveal');
  const entrance = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); entrance.unobserve(entry.target); } });
  }, {threshold: .13});
  siteReady.then(() => document.querySelectorAll('.reveal').forEach(element => entrance.observe(element)));
  const counters = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting || document.body.classList.contains('is-loading')) return;
    const element = entry.target, target = Number(element.dataset.counter), start = performance.now();
    function tick(now) { const progress = Math.min((now - start) / 1200, 1); element.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))); if (progress < 1) requestAnimationFrame(tick); }
    requestAnimationFrame(tick); counters.unobserve(element);
  }), {threshold:.5});
  siteReady.then(() => document.querySelectorAll('[data-counter]').forEach(element => counters.observe(element)));
}

// Light follows the pointer; objects keep their place and move by only a few pixels.
const hero = document.querySelector('.football-hero');
const field = document.querySelector('.field-photo');
const coachCard = document.querySelector('[data-coach-card]');
const motionToggle = document.querySelector('.motion-toggle');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let effectsEnabled = motionOK;
let fieldFrame = 0;
let fieldPointer = null;
function setEffects(enabled) {
  effectsEnabled = motionOK && enabled;
  document.dispatchEvent(new Event('effectschange'));
  document.body.classList.toggle('effects-off', !effectsEnabled);
  motionToggle.setAttribute('aria-pressed', String(effectsEnabled));
  motionToggle.setAttribute('aria-label', effectsEnabled ? 'Отключить движение объектов' : 'Включить движение объектов');
  hero.classList.remove('has-coach-focus');
  field.style.setProperty('--scene-x', '0px');
  field.style.setProperty('--scene-y', '0px');
  hero.style.setProperty('--coach-x', '0px');
  hero.style.setProperty('--coach-y', '0px');
  document.querySelectorAll('[data-depth-card]').forEach(card => {
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
}
setEffects(motionOK);
if (!motionOK) {
  motionToggle.disabled = true;
  motionToggle.setAttribute('aria-label', 'Движение отключено в настройках устройства');
}
motionToggle.addEventListener('click', () => setEffects(!effectsEnabled));
hero.addEventListener('pointermove', event => {
  if (!effectsEnabled || !finePointer.matches || event.pointerType === 'touch') return;
  fieldPointer = {x: event.clientX, y: event.clientY};
  if (fieldFrame) return;
  fieldFrame = requestAnimationFrame(() => {
    fieldFrame = 0;
    if (!effectsEnabled || !fieldPointer) return;
    const bounds = hero.getBoundingClientRect();
    const x = Math.max(-1, Math.min(1, (fieldPointer.x - bounds.left) / bounds.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (fieldPointer.y - bounds.top) / bounds.height * 2 - 1));
    field.style.setProperty('--scene-x', `${(x * 6).toFixed(2)}px`);
    field.style.setProperty('--scene-y', `${(y * 4).toFixed(2)}px`);
    hero.style.setProperty('--coach-x', `${(-x * 3).toFixed(2)}px`);
    hero.style.setProperty('--coach-y', `${(-y * 2).toFixed(2)}px`);
  });
}, {passive: true});
hero.addEventListener('pointerleave', () => {
  fieldPointer = null;
  field.style.setProperty('--scene-x', '0px');
  field.style.setProperty('--scene-y', '0px');
  hero.style.setProperty('--coach-x', '0px');
  hero.style.setProperty('--coach-y', '0px');
});
document.querySelectorAll('[data-depth-card]').forEach(card => {
  let cardFrame = 0;
  let cardPointer = null;
  card.addEventListener('pointermove', event => {
    if (!effectsEnabled || !finePointer.matches || event.pointerType === 'touch') return;
    cardPointer = {x: event.clientX, y: event.clientY};
    if (cardFrame) return;
    cardFrame = requestAnimationFrame(() => {
      cardFrame = 0;
      if (!effectsEnabled || !cardPointer) return;
      const bounds = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (cardPointer.x - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (cardPointer.y - bounds.top) / bounds.height));
      card.style.setProperty('--card-x', `${x * 100}%`);
      card.style.setProperty('--card-y', `${y * 100}%`);
      card.style.setProperty('--tilt-x', `${((.5 - y) * 3).toFixed(2)}deg`);
      card.style.setProperty('--tilt-y', `${((x - .5) * 3).toFixed(2)}deg`);
    });
  }, {passive: true});
  card.addEventListener('pointerleave', () => {
    cardPointer = null;
    card.style.setProperty('--tilt-x', '0deg');
    card.style.setProperty('--tilt-y', '0deg');
  });
});
coachCard.addEventListener('pointerenter', () => {
  if (effectsEnabled && finePointer.matches) hero.classList.add('has-coach-focus');
});
coachCard.addEventListener('pointerleave', () => hero.classList.remove('has-coach-focus'));
coachCard.addEventListener('focusin', () => { if (effectsEnabled) hero.classList.add('has-coach-focus'); });
coachCard.addEventListener('focusout', () => hero.classList.remove('has-coach-focus'));
document.querySelector('.art-trigger').addEventListener('click', () => {
  if (!effectsEnabled) return;
  coachCard.classList.remove('is-playing');
  requestAnimationFrame(() => requestAnimationFrame(() => coachCard.classList.add('is-playing')));
});
coachCard.querySelector('.profile-ball').addEventListener('animationend', () => coachCard.classList.remove('is-playing'));
const gloves = document.querySelector('.gloves-object');
gloves.addEventListener('click', () => {
  if (!effectsEnabled) return;
  gloves.classList.remove('is-tossing');
  requestAnimationFrame(() => requestAnimationFrame(() => gloves.classList.add('is-tossing')));
});
gloves.addEventListener('animationend', () => gloves.classList.remove('is-tossing'));
if ('IntersectionObserver' in window && motionOK) {
  const coachEntrance = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (effectsEnabled) {
        coachCard.classList.add('is-entered');
        setTimeout(() => coachCard.classList.remove('is-entered'), 1450);
      }
      coachEntrance.unobserve(entry.target);
    });
  }, {threshold: .35});
  siteReady.then(() => coachEntrance.observe(coachCard));
}

const priceGroups = {kids:{trial:600,group:4800,personal:2500},adults:{trial:900,group:5600,personal:3000}};
const priceFormatter = new Intl.NumberFormat('ru-RU');
let currentGroup = 'kids';
const activePriceAnimations = new Map();
function animatePrice(element, amount) {
  if (activePriceAnimations.has(element)) cancelAnimationFrame(activePriceAnimations.get(element));
  const from = Number(element.textContent.replace(/\s/g,'')), start = performance.now();
  if (!motionOK) { element.textContent = priceFormatter.format(amount); return; }
  function tick(now) {
    const progress = Math.min((now - start) / 850, 1);
    element.textContent = priceFormatter.format(Math.round(from + (amount - from) * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) activePriceAnimations.set(element,requestAnimationFrame(tick)); else activePriceAnimations.delete(element);
  }
  activePriceAnimations.set(element,requestAnimationFrame(tick));
}
document.querySelectorAll('[data-price-group]').forEach(button => button.addEventListener('click', () => {
  const next = button.dataset.priceGroup;
  if (next === currentGroup) return;
  currentGroup = next;
  document.querySelectorAll('[data-price-group]').forEach(other => other.setAttribute('aria-pressed',String(other === button)));
  document.querySelectorAll('[data-price]').forEach(element => animatePrice(element, priceGroups[currentGroup][element.dataset.price]));
}));

const form = document.querySelector('.booking-form');
const result = document.querySelector('.booking-result');
let planText = '';
const audienceNames = {kids:'Для ребёнка', adults:'Для взрослого', personal:'Личная тренировка'};
const levelPlans = {beginner:'Начнём с знакомства с мячом, простых передач и короткой игры',returning:'Разомнёмся, восстановим контроль мяча и закончим небольшим матчем',experienced:'Разберём первое касание, точность передач и решения под давлением'};
const timeNames = {weekday:'Вечером в будни',weekend:'В выходные'};
document.querySelectorAll('[data-program]').forEach(link => link.addEventListener('click', () => {
  form.elements.audience.value = link.dataset.program;
}));
document.querySelectorAll('[data-booking-plan]').forEach(link => link.addEventListener('click', () => {
  form.elements.audience.value = link.dataset.bookingPlan === 'personal' ? 'personal' : currentGroup;
}));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const name = form.elements.name.value.trim();
  if (!name) { form.elements.name.setCustomValidity('Укажи имя'); form.elements.name.reportValidity(); return; }
  const audience = form.elements.audience.value, level = form.elements.level.value, time = form.elements.time.value;
  result.querySelector('h3').textContent = `${name}, начинаем с паса`;
  result.querySelector('p').textContent = `${audienceNames[audience]} · ${timeNames[time]}\n${levelPlans[level]}\nВозьми спортивную одежду, подходящую обувь и воду`;
  result.hidden = false;
  planText = `SET POINT FOOTBALL\nПлан первой тренировки\n\n${name}\n${audienceNames[audience]}\n${timeNames[time]}\n\n${levelPlans[level]}\n\nС собой: спортивная одежда, подходящая обувь и вода\n\nДемонстрационный план, запись не отправлена`;
  result.scrollIntoView({behavior:motionOK ? 'smooth' : 'auto',block:'nearest'});
});
form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
document.getElementById('download-plan').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([planText],{type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href = url; link.download = 'SET-POINT-первая-тренировка.txt'; link.click();
  setTimeout(() => URL.revokeObjectURL(url),1000);
});
