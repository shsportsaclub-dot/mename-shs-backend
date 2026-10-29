/* Scoring Heroes: odds first, provider win probability second. Never synthesize prices. */
(() => {
  'use strict';
  const number = v => {
    if (v == null || v === '') return null;
    const n = Number(String(v).replace(/[% ,]/g, ''));
    return Number.isFinite(n) ? n : null;
  };
  const market = (v) => {
    const n = number(v);
    return n !== null && n > 1 && n < 10000 ? n.toFixed(2) : null;
  };
  const probability = (v) => {
    const n = number(v);
    return n !== null && n >= 0 && n <= 100 ? Math.round(n) + '%' : null;
  };
  const side = (record, key) => {
    if (!record || typeof record !== 'object') return null;
    const nested = record[key] || {};
    const odds = market(nested.marketOdds ?? nested.decimalOdds ?? nested.odds ?? record[key + 'Odds']);
    if (odds) return { text: odds, kind: 'market-odds' };
    const pct = probability(nested.winProbability ?? nested.winningProbability ?? nested.winPercentage ?? record[key + 'WinProbability']);
    return pct ? { text: pct, kind: 'win-probability' } : null;
  };
  const resolve = record => ({
    home: side(record, 'home'),
    away: side(record, 'away')
  });
  const setSide = (element, value) => {
    if (!element) return;
    element.replaceChildren();
    if (!value) { element.hidden = true; element.removeAttribute('title'); return; }
    element.hidden = false;
    element.textContent = value.text;
    element.dataset.shValueKind = value.kind;
    element.title = value.kind === 'market-odds' ? 'Live market decimal odds (provider)' : 'Provider winning probability (not market odds)';
    element.style.cssText = 'background:none;border:0;box-shadow:none;padding:0;font-weight:700;';
  };
  function render(root, record) {
    if (!root) return;
    const values = resolve(record);
    setSide(root.querySelector('[data-sh-odds="home"]'), values.home);
    setSide(root.querySelector('[data-sh-odds="away"]'), values.away);
  }
  window.ScoringHeroesMarketDisplay = Object.freeze({ resolve, render });
  document.addEventListener('sh:match-market-update', event => {
    const root = event.detail?.root || document;
    render(root, event.detail?.market || null);
  });
})();
