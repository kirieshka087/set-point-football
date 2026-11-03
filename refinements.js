// A single continuous 18-second combination: three runs, three passes, no jump on repeat.
const tacticsScene = document.querySelector('.tactics-card');
const tacticsControl = document.querySelector('.tactics-toggle');
const tacticsControlLabel = document.querySelector('.tactics-toggle-label');
const teamPlayers = [...document.querySelectorAll('.team-player')];
const sequenceBall = document.querySelector('.sequence-ball');
const ballSkin = document.querySelector('.ball-skin');
const ballTrail = document.querySelector('.ball-trail');
const passingLanes = document.querySelector('.passing-lanes');
const mobileTactics = matchMedia('(max-width:640px)');
let tacticalTime = 0;
let tacticalLastFrame = 0;
let tacticalFrame = 0;
let tacticalLastRender = 0;
let tacticalInView = false;
let tacticalPaused = false;
let tacticalReady = false;

function playerPositions(time) {
  const angle = time / 18000 * Math.PI * 2;
  return [
    {x:145 + 28 * Math.sin(angle), y:240 + 24 * Math.sin(angle)},
    {x:275 + 34 * Math.sin(angle + 2.1), y:105 + 19 * Math.cos(angle + .8)},
    {x:410 + 29 * Math.sin(angle + 4.2), y:245 + 23 * Math.cos(angle + 1.3)}
  ];
}
function renderTactics(time) {
  const positions = playerPositions(time);
  const leg = Math.floor((time % 18000) / 6000);
  const phase = (time % 6000) / 6000;
  const next = (leg + 1) % 3;
  const rawProgress = Math.max(0, Math.min(1, (phase - .2) / .57));
  const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
  const passing = phase > .2 && phase < .77;
  const source = {x:positions[leg].x + 18, y:positions[leg].y + 12};
  const target = {x:positions[next].x + 18, y:positions[next].y + 12};
  const x = source.x + (target.x - source.x) * progress;
  const y = source.y + (target.y - source.y) * progress - Math.sin(Math.PI * progress) * 7;
  const owner = progress < .5 ? leg : next;
  positions.forEach((position,index) => {
    teamPlayers[index].setAttribute('transform', `translate(${position.x.toFixed(2)} ${position.y.toFixed(2)})`);
    teamPlayers[index].querySelector('.possession-ring').style.opacity = !passing && index === owner ? '.42' : '0';
  });
  sequenceBall.setAttribute('transform', `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
  ballSkin.setAttribute('transform', `rotate(${(time / 25).toFixed(2)})`);
  passingLanes.setAttribute('d', `M${positions.map(position => `${position.x.toFixed(2)} ${position.y.toFixed(2)}`).join('L')}Z`);
  const dx = target.x - source.x, dy = target.y - source.y;
  const distance = Math.hypot(dx,dy) || 1;
  const trailLength = 28 * Math.sin(Math.PI * progress);
  ballTrail.setAttribute('x1',(x - dx / distance * trailLength).toFixed(2));
  ballTrail.setAttribute('y1',(y - dy / distance * trailLength).toFixed(2));
  ballTrail.setAttribute('x2',x.toFixed(2));
  ballTrail.setAttribute('y2',y.toFixed(2));
  ballTrail.style.opacity = passing ? String(.4 * Math.sin(Math.PI * progress)) : '0';
  tacticsScene.dataset.playPhase = passing ? 'pass' : 'control';
}
function tacticalTick(now) {
  if (tacticalLastFrame) tacticalTime = (tacticalTime + Math.min(now - tacticalLastFrame,50) * (mobileTactics.matches ? 1.3 : 1)) % 18000;
  tacticalLastFrame = now;
  if (now - tacticalLastRender >= 32) {
    renderTactics(tacticalTime);
    tacticalLastRender = now;
  }
  tacticalFrame = requestAnimationFrame(tacticalTick);
}
function syncTactics() {
  const permitted = motionOK && effectsEnabled;
  tacticsControl.disabled = !permitted;
  tacticsControl.setAttribute('aria-pressed',String(permitted && !tacticalPaused));
  tacticsControl.setAttribute('aria-label', !permitted ? 'Движение на поле отключено' : tacticalPaused ? 'Продолжить движение на поле' : 'Остановить движение на поле');
  tacticsControlLabel.textContent = !permitted ? 'Без движения' : tacticalPaused ? 'Продолжить' : 'Пауза';
  const running = permitted && !tacticalPaused && tacticalInView && tacticalReady && !document.hidden;
  tacticsScene.dataset.running = String(running);
  if (running && !tacticalFrame) {
    tacticalLastFrame = 0;
    tacticalFrame = requestAnimationFrame(tacticalTick);
  } else if (!running && tacticalFrame) {
    cancelAnimationFrame(tacticalFrame);
    tacticalFrame = 0;
    tacticalLastFrame = 0;
  }
}
tacticsControl.addEventListener('click', () => { tacticalPaused = !tacticalPaused; syncTactics(); });
document.addEventListener('visibilitychange',syncTactics);
document.addEventListener('effectschange',syncTactics);
renderTactics(0);
syncTactics();
siteReady.then(() => {
  tacticalReady = true;
  if ('IntersectionObserver' in window) {
    const fieldVisibility = new IntersectionObserver(entries => {
      tacticalInView = entries[0].isIntersecting;
      syncTactics();
    }, {threshold:.08});
    fieldVisibility.observe(tacticsScene);
  } else {
    tacticalInView = true;
    syncTactics();
  }
});
reducedMotionPreference.addEventListener('change', event => {
  motionOK = !event.matches;
  motionToggle.disabled = !motionOK;
  setEffects(motionOK);
  if (!motionOK) motionToggle.setAttribute('aria-label','Движение отключено в настройках устройства');
});

const faqKit = document.querySelector('.faq-kit');
faqKit.addEventListener('click', () => {
  if (!motionOK || !effectsEnabled) return;
  faqKit.classList.remove('is-lifted');
  requestAnimationFrame(() => requestAnimationFrame(() => faqKit.classList.add('is-lifted')));
});
faqKit.addEventListener('animationend', () => faqKit.classList.remove('is-lifted'));
let priceSettleTimer = 0;
document.querySelectorAll('[data-price-group]').forEach(button => button.addEventListener('click', () => {
  if (!motionOK || !effectsEnabled) return;
  const priceGrid = document.querySelector('.price-grid');
  clearTimeout(priceSettleTimer);
  priceGrid.classList.remove('is-changing');
  requestAnimationFrame(() => requestAnimationFrame(() => priceGrid.classList.add('is-changing')));
  priceSettleTimer = setTimeout(() => priceGrid.classList.remove('is-changing'),750);
}));
