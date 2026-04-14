(function() {
  'use strict';

  const STORAGE_KEY = 'ruleta_contador_v2';
  const RED_NUMS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  let counts = {};
  let history = [];
  let snapshots = [];

  for (let i = 0; i <= 36; i++) counts[i] = 0;

  function getColorClass(n) {
    if (n === 0) return 'green';
    return RED_NUMS.has(n) ? 'red' : 'black';
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        counts = data.counts || counts;
        history = data.history || [];
        snapshots = data.snapshots || [];
        for (let i = 0; i <= 36; i++) if (counts[i] === undefined) counts[i] = 0;
      }
    } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ counts, history, snapshots }));
    } catch (e) {}
  }

  function buildGrid() {
    const grid = document.getElementById('grid');
    let html = '';
    for (let i = 0; i <= 36; i++) {
      html += '<button class="num-btn ' + getColorClass(i) + '" data-num="' + i + '">' +
        '<button class="dec-btn" data-dec="' + i + '">−</button>' +
        '<span class="num-val">' + i + '</span>' +
        '<span class="num-cnt" id="cnt-' + i + '">0</span>' +
        '</button>';
    }
    grid.innerHTML = html;
    grid.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        if (e.target.classList.contains('dec-btn')) return;
        const n = parseInt(btn.dataset.num);
        increment(n);
      });
    });
    grid.querySelectorAll('.dec-btn').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const n = parseInt(btn.dataset.dec);
        decrement(n);
      });
    });
  }

  function increment(n) {
    counts[n]++;
    history.push({ n, op: '+', t: Date.now() });
    maybeSnapshot();
    save();
    render();
    vibrate(10);
  }

  function decrement(n) {
    if (counts[n] <= 0) return;
    counts[n]--;
    history.push({ n, op: '-', t: Date.now() });
    save();
    render();
    vibrate(15);
  }

  function vibrate(ms) {
    if (navigator.vibrate) navigator.vibrate(ms);
  }

  function maybeSnapshot() {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const lastSnap = snapshots[snapshots.length - 1];
    if (!lastSnap || total - lastSnap.total >= 10) {
      snapshots.push({ total, counts: Object.assign({}, counts), t: Date.now() });
      if (snapshots.length > 200) snapshots.shift();
    }
  }

  function undo() {
    if (history.length === 0) return;
    const last = history.pop();
    if (last.op === '+') counts[last.n]--;
    else counts[last.n]++;
    save();
    render();
    vibrate(20);
  }

  function newSession() {
    if (!confirm('Empezar nueva sesión borra los contadores. ¿Continuar?')) return;
    for (let i = 0; i <= 36; i++) counts[i] = 0;
    history = [];
    snapshots = [];
    save();
    render();
  }

  function resetAll() {
    if (!confirm('¿Borrar absolutamente todo?')) return;
    for (let i = 0; i <= 36; i++) counts[i] = 0;
    history = [];
    snapshots = [];
    save();
    render();
  }

  function render() {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const expected = total / 37;
    const stdDev = Math.sqrt(total * (1/37) * (36/37));

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statExp').textContent = expected.toFixed(1);

    const ranked = [];
    for (let i = 0; i <= 36; i++) ranked.push({ n: i, c: counts[i] });
    ranked.sort((a, b) => b.c - a.c);

    const hotList = document.getElementById('hotList');
    const coldList = document.getElementById('coldList');
    if (total === 0) {
      hotList.innerHTML = '<span style="opacity:0.5;">—</span>';
      coldList.innerHTML = '<span style="opacity:0.5;">—</span>';
    } else {
      const topHot = ranked.slice(0, 4);
      const topCold = ranked.slice(-4).reverse();
      hotList.innerHTML = topHot.map(r => '<span class="hc-pill">' + r.n + '·' + r.c + '</span>').join('');
      coldList.innerHTML = topCold.map(r => '<span class="hc-pill">' + r.n + '·' + r.c + '</span>').join('');
    }

    for (let i = 0; i <= 36; i++) {
      const cntEl = document.getElementById('cnt-' + i);
      if (cntEl) cntEl.textContent = counts[i];
      const btn = document.querySelector('[data-num="' + i + '"]');
      if (btn) {
        btn.classList.remove('hot', 'cold');
        if (total >= 100 && stdDev > 0) {
          const z = (counts[i] - expected) / stdDev;
          if (z >= 2) btn.classList.add('hot');
          else if (z <= -2) btn.classList.add('cold');
        }
      }
    }

    const verdict = document.getElementById('verdict');
    verdict.className = 'verdict';
    if (total < 50) {
      verdict.classList.add('neutral');
      verdict.textContent = 'Necesitas al menos 100 giros para fiabilidad. Llevas ' + total + '.';
    } else {
      let chiSq = 0;
      for (let i = 0; i <= 36; i++) {
        chiSq += Math.pow(counts[i] - expected, 2) / expected;
      }
      if (chiSq > 59.892) {
        verdict.classList.add('alert');
        verdict.textContent = 'Chi² = ' + chiSq.toFixed(1) + '. Distribución muy improbable por azar (>99% confianza). Posible sesgo real.';
      } else if (chiSq > 50.998) {
        verdict.classList.add('warn');
        verdict.textContent = 'Chi² = ' + chiSq.toFixed(1) + '. Desviación significativa (>95% confianza).';
      } else {
        verdict.classList.add('neutral');
        verdict.textContent = 'Chi² = ' + chiSq.toFixed(1) + '. Consistente con azar. Esperado ' + expected.toFixed(1) + ' ± ' + stdDev.toFixed(1) + ' por número.';
      }
    }

    drawCharts();
  }

  function isDark() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function drawCharts() {
    drawBarChart();
    drawTrendChart();
  }

  function drawBarChart() {
    const canvas = document.getElementById('barChart');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement.clientWidth - 24;
    const cssH = 400;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const dark = isDark();
    const txtColor = dark ? '#F1EFE8' : '#1A1A1A';
    const mutedColor = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    if (total === 0) {
      ctx.fillStyle = mutedColor;
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sin datos todavía', cssW / 2, cssH / 2);
      return;
    }

    const expected = total / 37;
    const maxCount = Math.max.apply(null, Object.values(counts));
    const yMax = Math.max(maxCount, expected * 2);

    const padL = 30, padR = 10, padT = 20, padB = 30;
    const chartW = cssW - padL - padR;
    const chartH = cssH - padT - padB;
    const barW = chartW / 37 * 0.8;
    const gap = chartW / 37 * 0.2;

    ctx.strokeStyle = mutedColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    const expY = padT + chartH - (expected / yMax) * chartH;
    ctx.beginPath();
    ctx.moveTo(padL, expY);
    ctx.lineTo(cssW - padR, expY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = mutedColor;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('esperado ' + expected.toFixed(1), padL + 4, expY - 4);

    for (let i = 0; i <= 36; i++) {
      const x = padL + (i * (barW + gap)) + gap / 2;
      const h = (counts[i] / yMax) * chartH;
      const y = padT + chartH - h;
      const colorClass = getColorClass(i);
      let fill;
      if (colorClass === 'red') fill = '#D85A30';
      else if (colorClass === 'green') fill = '#639922';
      else fill = dark ? '#888780' : '#444441';

      const stdDev = Math.sqrt(total * (1/37) * (36/37));
      if (total >= 100 && stdDev > 0) {
        const z = (counts[i] - expected) / stdDev;
        if (z >= 2) fill = '#BA7517';
        else if (z <= -2) fill = '#378ADD';
      }

      ctx.fillStyle = fill;
      ctx.fillRect(x, y, barW, h);

      if (i % 3 === 0 || i === 36) {
        ctx.fillStyle = txtColor;
        ctx.font = '9px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i, x + barW / 2, cssH - padB + 12);
      }
    }

    ctx.fillStyle = txtColor;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', 4, cssH - padB);
    ctx.fillText(Math.round(yMax), 4, padT + 8);
  }

  function drawTrendChart() {
    const canvas = document.getElementById('trendChart');
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvas.parentElement.clientWidth - 24;
    const cssH = 400;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, cssW, cssH);

    const dark = isDark();
    const txtColor = dark ? '#F1EFE8' : '#1A1A1A';
    const mutedColor = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';

    if (snapshots.length < 2) {
      ctx.fillStyle = mutedColor;
      ctx.font = '13px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Necesitas más giros para ver tendencia', cssW / 2, cssH / 2);
      return;
    }

    const topN = Object.entries(counts)
      .map(([n, c]) => ({ n: parseInt(n), c }))
      .sort((a, b) => b.c - a.c)
      .slice(0, 5)
      .map(x => x.n);

    document.getElementById('trendLabel').textContent =
      'Evolución de los top 5: ' + topN.join(', ');

    const padL = 30, padR = 10, padT = 20, padB = 30;
    const chartW = cssW - padL - padR;
    const chartH = cssH - padT - padB;

    let maxVal = 0;
    snapshots.forEach(s => {
      topN.forEach(n => {
        if (s.counts[n] > maxVal) maxVal = s.counts[n];
      });
    });
    if (maxVal === 0) maxVal = 1;

    ctx.strokeStyle = mutedColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + chartH);
    ctx.lineTo(cssW - padR, padT + chartH);
    ctx.stroke();

    const colors = ['#D85A30', '#0F6E56', '#534AB7', '#BA7517', '#378ADD'];

    topN.forEach((num, idx) => {
      ctx.strokeStyle = colors[idx];
      ctx.lineWidth = 2;
      ctx.beginPath();
      snapshots.forEach((s, i) => {
        const x = padL + (i / (snapshots.length - 1)) * chartW;
        const val = s.counts[num] || 0;
        const y = padT + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const lastS = snapshots[snapshots.length - 1];
      const lastVal = lastS.counts[num] || 0;
      const lastY = padT + chartH - (lastVal / maxVal) * chartH;
      ctx.fillStyle = colors[idx];
      ctx.beginPath();
      ctx.arc(cssW - padR - 2, lastY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px -apple-system, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('N° ' + num, cssW - padR - 8, lastY - 6);
    });

    ctx.fillStyle = txtColor;
    ctx.font = '10px -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', 4, cssH - padB);
    ctx.fillText(maxVal, 4, padT + 8);

    ctx.textAlign = 'center';
    ctx.fillStyle = mutedColor;
    ctx.fillText('giros →', cssW / 2, cssH - 4);
  }

  function setupTabs() {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        document.getElementById('tab-grid').style.display = target === 'grid' ? '' : 'none';
        document.getElementById('tab-chart').style.display = target === 'chart' ? '' : 'none';
        document.getElementById('tab-trend').style.display = target === 'trend' ? '' : 'none';
        if (target !== 'grid') drawCharts();
      });
    });
  }

  load();
  buildGrid();
  setupTabs();
  render();

  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('newSessionBtn').addEventListener('click', newSession);
  document.getElementById('resetBtn').addEventListener('click', resetAll);

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', render);
  }

  window.addEventListener('resize', drawCharts);
})();