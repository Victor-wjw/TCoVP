/* Progressive, dependency-free presentation for the TCoVP manuscript. */
(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const byId = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const formatTime = seconds => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

  // Navigation and progress use the actual document position, including panels
  // whose height changes when the visitor opens a result table.
  const menu = byId('nav-links');
  const toggle = document.querySelector('.menu-toggle');
  const navLinks = [...menu.querySelectorAll('a')];
  const sections = navLinks.map(link => document.querySelector(link.hash));
  const progress = document.querySelector('.reading-progress');
  const closeMenu = (restoreFocus = false) => {
    const focusToggle = restoreFocus === true && menu.contains(document.activeElement);
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation');
    if (focusToggle) toggle.focus();
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  });
  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(true); });
  let scrollPending = false;
  const updateNavigation = () => {
    scrollPending = false;
    let active = 0;
    sections.forEach((section, index) => { if (section.getBoundingClientRect().top <= 150) active = index; });
    navLinks.forEach((link, index) => {
      if (active === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = `${maximum > 0 ? Math.min(100, Math.max(0, window.scrollY / maximum * 100)) : 0}%`;
  };
  window.addEventListener('scroll', () => {
    if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateNavigation); }
  }, { passive: true });
  window.addEventListener('resize', updateNavigation);
  updateNavigation();

  // The hero is an illustration of the published chain, not live inference.
  const hero = document.querySelector('.hero-art');
  const heroMotion = byId('hero-motion');
  const heroVideo = byId('hero-scene-video');
  const heroNodes = [...document.querySelectorAll('[data-hero-node]')];
  const heroLabels = ['Ground the entity', 'Connect the interaction', 'Select the target'];
  let heroStep = 0;
  let heroPaused = reducedMotion.matches;
  let heroVisible = true;
  let heroTimer;
  const paintHero = () => {
    heroNodes.forEach((node, index) => node.classList.toggle('is-active', index === heroStep));
    byId('hero-step-number').textContent = String(heroStep + 1).padStart(2, '0');
    byId('hero-step-label').textContent = heroLabels[heroStep];

  };
  const updateHeroMotion = () => {
    clearInterval(heroTimer);
    const stopped = heroPaused || !heroVisible || document.hidden;
    hero.classList.toggle('is-paused', stopped);
    if (stopped) heroVideo.pause();
    else { const playback = heroVideo.play(); if (playback) playback.catch(() => {}); }
    heroMotion.textContent = heroPaused ? '▶' : 'Ⅱ';
    heroMotion.setAttribute('aria-label', heroPaused ? 'Play illustration' : 'Pause illustration');
    heroMotion.title = heroPaused ? 'Play illustration' : 'Pause illustration';
    if (!stopped) heroTimer = setInterval(() => { heroStep = (heroStep + 1) % 3; paintHero(); }, 3400);
  };
  heroMotion.addEventListener('click', () => { heroPaused = !heroPaused; updateHeroMotion(); });
  reducedMotion.addEventListener('change', () => { heroPaused = reducedMotion.matches; updateHeroMotion(); });
  document.addEventListener('visibilitychange', updateHeroMotion);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
      updateHeroMotion();
    }).observe(hero);
  }
  updateHeroMotion();

  // A small, inspectable illustration of Figure 1's predicted action interval.
  const interval = byId('interval-scrubber');
  const updateInterval = () => {
    const time = Number(interval.value);
    const inside = time >= 2.3 && time <= 4.7;
    byId('interval-time').textContent = time.toFixed(1);
    byId('interval-state').textContent = inside ? 'Inside predicted action' : 'Outside predicted action';
    byId('interval-state').classList.toggle('outside', !inside);
    document.querySelector('.interval-controls').style.setProperty('--playhead', `${time / 11.7 * 100}%`);
    interval.setAttribute('aria-valuetext', `${time.toFixed(1)} seconds, ${inside ? 'inside' : 'outside'} the predicted action interval`);
  };
  interval.addEventListener('input', updateInterval);
  updateInterval();

  // Figure tabs support the standard tablist keyboard interaction.
  const figureTabs = [...document.querySelectorAll('[data-figure-tab]')];
  const activateFigure = (selected, focus = false) => {
    figureTabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      tab.classList.toggle('is-active', active);
      byId(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if (focus) selected.focus();
  };
  figureTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateFigure(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % figureTabs.length;
      if (event.key === 'ArrowLeft') next = (index + figureTabs.length - 1) % figureTabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = figureTabs.length - 1;
      if (next !== undefined) { event.preventDefault(); activateFigure(figureTabs[next], true); }
    });
  });

  const dialog = byId('figure-dialog');
  let figureOpener;
  document.querySelectorAll('[data-lightbox]').forEach(link => {
    link.addEventListener('click', event => {
      if (typeof dialog.showModal !== 'function') return;
      event.preventDefault();
      figureOpener = link;
      byId('figure-expanded').src = link.href;
      byId('figure-expanded').alt = link.querySelector('img').alt;
      byId('figure-original').href = link.href;
      document.body.classList.add('modal-open');
      dialog.showModal();
      byId('figure-close').focus();
    });
  });
  byId('figure-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (figureOpener) figureOpener.focus();
  });

  // Samples are recorded outputs. Step timestamps use the displayed video clock;
  // sourceInterval refers separately to the original scene. Paired raw/mask
  // videos must share one timeline so switching preserves the current moment.
  const sampleList = byId('sample-list');
  const sampleVideo = byId('sample-video');
  const sampleStage = sampleVideo.parentElement;
  const sampleFilters = [...document.querySelectorAll('[data-sample-filter]')];
  const sampleViews = [...document.querySelectorAll('[data-sample-view]')];
  const viewControls = byId('sample-view-controls');
  let samples = [];
  let selectedSample = null;
  let activeFilter = 'all';
  let pendingSeek = null;
  let selectedView = 'masked';
  const httpUrl = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try {
      const url = new URL(value, document.baseURI);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };
  const mediaPair = sample => {
    const raw = httpUrl(sample?.rawVideo), masked = httpUrl(sample?.maskedVideo);
    return raw && masked && raw !== masked ? { raw, masked } : null;
  };
  const reasoningPanel = byId('sample-reasoning');
  const reasoningReading = byId('sample-reasoning-reading');
  const reasoningChain = byId('sample-reasoning-chain');
  const traceDetails = byId('sample-trace');
  const traceContent = byId('sample-trace-content');
  const traceStatus = byId('sample-trace-status');
  const traceDownload = byId('sample-trace-download');
  const traceAnswer = byId('sample-trace-answer');
  const traceAnswerContent = byId('sample-trace-answer-content');
  const reasoningFollow = byId('sample-reasoning-follow');
  const traceState = { url: null, generation: 0, loaded: false, controller: null, observations: [], timestamps: [], follow: true, activeKey: null, activeObservation: null };
  const sameSiteTraceUrl = value => {
    const resolved = httpUrl(value);
    if (!resolved) return null;
    const url = new URL(resolved);
    return url.origin === new URL(document.baseURI).origin && !url.username && !url.password && /\.txt$/i.test(url.pathname)
      ? url.href : null;
  };
  // Token contents are always inserted as text. The trace is data, never HTML.
  // The model clock maps to the replay as: timestamp * scale - offset. Values
  // shown inside primitive tokens always remain exactly as saved in the trace.
  const traceReplayTime = value => {
    const sourceTime = Number(String(value).trim());
    const candidateScale = Number(selectedSample?.traceTimeScale);
    const scale = Number.isFinite(candidateScale) && candidateScale > 0 ? candidateScale : 1;
    const offset = Number(selectedSample?.traceTimeOffset) || 0;
    return Number.isFinite(sourceTime) ? sourceTime * scale - offset : null;
  };
  const renderTraceTokens = (container, value, timestamps = []) => {
    const tokens = /<(obj|time|box|t)>([\s\S]*?)<\/\1>/gi;
    let position = 0;
    for (const match of value.matchAll(tokens)) {
      container.append(document.createTextNode(value.slice(position, match.index)));
      const kind = match[1].toLowerCase();
      const content = match[2];
      const replayTime = kind === 't' ? traceReplayTime(content) : null;
      const seekEnabled = selectedSample?.traceSeekEnabled !== false;
      const token = make(kind === 't' && replayTime !== null && seekEnabled ? 'button' : 'span', `trace-token trace-token-${kind}${kind === 't' && !seekEnabled ? ' is-static' : ''}`);
      token.append(make('span', 'trace-token-label', kind.toUpperCase()), make('span', 'trace-token-value', content));
      if (token.tagName === 'BUTTON') {
        token.type = 'button';
        const duration = Number(selectedSample?.duration);
        const inClip = replayTime >= 0 && (!Number.isFinite(duration) || replayTime <= duration + .1);
        token.disabled = !inClip;
        token.title = inClip ? `Inspect model timestamp ${content.trim()} s · replay ${Math.max(0, replayTime).toFixed(1)} s` : 'This model timestamp is outside the displayed excerpt';
        token.setAttribute('aria-label', token.title);
        if (inClip) {
          timestamps.push(replayTime);
          token.dataset.traceTime = String(replayTime);
          token.addEventListener('click', () => { seekSample(replayTime); updateTracePlayhead(); });
        }
      }
      container.append(token);
      position = match.index + match[0].length;
    }
    container.append(document.createTextNode(value.slice(position)));
  };
  const followTraceObservation = observation => {
    if (!observation || reasoningPanel.hidden) return;
    // Only scroll an internal reader. scrollIntoView would also move the page.
    const scroller = [reasoningReading, byId('sample-reasoning-body')].find(node => node.scrollHeight > node.clientHeight + 1);
    if (!scroller) return;
    const view = scroller.getBoundingClientRect();
    const card = observation.getBoundingClientRect();
    const top = view.top + scroller.clientTop;
    const bottom = top + scroller.clientHeight;
    let adjustment = 0;
    if (card.top < top + 8) adjustment = card.top - top - 8;
    else if (card.bottom > bottom - 8) adjustment = card.height > scroller.clientHeight - 16 ? card.top - top - 8 : card.bottom - bottom + 8;
    const nextTop = Math.min(scroller.scrollHeight - scroller.clientHeight, Math.max(0, scroller.scrollTop + adjustment));
    if (Math.abs(nextTop - scroller.scrollTop) > 1) scroller.scrollTo({ top: nextTop, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  };
  reasoningFollow.addEventListener('click', () => {
    traceState.follow = !traceState.follow;
    reasoningFollow.setAttribute('aria-pressed', String(traceState.follow));
    if (traceState.follow) followTraceObservation(traceState.activeObservation);
    else [reasoningReading, byId('sample-reasoning-body')].forEach(node => node.scrollTo({ top: node.scrollTop, behavior: 'auto' }));
  });
  const updateTracePlayhead = () => {
    if (!traceState.timestamps.length) return;
    const currentTime = sampleVideo.currentTime;
    const visited = traceState.timestamps.filter(time => time <= currentTime + .15);
    const activeTime = visited.length ? Math.max(...visited) : null;
    const active = [];
    traceState.observations.forEach((observation, index) => {
      const current = activeTime !== null && observation.times.some(time => Math.abs(time - activeTime) < .001);
      observation.node.classList.toggle('is-active', current);
      if (current) { observation.node.setAttribute('aria-current', 'step'); active.push(index); }
      else observation.node.removeAttribute('aria-current');
    });
    reasoningPanel.querySelectorAll('[data-trace-time]').forEach(button => {
      button.classList.toggle('is-current', activeTime !== null && Math.abs(Number(button.dataset.traceTime) - activeTime) < .001);
    });
    const activeKey = active.join(',');
    if (activeKey !== traceState.activeKey) {
      traceState.activeKey = activeKey;
      traceState.activeObservation = active.length ? traceState.observations[active[0]].node : null;
      if (traceState.follow) followTraceObservation(traceState.activeObservation);
    }
  };
  const renderSampleTrace = raw => {
    traceContent.textContent = raw;
    traceContent.hidden = raw.length === 0;
    const thought = /<think>([\s\S]*?)<\/think>/i.exec(raw)?.[1]?.trim();
    const answer = /<answer>([\s\S]*?)<\/answer>/i.exec(raw)?.[1]?.trim();
    if (thought) {
      // Sentence/paragraph breaks only change the reading layout. Every sentence
      // retains the model's original wording, primitive values, and order.
      const observations = thought.split(/\n\s*\n|(?<=[.!?])\s+(?=[A-Z<])/).map(part => part.trim()).filter(Boolean);
      observations.forEach((observation, index) => {
        const item = make('li', 'reasoning-observation');
        const marker = make('span', 'reasoning-number mono', String(index + 1).padStart(2, '0'));
        marker.setAttribute('aria-hidden', 'true');
        const text = make('p', 'reasoning-observation-text');
        const times = [];
        renderTraceTokens(text, observation, times);
        item.append(marker, text);
        reasoningChain.append(item);
        traceState.observations.push({ node: item, times });
        traceState.timestamps.push(...times);
      });
      reasoningReading.hidden = false;
      traceStatus.hidden = true;
    } else {
      traceStatus.textContent = raw.trim() ? 'This saved output has no <think> section. Inspect its original trace below.' : 'This trace file is empty.';
      traceStatus.hidden = false;
    }
    if (answer) {
      renderTraceTokens(traceAnswerContent, answer);
      traceAnswer.hidden = false;
    }
    updateTracePlayhead();
  };
  const loadSampleTrace = async () => {
    if (!traceState.url || traceState.loaded || traceState.controller) return;
    const url = traceState.url;
    const generation = traceState.generation;
    const controller = new AbortController();
    traceState.controller = controller;
    reasoningPanel.setAttribute('aria-busy', 'true');
    traceStatus.textContent = 'Loading the saved reasoning chain…';
    traceStatus.hidden = false;
    try {
      const response = await fetch(url, { signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw new Error('Unable to load the model trace');
      const raw = await response.text();
      if (generation !== traceState.generation || url !== traceState.url) return;
      renderSampleTrace(raw);
      traceState.loaded = true;
    } catch (error) {
      if (generation !== traceState.generation || controller.signal.aborted) return;
      traceStatus.replaceChildren(document.createTextNode('The saved reasoning chain could not be loaded. '));
      const link = make('a', '', 'Open original trace ↗');
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      traceStatus.append(link);
    } finally {
      if (generation === traceState.generation && traceState.controller === controller) {
        traceState.controller = null;
        reasoningPanel.removeAttribute('aria-busy');
      }
    }
  };
  const resetSampleTrace = sample => {
    traceState.controller?.abort();
    traceState.controller = null;
    traceState.generation += 1;
    traceState.url = sameSiteTraceUrl(sample.traceUrl);
    traceState.loaded = false;
    traceState.observations = [];
    traceState.timestamps = [];
    traceState.follow = true;
    traceState.activeKey = null;
    traceState.activeObservation = null;
    reasoningFollow.setAttribute('aria-pressed', 'true');
    reasoningFollow.hidden = sample.traceSeekEnabled === false;
    traceDetails.open = false;
    reasoningPanel.hidden = !traceState.url;
    byId('sample-player').classList.toggle('has-reasoning', Boolean(traceState.url));
    reasoningPanel.removeAttribute('aria-busy');
    byId('sample-reasoning-body').scrollTop = 0;
    reasoningChain.replaceChildren();
    reasoningReading.hidden = true;
    reasoningReading.scrollTop = 0;
    traceAnswer.hidden = true;
    traceAnswerContent.replaceChildren();
    traceContent.textContent = '';
    traceContent.hidden = true;
    traceStatus.replaceChildren();
    traceStatus.hidden = true;
    const offset = Number(sample.traceTimeOffset) || 0;
    const scale = Number(sample.traceTimeScale) || 1;
    const provenance = typeof sample.traceProvenance === 'string' ? sample.traceProvenance.trim() : '';
    const seekEnabled = sample.traceSeekEnabled !== false;
    const instruction = seekEnabled ? 'Select a timestamp to inspect its visual evidence.' : 'Timestamps refer to the original scene; they do not seek this recorded demo.';
    byId('sample-reasoning-intro').textContent = `${provenance || 'Read the model’s own words in order.'} ${instruction}`;
    byId('sample-reasoning-origin').textContent = typeof sample.traceSourceLabel === 'string' && sample.traceSourceLabel.trim() ? sample.traceSourceLabel : 'MODEL OUTPUT · ORIGINAL ORDER';
    const clockNote = typeof sample.traceClockNote === 'string' ? sample.traceClockNote.trim() : '';
    const note = clockNote || (seekEnabled && (scale !== 1 || offset) ? `Model timestamps are preserved. Replay time = model time × ${scale}${offset ? ` − ${offset.toFixed(1)} s` : ''}.` : '');
    byId('sample-reasoning-clock-note').textContent = note;
    byId('sample-reasoning-clock-note').hidden = !note;
    const rawLabel = typeof sample.traceRawLabel === 'string' && sample.traceRawLabel.trim() ? sample.traceRawLabel : 'Original trace';
    byId('sample-trace-raw-label').textContent = rawLabel;
    traceContent.setAttribute('aria-label', rawLabel);
    traceDownload.textContent = typeof sample.traceDownloadLabel === 'string' && sample.traceDownloadLabel.trim() ? sample.traceDownloadLabel : 'Download original .txt ↗';
    if (traceState.url) traceDownload.href = traceState.url;
    else traceDownload.removeAttribute('href');
    if (traceState.url) loadSampleTrace();
  };
  const sampleSteps = sample => Array.isArray(sample?.steps) ? sample.steps : [];
  const safePlay = () => { const promise = sampleVideo.play(); if (promise) promise.catch(() => {}); };
  const seekSample = time => {
    const requested = Math.max(0, Number(time) || 0);
    if (sampleVideo.readyState >= 1) {
      sampleVideo.currentTime = Number.isFinite(sampleVideo.duration)
        ? Math.min(requested, Math.max(0, sampleVideo.duration - .05)) : requested;
    } else pendingSeek = requested;
  };
  sampleVideo.addEventListener('loadedmetadata', () => {
    if (pendingSeek !== null) { seekSample(pendingSeek); pendingSeek = null; }
  });
  const updateViewButtons = () => {
    sampleViews.forEach(button => {
      const active = button.dataset.sampleView === selectedView;
      button.setAttribute('aria-pressed', String(active));
      button.classList.toggle('is-active', active);
    });
  };
  sampleViews.forEach(button => button.addEventListener('click', () => {
    const pair = mediaPair(selectedSample);
    const view = button.dataset.sampleView;
    if (!pair || !pair[view] || view === selectedView) return;
    const time = pendingSeek !== null ? pendingSeek : sampleVideo.currentTime;
    const playing = !sampleVideo.paused && !sampleVideo.ended;
    const rate = sampleVideo.playbackRate;
    sampleVideo.pause();
    selectedView = view;
    pendingSeek = time;
    sampleVideo.src = pair[view];
    sampleVideo.setAttribute('aria-label', `${view === 'raw' ? 'Original video' : 'TCoVP mask'}: ${selectedSample.title}`);
    sampleVideo.load();
    sampleVideo.playbackRate = rate;
    byId('sample-caption').textContent = selectedSample.mediaNote || 'Recorded output. Original scene intervals, when provided, are labeled separately below.';
    updateViewButtons();
    if (playing) safePlay();
  }));
  const renderSampleMetadata = sample => {
    const metadata = byId('sample-meta');
    metadata.replaceChildren();
    const source = httpUrl(sample.sourceUrl);
    if (source) {
      const link = make('a', '', sample.sourceLabel || 'Source video ↗');
      link.href = source; link.target = '_blank'; link.rel = 'noopener noreferrer';
      metadata.append(link);
    }
    if (sample.model) metadata.append(make('span', 'sample-model-label', sample.model));
    if (sample.runLabel) metadata.append(make('span', 'sample-run-label', sample.runLabel));
    metadata.hidden = metadata.childElementCount === 0;
  };
  const renderSampleList = () => {
    sampleList.replaceChildren();
    samples.filter(sample => activeFilter === 'all' || sample.category === activeFilter).forEach(sample => {
      const button = make('button', `sample-card${sample === selectedSample ? ' is-active' : ''}`);
      button.type = 'button';
      button.dataset.sampleId = sample.id;
      button.setAttribute('aria-pressed', String(sample === selectedSample));
      button.setAttribute('aria-controls', 'sample-player');
      button.setAttribute('aria-label', `Replay ${sample.title}`);
      const image = make('img');
      image.src = sample.poster; image.alt = ''; image.loading = 'lazy'; image.width = 320; image.height = 180;
      button.append(image, make('strong', '', sample.title), make('small', '', `${sample.dataset || 'Video reasoning'} · recorded example`));
      button.addEventListener('click', () => {
        const hadFocus = document.activeElement === button;
        selectSample(sample, true);
        if (hadFocus) [...sampleList.querySelectorAll('[data-sample-id]')].find(item => item.dataset.sampleId === sample.id)?.focus({ preventScroll: true });
      });
      sampleList.append(button);
    });
  };
  const selectSample = (sample, play = false) => {
    sampleVideo.pause();
    selectedSample = sample;
    pendingSeek = null;
    selectedView = 'masked';
    const pair = mediaPair(sample);
    viewControls.hidden = !pair;
    updateViewButtons();
    renderSampleMetadata(sample);
    resetSampleTrace(sample);
    byId('sample-title').textContent = sample.title;
    byId('sample-query').textContent = `“${sample.query}”`;
    byId('sample-dataset').textContent = `${sample.dataset || 'Video reasoning'} / TCoVP`;
    byId('sample-index').textContent = `${String(samples.indexOf(sample) + 1).padStart(2, '0')} / ${String(samples.length).padStart(2, '0')}`;
    sampleStage.classList.toggle('is-portrait', sample.mediaAspect === 'portrait');
    byId('sample-player').classList.toggle('has-portrait', sample.mediaAspect === 'portrait');
    sampleVideo.poster = sample.poster;
    const video = pair ? pair.masked : httpUrl(sample.video) || httpUrl(sample.maskedVideo) || httpUrl(sample.rawVideo);
    if (video) sampleVideo.src = video;
    else sampleVideo.removeAttribute('src');
    sampleVideo.setAttribute('aria-label', `${pair ? 'TCoVP mask' : 'Recorded example'}: ${sample.title}`);
    sampleVideo.load();
    byId('sample-caption').textContent = sample.mediaNote || 'Recorded output. Original scene intervals, when provided, are labeled separately below.';
    document.querySelector('.sample-empty').hidden = !sample.notPresent;
    const evidence = byId('evidence-steps');
    const steps = sampleSteps(sample);
    evidence.parentElement.hidden = steps.length === 0;
    byId('evidence-source').textContent = sample.mediaKind === 'recorded-demo-excerpt' ? 'PAPER + RECORDED DEMO' : 'RECORDED MODEL OUTPUT';
    evidence.replaceChildren();
    steps.forEach((step, index) => {
      const button = make('button', `evidence-step${index === 0 ? ' is-active' : ''}`);
      button.type = 'button';
      button.dataset.step = index;
      button.setAttribute('aria-pressed', String(index === 0));
      const timeLabel = sample.mediaKind === 'recorded-model-run' ? `${Number(step.time).toFixed(1)} s` : formatTime(step.time);
      button.setAttribute('aria-label', `Seek replay to ${timeLabel}: ${step.label}`);
      const thumbnail = make('img');
      thumbnail.src = step.thumbnail; thumbnail.alt = ''; thumbnail.loading = 'lazy'; thumbnail.width = 240; thumbnail.height = 135;
      button.append(thumbnail, make('span', 'mono', `${timeLabel} REPLAY`), make('h4', '', step.label), make('p', '', step.text));
      button.addEventListener('click', () => { seekSample(step.time); safePlay(); });
      evidence.append(button);
    });
    const conclusion = byId('sample-conclusion');
    conclusion.replaceChildren();
    conclusion.append(make('span', 'tag', sample.notPresent ? 'NO TARGET' : 'SELECTED TARGET'));
    const text = make('p');
    if (sample.notPresent) {
      text.append(make('strong', '', 'Not present.'), document.createTextNode(` ${sample.absenceDescription || 'The requested target is not present; the output is an empty target mask.'}`));
    } else {
      if (sample.target) text.append(make('strong', '', String(sample.target).replaceAll('_', ' ')));
      if (Array.isArray(sample.sourceInterval) && sample.sourceInterval.length === 2 && sample.sourceInterval.every(Number.isFinite)) {
        const type = ({ action: 'predicted action interval', appearance: 'predicted appearance span' })[sample.intervalKind] || 'predicted interval';
        text.append(document.createTextNode(` · ${type}: ${sample.sourceInterval[0].toFixed(1)}–${sample.sourceInterval[1].toFixed(1)} s in the original scene.`));
      }
    }
    conclusion.append(text);
    const resultNote = typeof sample.resultNote === 'string' ? sample.resultNote.trim() : '';
    conclusion.classList.toggle('has-result-note', Boolean(resultNote));
    if (resultNote) {
      const note = make('p', 'sample-result-note');
      note.append(make('strong', '', 'Result note: '), document.createTextNode(resultNote));
      conclusion.append(note);
    }
    renderSampleList();
    if (play) safePlay();
  };
  sampleVideo.addEventListener('timeupdate', () => {
    if (!selectedSample) return;
    updateTracePlayhead();
    let current = 0;
    sampleSteps(selectedSample).forEach((step, index) => { if (sampleVideo.currentTime >= step.time - .15) current = index; });
    byId('evidence-steps').querySelectorAll('[data-step]').forEach((step, index) => {
      step.classList.toggle('is-active', index === current);
      step.setAttribute('aria-pressed', String(index === current));
    });
  });
  sampleVideo.addEventListener('error', () => {
    const caption = byId('sample-caption');
    caption.replaceChildren(document.createTextNode('This video could not be loaded. '));
    const recording = httpUrl(selectedSample?.recording?.source);
    const source = httpUrl(selectedSample?.sourceUrl);
    if (recording || source) {
      const link = make('a', 'text-link', recording ? 'Watch the full recorded demo ↗' : 'View source video ↗');
      link.href = recording || source; link.target = '_blank'; link.rel = 'noopener noreferrer';
      caption.append(link);
    }
  });
  byId('sample-replay').addEventListener('click', () => { if (selectedSample) { seekSample(0); safePlay(); } });
  const bindSampleFilter = filter => filter.addEventListener('click', () => {
    activeFilter = filter.dataset.sampleFilter;
    sampleFilters.forEach(item => {
      const active = item === filter;
      item.classList.toggle('is-active', active); item.setAttribute('aria-pressed', String(active));
    });
    const matching = samples.filter(sample => activeFilter === 'all' || sample.category === activeFilter);
    if (matching.length && !matching.includes(selectedSample)) selectSample(matching[0]);
    else renderSampleList();
  });
  sampleFilters.forEach(bindSampleFilter);
  fetch('samples-data.json?v=20261019-reasoning', { cache: 'no-cache' }).then(response => {
    if (!response.ok) throw new Error('Unable to load recorded samples');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data) || !data.length) throw new Error('No recorded samples');
    samples = data;
    [['reasoning', 'GroundMoRe'], ['internet', 'Internet antics']].forEach(([category, label]) => {
      if (!samples.some(sample => sample.category === category)) return;
      const filter = make('button', '', label);
      filter.type = 'button';
      filter.dataset.sampleFilter = category;
      filter.setAttribute('aria-pressed', 'false');
      sampleFilters[0].parentElement.append(filter);
      sampleFilters.push(filter);
      bindSampleFilter(filter);
    });
    selectSample(samples[0]);
  }).catch(() => {
    sampleList.append(make('p', 'sample-load-error', 'Examples could not be loaded. Watch the full recorded demonstration above.'));
    byId('sample-replay').disabled = true;
    byId('sample-caption').textContent = 'Open this page through an HTTP server to load its recorded examples.';
  });

  // Avoid competing audio/playback when moving between recorded demonstrations.
  document.querySelectorAll('video:not(#hero-scene-video)').forEach(video => video.addEventListener('play', () => {
    document.querySelectorAll('video:not(#hero-scene-video)').forEach(other => { if (other !== video) other.pause(); });
  }));
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.section-heading, .method-rail, .training-cards, .paper-examples, .closing-grid').forEach(node => {
      node.classList.add('reveal'); revealObserver.observe(node);
    });
  }
})();
