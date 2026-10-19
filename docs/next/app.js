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
  const traceDetails = byId('sample-trace');
  const traceContent = byId('sample-trace-content');
  const traceStatus = byId('sample-trace-status');
  const traceDownload = byId('sample-trace-download');
  const traceState = { url: null, generation: 0, loaded: false, controller: null };
  const sameSiteTraceUrl = value => {
    const resolved = httpUrl(value);
    if (!resolved) return null;
    const url = new URL(resolved);
    return url.origin === new URL(document.baseURI).origin && !url.username && !url.password && /\.txt$/i.test(url.pathname)
      ? url.href : null;
  };
  const resetSampleTrace = sample => {
    traceState.controller?.abort();
    traceState.controller = null;
    traceState.generation += 1;
    traceState.url = sameSiteTraceUrl(sample.traceUrl);
    traceState.loaded = false;
    traceDetails.open = false;
    traceDetails.hidden = !traceState.url;
    traceDetails.removeAttribute('aria-busy');
    traceContent.textContent = '';
    traceContent.hidden = true;
    traceStatus.replaceChildren();
    traceStatus.hidden = true;
    if (traceState.url) traceDownload.href = traceState.url;
    else traceDownload.removeAttribute('href');
  };
  traceDetails.addEventListener('toggle', async () => {
    if (!traceDetails.open || !traceState.url || traceState.loaded || traceState.controller) return;
    const url = traceState.url;
    const generation = traceState.generation;
    const controller = new AbortController();
    traceState.controller = controller;
    traceDetails.setAttribute('aria-busy', 'true');
    traceStatus.textContent = 'Loading original model trace…';
    traceStatus.hidden = false;
    try {
      const response = await fetch(url, { signal: controller.signal, redirect: 'error' });
      if (!response.ok) throw new Error('Unable to load the model trace');
      const text = await response.text();
      if (generation !== traceState.generation || url !== traceState.url) return;
      traceContent.textContent = text;
      traceContent.hidden = text.length === 0;
      traceStatus.textContent = text.length ? '' : 'This trace file is empty.';
      traceStatus.hidden = text.length > 0;
      traceState.loaded = true;
    } catch (error) {
      if (generation !== traceState.generation || controller.signal.aborted) return;
      traceStatus.replaceChildren(document.createTextNode('The trace could not be loaded. '));
      const link = make('a', '', 'Open original trace ↗');
      link.href = url; link.target = '_blank'; link.rel = 'noopener noreferrer';
      traceStatus.append(link);
    } finally {
      if (generation === traceState.generation && traceState.controller === controller) {
        traceState.controller = null;
        traceDetails.removeAttribute('aria-busy');
      }
    }
  });
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
  fetch('samples-data.json').then(response => {
    if (!response.ok) throw new Error('Unable to load recorded samples');
    return response.json();
  }).then(data => {
    if (!Array.isArray(data) || !data.length) throw new Error('No recorded samples');
    samples = data;
    if (samples.some(sample => sample.category === 'internet')) {
      const filter = make('button', '', 'Internet antics');
      filter.type = 'button';
      filter.dataset.sampleFilter = 'internet';
      filter.setAttribute('aria-pressed', 'false');
      sampleFilters[0].parentElement.append(filter);
      sampleFilters.push(filter);
      bindSampleFilter(filter);
    }
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
