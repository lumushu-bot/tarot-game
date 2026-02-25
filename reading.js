/* ============================================================
   reading.js — 解牌内容渲染
   ============================================================ */

const TAB_LABELS = {
  detail:  '✦ 总览',
  love:    '♡ 爱情',
  career:  '◈ 事业',
  finance: '◎ 财务',
  advice:  '✿ 建议',
};

const ELEMENT_LABELS = {
  fire:  '🔥 火',
  water: '💧 水',
  air:   '💨 风',
  earth: '🌱 土',
};

const SUIT_LABELS = {
  wands:    '权杖',
  cups:     '圣杯',
  swords:   '宝剑',
  pentacles:'星币',
};

// 位置标签（由 app.js 传入）
let _positions = [];

/**
 * 渲染牌阵导航（顶部小卡片列表）
 * @param {Array} drawnCards  [{card, isReversed, position}, ...]
 * @param {number} activeIndex 当前展开的索引
 */
function renderSpreadNav(drawnCards, activeIndex) {
  const nav = document.getElementById('spread-nav');
  nav.innerHTML = drawnCards.map((dc, i) => {
    const { card, isReversed, position } = dc;
    const isActive = i === activeIndex;
    return `
      <div class="nav-card ${isActive ? 'active' : ''} ${isReversed ? 'reversed-card' : ''}"
           onclick="selectNavCard(${i})">
        <span class="nav-emoji">${card.image}</span>
        <span class="nav-name">${card.name}</span>
        ${position ? `<span class="nav-pos">${position}</span>` : ''}
        <span class="nav-badge ${isReversed ? 'reversed' : 'upright'}">
          ${isReversed ? '逆位' : '正位'}
        </span>
      </div>
    `;
  }).join('');
}

/**
 * 渲染单张牌的完整解读面板
 * @param {Object} drawnCard  {card, isReversed, position}
 * @param {string} activeTab  当前激活的 Tab key
 */
function renderReading(drawnCard, activeTab) {
  const { card, isReversed, position } = drawnCard;
  const reading = isReversed ? card.reversed : card.upright;
  const tab = activeTab || 'detail';

  // 元素与花色显示
  const suitHtml = card.suit
    ? `<span class="meta-tag meta-suit">${card.suitCn || SUIT_LABELS[card.suit] || card.suit}</span>`
    : `<span class="meta-tag meta-suit">大阿尔卡纳</span>`;

  const elementHtml = card.element
    ? `<span class="meta-tag meta-element">${ELEMENT_LABELS[card.element] || card.element}</span>`
    : '';

  const posHtml = position
    ? `<span class="meta-tag meta-position">${position}</span>`
    : '';

  const orientHtml = isReversed
    ? `<span class="meta-tag meta-reversed">逆位</span>`
    : `<span class="meta-tag meta-upright">正位</span>`;

  // Tab 栏
  const tabsHtml = Object.entries(TAB_LABELS).map(([key, label]) => `
    <button class="tab-btn ${key === tab ? 'active' : ''}"
            onclick="switchTab('${key}')">${label}</button>
  `).join('');

  // 关键词
  const keywordsHtml = (card.keywords || []).map(k =>
    `<span class="kw-chip">${k}</span>`
  ).join('');

  // 内容
  const contentText = reading[tab] || reading.detail || '';

  const display = document.getElementById('reading-display');
  display.innerHTML = `
    <div class="reading-card-header">
      <div class="reading-card-emoji-wrap">
        <span class="reading-main-emoji ${isReversed ? 'reversed' : ''}">${card.image}</span>
      </div>
      <div class="reading-card-info">
        <div class="reading-card-name">${card.name}</div>
        <div class="reading-card-name-en">${card.nameEn}</div>
        <div class="reading-meta">
          ${suitHtml}
          ${elementHtml}
          ${posHtml}
          ${orientHtml}
        </div>
      </div>
    </div>

    <div class="keywords-row">${keywordsHtml}</div>

    <blockquote class="reading-brief">${reading.brief}</blockquote>

    <div class="reading-tabs">${tabsHtml}</div>

    <div class="reading-content" id="reading-content">
      <p>${contentText}</p>
    </div>
  `;
}

/**
 * 只刷新 Tab 内容区（不重建整个面板，提升流畅度）
 */
function updateReadingContent(drawnCard, tab) {
  const { card, isReversed } = drawnCard;
  const reading = isReversed ? card.reversed : card.upright;
  const contentEl = document.getElementById('reading-content');
  if (contentEl) {
    contentEl.style.animation = 'none';
    contentEl.offsetHeight; // reflow
    contentEl.style.animation = '';
    contentEl.innerHTML = `<p>${reading[tab] || reading.detail || ''}</p>`;
  }
  // 更新 Tab 按钮高亮
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(TAB_LABELS[tab]));
  });
}
