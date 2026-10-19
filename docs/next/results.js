/* TCoVP research results. All reported values live in results-data.json. */
(() => {
  'use strict';

  const script = document.currentScript;
  const dataUrl = new URL('results-data.json', script ? script.src : document.baseURI);
  const tableKeys = ['groundmore', 'general', 'representation', 'training'];
  const state = { data: null, request: null, active: 'groundmore', model: 'TCoVP-M-4B', bound: false, observer: null };
  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const keyOf = (value) => value === 'ablation' ? 'representation' : value;
  const score = (row, benchmark, metric = 'J&F') => row.metrics[benchmark][metric];
  const shortName = (row) => row.label.replace(/ \([^)]*\)/g, '').trim();
  const backbone = (row) => row.backbone || (row.label.match(/\((Qwen[^)]*|Molmo[^)]*)\)/) || [])[1] || '';
  const findRow = (table, prefix) => table.rows.find(row => row.label.startsWith(prefix));

  function note(text) { return el('p', 'results-note', text); }
  function heading(kicker, title, description) {
    const block = el('div', 'results-overview-heading');
    block.append(el('p', 'results-kicker', kicker), el('h3', '', title));
    if (description) block.append(note(description));
    return block;
  }

  function bars(rows, benchmark, label) {
    const chart = el('div', 'result-chart');
    const list = el('ul', 'result-bars');
    list.setAttribute('aria-label', label);
    rows.forEach((row) => {
      const value = score(row, benchmark);
      const item = el('li', `result-bar-row${row.ours ? ' is-ours' : ''}`);
      const meta = el('div', 'result-bar-meta');
      const names = el('span', 'result-bar-name');
      names.append(el('strong', '', shortName(row)));
      if (backbone(row)) names.append(el('small', '', backbone(row)));
      meta.append(names, el('span', 'result-bar-value', value));
      const track = el('div', 'result-bar-track');
      const fill = el('span', 'result-bar-fill');
      fill.setAttribute('aria-hidden', 'true');
      fill.style.width = `${Number(value)}%`;
      fill.style.transformOrigin = 'left center';
      fill.style.transform = 'scaleX(0)';
      track.append(fill);
      item.append(meta, track);
      list.append(item);
    });
    const axis = el('div', 'result-chart-axis');
    axis.setAttribute('aria-hidden', 'true');
    ['0', '50', '100'].forEach(value => axis.append(el('span', '', value)));
    chart.append(list, axis, note('J&F · higher is better · shared 0–100 scale'));
    return chart;
  }

  function summaryTable(rows, benchmarks, caption) {
    const scroll = el('div', 'table-scroll result-summary-scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', `${caption}; scroll horizontally to view all columns`);
    const table = el('table', 'result-summary-table');
    table.append(el('caption', '', caption));
    const thead = el('thead');
    const head = el('tr');
    ['Model / backbone', ...benchmarks].forEach(label => {
      const th = el('th', '', label); th.scope = 'col'; head.append(th);
    });
    thead.append(head);
    const tbody = el('tbody');
    rows.forEach(row => {
      const tr = el('tr', row.ours ? 'is-ours' : '');
      const name = el('th', '', shortName(row)); name.scope = 'row';
      if (backbone(row)) name.append(el('small', 'result-backbone', backbone(row)));
      tr.append(name);
      benchmarks.forEach(benchmark => tr.append(el('td', '', score(row, benchmark))));
      tbody.append(tr);
    });
    table.append(thead, tbody); scroll.append(table);
    return scroll;
  }

  // Only the known, static table vocabulary can enter the document. All other
  // data are rendered through textContent, including labels and metric values.
  function originalTable(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const table = parsed.querySelector('table');
    const tags = new Set(['TABLE', 'CAPTION', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SPAN', 'STRONG', 'U', 'EM', 'SUB']);
    const attributes = new Set(['class', 'scope', 'colspan', 'rowspan', 'title', 'data-source']);
    if (!table) throw new Error('The source table is unavailable.');
    [table, ...table.querySelectorAll('*')].forEach(node => {
      if (!tags.has(node.tagName)) throw new Error('Unexpected source table element.');
      [...node.attributes].forEach(attr => { if (!attributes.has(attr.name)) node.removeAttribute(attr.name); });
    });
    return document.importNode(table, true);
  }

  function fullTable(table) {
    const details = el('details', 'results-full-table');
    details.append(el('summary', '', `Explore full Table ${table.number} · ${table.rows.length} rows`));
    details.append(note('Complete reported results, with original precision, reference labels, and best / second-best markings. “–” denotes an unreported value.'));
    const scroll = el('div', 'table-scroll');
    scroll.tabIndex = 0;
    scroll.setAttribute('role', 'region');
    scroll.setAttribute('aria-label', `Table ${table.number}; scroll horizontally to see all metrics`);
    scroll.append(originalTable(table.originalHtml));
    details.append(scroll);
    return details;
  }

  function groundmore(table) {
    const wrapper = el('div', 'results-overview');
    wrapper.append(heading('TABLE 1 / MOTION-GROUNDED REASONING', 'Follow the evidence across time.', 'Selected RL-based methods on GroundMoRe. Exact references and all comparison methods appear in the full table.'));
    const grid = el('div', 'results-comparison-grid');
    const selectedRows = table.rows.filter(row => row.group === 'RL-based VRS Methods');
    grid.append(bars(selectedRows, 'Overall', 'Selected methods: GroundMoRe overall J&F'));
    const categories = el('div', 'result-category-panel');
    categories.append(el('p', 'results-kicker', 'A CLOSER LOOK / J&F'));
    const switcher = el('div', 'result-model-switch');
    switcher.setAttribute('role', 'group');
    switcher.setAttribute('aria-label', 'Choose TCoVP backbone for category scores');
    table.rows.filter(row => row.ours).forEach(row => {
      const name = shortName(row);
      const button = el('button', name === state.model ? 'is-active' : '', name);
      button.type = 'button';
      button.dataset.resultModel = name;
      button.setAttribute('aria-pressed', String(name === state.model));
      button.title = backbone(row);
      switcher.append(button);
    });
    categories.append(switcher);
    const row = table.rows.find(candidate => shortName(candidate) === state.model) || table.rows.find(candidate => candidate.ours);
    categories.append(note(backbone(row)));
    const cards = el('div', 'result-score-grid');
    table.benchmarks.filter(name => name !== 'Overall').forEach(name => {
      const card = el('div', 'result-score-card');
      card.append(el('span', 'result-score-label', name), el('strong', 'result-score-number', score(row, name)));
      cards.append(card);
    });
    categories.append(cards);
    grid.append(categories);
    wrapper.append(grid);
    return wrapper;
  }

  function general(table) {
    const wrapper = el('div', 'results-overview');
    wrapper.append(heading('TABLE 2 / GENERAL VIDEO REASONING SEGMENTATION', 'One representation. Three backbones.', 'J&F across four benchmarks. Read model sizes and backbones alongside the scores; these are the configurations reported in the paper.'));
    const rows = [findRow(table, 'VideoSEG-O3-4B'), ...table.rows.filter(row => row.ours)].filter(Boolean);
    wrapper.append(summaryTable(rows, table.benchmarks, 'Selected Table 2 results · J&F'));
    wrapper.append(note('Additional SFT-based and RL-based methods, with J and F decompositions, appear in the full table.'));
    return wrapper;
  }

  function representation(table) {
    const wrapper = el('div', 'results-overview');
    wrapper.append(heading('TABLE 3 / REASONING REPRESENTATION', 'Make the visual references explicit.', 'Qwen2.5-VL-3B. Macro average over ReVOS, ReasonVOS, Long-RVOS, GroundMoRe, and MeViS, with each benchmark counted once.'));
    const grid = el('div', 'results-comparison-grid');
    grid.append(bars(table.rows, 'Macro avg.', 'Reasoning representation: five-benchmark macro-average J&F'));
    const ours = findRow(table, 'TCoVP-3B');
    const textCot = findRow(table, 'Text-CoT');
    const delta = (Number(score(ours, 'Macro avg.')) - Number(score(textCot, 'Macro avg.'))).toFixed(1);
    const card = el('div', 'result-insight-card');
    card.append(el('p', 'results-kicker', 'MACRO AVERAGE'), el('strong', 'result-insight-number', `+${delta}`), el('p', '', 'J&F points over Text-CoT with answer-VP.'), note('Table 3 holds data volume, backbone, and training configuration fixed between these two methods; the intermediate representation and its grounding supervision change.'));
    grid.append(card); wrapper.append(grid);
    wrapper.append(summaryTable(table.rows, table.benchmarks.filter(key => key !== 'Macro avg.'), 'Per-benchmark reasoning representation ablation · J&F'));
    return wrapper;
  }

  function training(table) {
    const wrapper = el('div', 'results-overview');
    wrapper.append(heading('TABLE 4 / TRAINING & REWARDS', 'Train the chain to follow the evidence.', 'Qwen2.5-VL-3B: supervised fine-tuning followed by chain-aligned reinforcement learning. The cards compare the two training strategies reported in Table 4.'));
    const baseline = findRow(table, 'SFT only');
    const full = findRow(table, 'SFT + chain-aligned RL');
    const cards = el('div', 'result-score-grid result-training-grid');
    table.benchmarks.forEach(name => {
      const before = score(baseline, name), after = score(full, name);
      const delta = (Number(after) - Number(before)).toFixed(1);
      const card = el('div', 'result-score-card');
      card.append(el('span', 'result-score-label', name), el('strong', 'result-score-number', `+${delta}`), el('span', 'result-score-comparison', `${before} → ${after} J&F`));
      cards.append(card);
    });
    wrapper.append(cards);
    wrapper.append(summaryTable(table.rows.filter(row => row.group === 'Different Reward Functions'), table.benchmarks, 'Reward ablation · J&F'));
    wrapper.append(note('Rta: temporal alignment reward. Rstg: spatiotemporal grounding reward. Full J&F, J, and F scores are available below.'));
    return wrapper;
  }

  function animateBars(container) {
    if (state.observer) state.observer.disconnect();
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const reveal = () => {
      container.querySelectorAll('.result-bar-fill').forEach((fill, index) => {
        fill.style.transition = reduced ? 'none' : `transform 800ms cubic-bezier(.22,1,.36,1) ${index * 45}ms`;
        fill.style.transform = 'scaleX(1)';
      });
    };
    if (reduced || !('IntersectionObserver' in window)) { reveal(); return; }
    state.observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        requestAnimationFrame(reveal);
        state.observer.disconnect();
      }
    }, { threshold: 0.08 });
    state.observer.observe(container);
  }

  function render() {
    const container = document.getElementById('results-content');
    if (!container || !state.data) return;
    const table = state.data.tables[state.active];
    const renderers = { groundmore, general, representation, training };
    const view = renderers[state.active](table);
    container.replaceChildren(view, fullTable(table));
    container.removeAttribute('aria-busy');
    container.setAttribute('role', 'tabpanel');
    document.querySelectorAll('[data-result-tab]').forEach((button, index) => {
      const active = keyOf(button.dataset.resultTab) === state.active;
      if (!button.id) button.id = `result-tab-${index}`;
      button.type = 'button';
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', container.id);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
      button.classList.toggle('is-active', active);
      if (active) container.setAttribute('aria-labelledby', button.id);
    });
    animateBars(view);
  }

  async function initializeResults() {
    const container = document.getElementById('results-content');
    if (!container) return;
    if (!state.bound) {
      const tabs = [...document.querySelectorAll('[data-result-tab]')];
      const selected = tabs.find(button => button.getAttribute('aria-selected') === 'true' || button.classList.contains('is-active'));
      if (selected && tableKeys.includes(keyOf(selected.dataset.resultTab))) state.active = keyOf(selected.dataset.resultTab);
      if (tabs[0] && tabs.every(button => button.parentElement === tabs[0].parentElement)) tabs[0].parentElement.setAttribute('role', 'tablist');
      tabs.forEach((button, index) => {
        button.addEventListener('click', () => {
          const key = keyOf(button.dataset.resultTab);
          if (!tableKeys.includes(key)) return;
          state.active = key;
          render();
        });
        button.addEventListener('keydown', event => {
          let next;
          if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
          if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
          if (event.key === 'Home') next = 0;
          if (event.key === 'End') next = tabs.length - 1;
          if (next === undefined) return;
          event.preventDefault(); tabs[next].click(); tabs[next].focus();
        });
      });
      container.addEventListener('click', event => {
        const button = event.target.closest('[data-result-model]');
        if (!button || !container.contains(button)) return;
        state.model = button.dataset.resultModel;
        render();
        [...container.querySelectorAll('[data-result-model]')].find(item => item.dataset.resultModel === state.model)?.focus({ preventScroll: true });
      });
      state.bound = true;
    }
    if (state.data) { render(); return; }
    container.setAttribute('aria-busy', 'true');
    container.replaceChildren(note('Loading the reported results…'));
    try {
      if (!state.request) state.request = fetch(dataUrl).then(response => {
        if (!response.ok) throw new Error(`Results request failed (${response.status}).`);
        return response.json();
      });
      const data = await state.request;
      if (data.schemaVersion !== 1 || !tableKeys.every(key => data.tables?.[key]?.rows?.length)) throw new Error('Unexpected results data format.');
      state.data = data;
      render();
    } catch (error) {
      state.request = null;
      container.removeAttribute('aria-busy');
      const message = note('The results could not be loaded. Read the complete tables on the original project page.');
      const link = el('a', '', 'Open original results'); link.href = '../original.html#results';
      const retry = el('button', 'result-retry', 'Retry'); retry.type = 'button';
      retry.addEventListener('click', initializeResults);
      container.replaceChildren(message, link, retry);
      console.error('TCoVP results:', error);
    }
  }

  window.initializeResults = initializeResults;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initializeResults, { once: true });
  else initializeResults();
})();
