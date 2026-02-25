/* ============================================================
   app.js — 主逻辑：状态管理、洗牌、翻牌、流程控制
   ============================================================ */

/* ── 牌阵配置 ─────────────────────────────────────────────── */
const SPREADS = {
  single: {
    label: '— 单张牌 · 当前启示 —',
    guide: '静下心来，点击翻开属于你的牌',
    count: 1,
    positions: ['当前启示'],
    cssClass: 'spread-single',
  },
  three: {
    label: '— 三张牌 · 过去 · 现在 · 未来 —',
    guide: '凝视牌背，感受你的直觉，依次点击翻开属于你的牌',
    count: 3,
    positions: ['过去', '现在', '未来'],
    cssClass: 'spread-three',
  },
  celtic: {
    label: '— 凯尔特十字 · 完整牌阵 —',
    guide: '凝神静气，依次点击翻开十张牌，每一张都有其特定含义',
    count: 10,
    positions: ['现状', '挑战', '根基', '过去', '可能结果', '近期未来',
                '自我认知', '外部环境', '希望与恐惧', '最终结果'],
    cssClass: 'spread-celtic celtic-layout',
  },
};

/* ── 全局状态 ─────────────────────────────────────────────── */
const state = {
  spreadType: 'three',   // 'single' | 'three' | 'celtic'
  drawnCards:  [],        // [{card, isReversed, position, flipped}, ...]
  flippedCount: 0,
  selectedIndex: 0,       // 当前解读的牌索引
  activeTab: 'detail',    // 当前 Tab
};

/* ── 工具函数 ─────────────────────────────────────────────── */

/** Fisher-Yates 洗牌 */
function shuffleDeck() {
  const deck = [...TAROT_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** 抽牌 */
function drawCards(count, positions) {
  return shuffleDeck().slice(0, count).map((card, i) => ({
    card,
    isReversed: Math.random() < 0.5,
    position: positions[i] || '',
    flipped: false,
  }));
}

/** 切换页面阶段 */
function switchPhase(phase) {
  document.querySelectorAll('.phase').forEach(el => el.classList.remove('active'));
  document.getElementById('phase-' + phase).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── 星空 Canvas 动画 ─────────────────────────────────────── */
function initStarfield() {
  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const stars = Array.from({ length: 180 }, () => ({
    x: Math.random(),
    y: Math.random(),
    r: Math.random() * 1.2 + 0.3,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.008 + 0.003,
  }));

  let raf;
  function animate(ts) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    stars.forEach(s => {
      const alpha = 0.25 + 0.65 * Math.abs(Math.sin(s.phase + ts * s.speed * 0.001));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#e0d8f5';
      ctx.beginPath();
      ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(animate);
  }
  animate(0);
}

/* ── Phase 1: Landing ─────────────────────────────────────── */
function initLanding() {
  // 牌阵选择按钮
  document.querySelectorAll('.spread-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.spread-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.spreadType = btn.dataset.spread;
    });
  });

  // 开始占卜
  document.getElementById('btn-start').addEventListener('click', startSelection);

  // 重新占卜
  document.getElementById('btn-restart').addEventListener('click', () => {
    switchPhase('landing');
  });
}

/* ── Phase 2: Selection — 渲染牌阵 ───────────────────────── */
function startSelection() {
  const spread = SPREADS[state.spreadType];
  state.drawnCards = drawCards(spread.count, spread.positions);
  state.flippedCount = 0;
  state.selectedIndex = 0;
  state.activeTab = 'detail';

  // 更新标签 & 引导文字
  document.getElementById('spread-type-label').textContent = spread.label;
  document.getElementById('guide-text').innerHTML =
    spread.guide.replace(/，/g, '，<br>');
  document.getElementById('flip-total').textContent = spread.count;
  document.getElementById('flip-count').textContent = '0';

  // 进度点
  const progressEl = document.getElementById('flip-progress');
  progressEl.innerHTML = state.drawnCards.map((_, i) =>
    `<div class="flip-dot" id="dot-${i}"></div>`
  ).join('');

  // 渲染牌阵
  const spreadEl = document.getElementById('card-spread');
  spreadEl.className = 'card-spread ' + spread.cssClass;
  spreadEl.innerHTML = state.drawnCards.map((dc, i) =>
    buildCardHTML(i, dc)
  ).join('');

  // 事件绑定
  spreadEl.querySelectorAll('.card-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      const idx = parseInt(wrapper.dataset.index);
      if (!state.drawnCards[idx].flipped) flipCard(idx);
    });
  });

  switchPhase('selection');
}

/** 构建单张牌的 HTML（牌背状态） */
function buildCardHTML(index, dc) {
  return `
    <div>
      <div class="card-wrapper" data-index="${index}">
        <div class="card-inner" id="card-inner-${index}">
          <!-- 牌背 -->
          <div class="card-face card-back">
            <div class="card-back-pattern">
              <span class="card-back-symbol">✦</span>
            </div>
          </div>
          <!-- 牌面（翻开后填充） -->
          <div class="card-face card-front ${dc.isReversed ? 'reversed' : ''}" id="card-front-${index}">
          </div>
        </div>
      </div>
      <div class="position-label">${dc.position}</div>
    </div>
  `;
}

/** 翻牌 */
function flipCard(index) {
  const dc = state.drawnCards[index];
  dc.flipped = true;
  state.flippedCount++;

  // 在翻转动画中途（约 375ms）填充牌面内容
  const inner = document.getElementById('card-inner-' + index);
  const frontEl = document.getElementById('card-front-' + index);

  setTimeout(() => {
    frontEl.innerHTML = `
      <span class="card-emoji">${dc.card.image}</span>
      <span class="card-name-zh">${dc.card.name}</span>
      <span class="card-orientation-badge ${dc.isReversed ? 'reversed' : 'upright'}">
        ${dc.isReversed ? '逆位' : '正位'}
      </span>
    `;
  }, 360);

  inner.classList.add('flipped');

  // 更新进度点
  document.getElementById('dot-' + index)?.classList.add('done');
  document.getElementById('flip-count').textContent = state.flippedCount;

  // 全部翻完 → 延迟进入解读
  if (state.flippedCount === state.drawnCards.length) {
    setTimeout(startReading, 900);
  }
}

/* ── Phase 3: Reading ─────────────────────────────────────── */
function startReading() {
  state.selectedIndex = 0;
  state.activeTab = 'detail';
  renderSpreadNav(state.drawnCards, state.selectedIndex);
  renderReading(state.drawnCards[state.selectedIndex], state.activeTab);
  switchPhase('reading');
}

/** 导航点击（切换当前查看的牌） — 供 reading.js HTML 调用 */
function selectNavCard(index) {
  state.selectedIndex = index;
  state.activeTab = 'detail';
  renderSpreadNav(state.drawnCards, state.selectedIndex);
  renderReading(state.drawnCards[state.selectedIndex], state.activeTab);
}

/** Tab 切换 — 供 reading.js HTML 调用 */
function switchTab(tab) {
  if (tab === state.activeTab) return;
  state.activeTab = tab;
  // 只刷新内容区 + Tab 高亮
  updateTabUI(tab);
  updateReadingContent(state.drawnCards[state.selectedIndex], tab);
}

function updateTabUI(tab) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active',
      btn.getAttribute('onclick') === `switchTab('${tab}')`
    );
  });
}

/* ── 初始化 ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initStarfield();
  initLanding();
});
