/* ==============================
   NETLAB — Interacciones principales
================================ */
(() => {
  'use strict';

  const data = window.NETLAB_DATA;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.documentElement.classList.add('js');

  /* ==============================
     Menú lateral accesible
  ================================ */
  const menuButton = qs('[data-menu-button]');
  const menuPanel = qs('[data-menu-panel]');
  const menuOverlay = qs('[data-menu-overlay]');
  const menuClose = qs('[data-menu-close]');
  let lastFocused = null;

  const getFocusable = () => qsa('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])', menuPanel);

  const openMenu = () => {
    if (!menuButton || !menuPanel || !menuOverlay) return;
    lastFocused = document.activeElement;
    menuButton.setAttribute('aria-expanded', 'true');
    menuPanel.classList.add('is-open');
    menuOverlay.classList.add('is-visible');
    menuOverlay.hidden = false;
    document.body.classList.add('menu-open');
    requestAnimationFrame(() => getFocusable()[0]?.focus());
  };

  const closeMenu = ({ restoreFocus = true } = {}) => {
    if (!menuButton || !menuPanel || !menuOverlay) return;
    menuButton.setAttribute('aria-expanded', 'false');
    menuPanel.classList.remove('is-open');
    menuOverlay.classList.remove('is-visible');
    document.body.classList.remove('menu-open');
    window.setTimeout(() => {
      if (!menuOverlay.classList.contains('is-visible')) menuOverlay.hidden = true;
    }, reduceMotion ? 0 : 260);
    if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
  };

  menuButton?.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    isOpen ? closeMenu() : openMenu();
  });
  menuClose?.addEventListener('click', () => closeMenu());
  menuOverlay?.addEventListener('click', () => closeMenu());

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuPanel?.classList.contains('is-open')) {
      closeMenu();
      return;
    }

    if (event.key === 'Tab' && menuPanel?.classList.contains('is-open')) {
      const focusable = getFocusable();
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  qsa('[data-nav-link]').forEach((link) => {
    link.addEventListener('click', () => closeMenu({ restoreFocus: false }));
  });

  /* ==============================
     Header, progreso y scrollspy
  ================================ */
  const header = qs('[data-header]');
  const progressBar = qs('[data-reading-progress]');
  const currentTopic = qs('[data-current-topic]');
  const sections = qsa('main section[id]');
  const navLinks = qsa('[data-nav-link]');
  let scrollTicking = false;

  const updateScrollUI = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, scrollTop / docHeight) : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    header?.classList.toggle('is-scrolled', scrollTop > 18);
    scrollTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollUI);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollUI();

  const scrollSpy = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;

    const id = visible.target.id;
    const title = visible.target.dataset.navTitle || visible.target.querySelector('h2')?.textContent || 'NETLAB';
    navLinks.forEach((link) => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
    if (currentTopic) currentTopic.textContent = title;
  }, { rootMargin: '-28% 0px -58% 0px', threshold: [0, 0.15, 0.4, 0.65] });

  sections.forEach((section) => scrollSpy.observe(section));

  /* ==============================
     Apariciones al entrar al viewport
  ================================ */
  const revealEls = qsa('[data-reveal]');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.delay || 0);
        window.setTimeout(() => entry.target.classList.add('is-visible'), delay);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -40px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ==============================
     Tipos de red
  ================================ */
  const typeButtons = qsa('[data-network-type]');
  const typePanel = qs('[data-network-panel]');

  const renderNetworkType = (key) => {
    const item = data?.networkTypes?.[key];
    if (!item || !typePanel) return;
    qs('[data-type-short]', typePanel).textContent = item.short;
    qs('[data-type-title]', typePanel).textContent = item.title;
    qs('[data-type-description]', typePanel).textContent = item.description;
    qs('[data-type-range]', typePanel).textContent = item.range;
    qs('[data-type-speed]', typePanel).textContent = item.speed;
    qs('[data-type-medium]', typePanel).textContent = item.medium;
    qs('[data-type-use]', typePanel).textContent = item.use;
    typePanel.dataset.activeType = key;
    typeButtons.forEach((button) => {
      const active = button.dataset.networkType === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
  };

  typeButtons.forEach((button, index) => {
    button.addEventListener('click', () => renderNetworkType(button.dataset.networkType));
    button.addEventListener('keydown', (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % typeButtons.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + typeButtons.length) % typeButtons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = typeButtons.length - 1;
      typeButtons[next].focus();
      typeButtons[next].click();
    });
  });
  renderNetworkType('lan');

  /* ==============================
     Topologías estrella / malla
  ================================ */
  const topologyButtons = qsa('[data-topology-button]');
  const topologyViews = qsa('[data-topology-view]');
  topologyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const key = button.dataset.topologyButton;
      topologyButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      topologyViews.forEach((view) => {
        view.hidden = view.dataset.topologyView !== key;
      });
    });
  });

  /* ==============================
     Dispositivos interactivos
  ================================ */
  const deviceButtons = qsa('[data-device]');
  const devicePanel = qs('[data-device-panel]');

  const renderDevice = (key) => {
    const item = data?.devices?.[key];
    if (!item || !devicePanel) return;
    qs('[data-device-title]', devicePanel).textContent = item.title;
    qs('[data-device-layer]', devicePanel).textContent = item.layer;
    qs('[data-device-addressing]', devicePanel).textContent = item.addressing;
    qs('[data-device-role]', devicePanel).textContent = item.role;
    qs('[data-device-detail]', devicePanel).textContent = item.detail;
    deviceButtons.forEach((button) => {
      const active = button.dataset.device === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };

  deviceButtons.forEach((button) => button.addEventListener('click', () => renderDevice(button.dataset.device)));
  renderDevice('switch');

  /* ==============================
     Comparador de medios
  ================================ */
  const scenarioButtons = qsa('[data-scenario]');
  const mediumCards = qsa('[data-medium]');
  const scenarioReason = qs('[data-scenario-reason]');
  const scenarioLabel = qs('[data-scenario-label]');

  const setScenario = (key) => {
    const scenario = data?.scenarios?.[key];
    if (!scenario) return;
    scenarioButtons.forEach((button) => {
      const active = button.dataset.scenario === key;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    mediumCards.forEach((card) => {
      const recommended = card.dataset.medium === scenario.recommended;
      card.classList.toggle('is-recommended', recommended);
      const badge = qs('[data-medium-badge]', card);
      if (badge) badge.hidden = !recommended;
    });
    if (scenarioLabel) scenarioLabel.textContent = scenario.label;
    if (scenarioReason) scenarioReason.textContent = scenario.reason;
  };

  scenarioButtons.forEach((button) => button.addEventListener('click', () => setScenario(button.dataset.scenario)));
  setScenario('home');

  /* Constructor T568A / T568B: ver js/enhancements.js */

  const cableQuestion = qs('[data-cable-question]');
  const cableFeedback = qs('[data-cable-feedback]');
  qsa('[data-cable-answer]').forEach((button) => {
    button.addEventListener('click', () => {
      const correct = button.dataset.cableAnswer === 'directo';
      qsa('[data-cable-answer]').forEach((item) => {
        item.disabled = true;
        item.classList.toggle('is-correct', item.dataset.cableAnswer === 'directo');
        item.classList.toggle('is-incorrect', item === button && !correct);
      });
      if (cableFeedback) {
        cableFeedback.hidden = false;
        cableFeedback.className = `inline-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
        cableFeedback.textContent = correct
          ? 'Correcto. PC y switch son dispositivos diferentes: se usa cable directo (Straight-Through).'
          : 'No es la opción esperada en el material. Entre un PC y un switch se utiliza cable directo (Straight-Through).';
      }
      cableQuestion?.setAttribute('data-answered', 'true');
    });
  });

  qs('[data-cable-reset]')?.addEventListener('click', () => {
    qsa('[data-cable-answer]').forEach((button) => {
      button.disabled = false;
      button.classList.remove('is-correct', 'is-incorrect');
    });
    if (cableFeedback) {
      cableFeedback.hidden = true;
      cableFeedback.textContent = '';
    }
    cableQuestion?.removeAttribute('data-answered');
  });

  /* ==============================
     Flujo de paquete
  ================================ */
  const packetNodes = qsa('[data-packet-node]');
  const packetLines = qsa('[data-packet-line]');
  const packetTitle = qs('[data-packet-title]');
  const packetBody = qs('[data-packet-body]');
  const packetCounter = qs('[data-packet-counter]');
  const packetNext = qs('[data-packet-next]');
  const packetPrev = qs('[data-packet-prev]');
  const packetPlay = qs('[data-packet-play]');
  const packetReset = qs('[data-packet-reset]');
  let packetIndex = 0;
  let packetTimer = null;
  let packetSpeed = 1;

  const renderPacketStep = (index) => {
    const steps = data?.packetSteps || [];
    if (!steps.length) return;
    packetIndex = Math.max(0, Math.min(index, steps.length - 1));
    const step = steps[packetIndex];
    packetNodes.forEach((node, nodeIndex) => node.classList.toggle('is-active', nodeIndex === packetIndex));
    packetLines.forEach((line, lineIndex) => line.classList.toggle('is-complete', lineIndex < packetIndex));
    if (packetTitle) packetTitle.textContent = step.title;
    if (packetBody) packetBody.textContent = step.body;
    if (packetCounter) packetCounter.textContent = `${packetIndex + 1} / ${steps.length}`;
    if (packetPrev) packetPrev.disabled = packetIndex === 0;
    if (packetNext) packetNext.disabled = packetIndex === steps.length - 1;
    document.dispatchEvent(new CustomEvent('netlab:packet', { detail: { index: packetIndex, total: steps.length } }));
  };

  const stopPacketPlay = () => {
    if (packetTimer) window.clearInterval(packetTimer);
    packetTimer = null;
    if (packetPlay) {
      packetPlay.dataset.playing = 'false';
      packetPlay.textContent = 'Reproducir';
    }
  };

  packetPrev?.addEventListener('click', () => { stopPacketPlay(); renderPacketStep(packetIndex - 1); });
  packetNext?.addEventListener('click', () => { stopPacketPlay(); renderPacketStep(packetIndex + 1); });
  packetReset?.addEventListener('click', () => { stopPacketPlay(); renderPacketStep(0); });
  packetPlay?.addEventListener('click', () => {
    if (packetTimer) {
      stopPacketPlay();
      return;
    }
    if (packetIndex >= data.packetSteps.length - 1) renderPacketStep(0);
    packetPlay.dataset.playing = 'true';
    packetPlay.textContent = 'Pausar';
    packetTimer = window.setInterval(() => {
      if (packetIndex >= data.packetSteps.length - 1) {
        stopPacketPlay();
        return;
      }
      renderPacketStep(packetIndex + 1);
    }, (reduceMotion ? 1700 : 1250) / packetSpeed);
  });
  renderPacketStep(0);

  const startPacketTimer = () => {
    if (packetTimer) window.clearInterval(packetTimer);
    packetTimer = window.setInterval(() => {
      if (packetIndex >= data.packetSteps.length - 1) { stopPacketPlay(); return; }
      renderPacketStep(packetIndex + 1);
    }, (reduceMotion ? 1700 : 1250) / packetSpeed);
  };

  /* Validador IPv4: ver js/enhancements.js */

  /* ==============================
     Laboratorio Packet Tracer
  ================================ */
  const labSteps = qsa('[data-lab-step]');
  const labTitle = qs('[data-lab-title]');
  const labBody = qs('[data-lab-body]');
  const labCounter = qs('[data-lab-counter]');
  const labNext = qs('[data-lab-next]');
  const labPrev = qs('[data-lab-prev]');
  const labDiagram = qs('[data-lab-diagram]');
  let labIndex = 0;

  const renderLab = (index) => {
    const steps = data?.labSteps || [];
    if (!steps.length) return;
    labIndex = Math.max(0, Math.min(index, steps.length - 1));
    const step = steps[labIndex];
    labSteps.forEach((button, buttonIndex) => {
      const active = buttonIndex === labIndex;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
    if (labTitle) labTitle.textContent = step.title;
    if (labBody) labBody.textContent = step.body;
    if (labCounter) labCounter.textContent = `Paso ${labIndex + 1} de ${steps.length}`;
    if (labPrev) labPrev.disabled = labIndex === 0;
    if (labNext) labNext.disabled = labIndex === steps.length - 1;
    if (labDiagram) labDiagram.dataset.step = String(labIndex + 1);
    document.dispatchEvent(new CustomEvent('netlab:lab', { detail: { index: labIndex, total: steps.length } }));
  };

  labSteps.forEach((button, index) => button.addEventListener('click', () => renderLab(index)));
  labPrev?.addEventListener('click', () => renderLab(labIndex - 1));
  labNext?.addEventListener('click', () => renderLab(labIndex + 1));
  renderLab(0);

  /* ==============================
     Glosario con búsqueda
  ================================ */
  const glossaryInput = qs('[data-glossary-search]');
  const glossaryList = qs('[data-glossary-list]');
  const glossaryCount = qs('[data-glossary-count]');
  const glossaryClear = qs('[data-glossary-clear]');
  const glossaryLetters = qs('[data-glossary-letters]');
  const glossaryToggle = qs('[data-glossary-toggle]');
  const glossaryState = { query: '', letter: '' };
  const currentCut = () => document.documentElement.dataset.cut || 'first';
  const inCut = (entry) => !entry[2] ? currentCut() === 'first' : (entry[2] === 'both' || entry[2] === currentCut());
  const glossaryEntries = () => (data?.glossary || []).filter(inCut);

  const fold = (text) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const initialOf = (term) => fold(term).charAt(0).toUpperCase();

  const highlight = (element, text, query) => {
    element.replaceChildren();
    const needle = fold(query.trim());
    if (!needle) { element.textContent = text; return; }
    const hay = fold(text);
    let from = 0;
    let at = hay.indexOf(needle, from);
    while (at !== -1) {
      if (at > from) element.append(text.slice(from, at));
      const mark = document.createElement('mark');
      mark.textContent = text.slice(at, at + needle.length);
      element.append(mark);
      from = at + needle.length;
      at = hay.indexOf(needle, from);
    }
    if (from < text.length) element.append(text.slice(from));
  };

  const renderLetters = () => {
    if (!glossaryLetters || !data?.glossary) return;
    const letters = [...new Set(glossaryEntries().map(([term]) => initialOf(term)))].sort();
    glossaryLetters.replaceChildren();
    ['', ...letters].forEach((letter) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = letter || 'Todos';
      button.dataset.letter = letter;
      button.setAttribute('aria-pressed', String(letter === glossaryState.letter));
      button.classList.toggle('is-active', letter === glossaryState.letter);
      button.addEventListener('click', () => {
        glossaryState.letter = letter;
        renderLetters();
        renderGlossary();
      });
      glossaryLetters.appendChild(button);
    });
  };

  const renderGlossary = () => {
    if (!glossaryList || !data?.glossary) return;
    const needle = fold(glossaryState.query.trim());
    const filtered = glossaryEntries()
      .filter(([term, definition]) => (!glossaryState.letter || initialOf(term) === glossaryState.letter)
        && fold(`${term} ${definition}`).includes(needle))
      .sort((a, b) => a[0].localeCompare(b[0], 'es'));

    glossaryList.replaceChildren();
    filtered.forEach(([term, definition], index) => {
      const item = document.createElement('details');
      item.className = 'glossary-item';
      item.style.setProperty('--i', String(Math.min(index, 12)));
      const summary = document.createElement('summary');
      const termEl = document.createElement('span');
      highlight(termEl, term, glossaryState.query);
      const plus = document.createElement('span');
      plus.className = 'glossary-item__symbol';
      plus.setAttribute('aria-hidden', 'true');
      plus.textContent = '+';
      summary.append(termEl, plus);
      const paragraph = document.createElement('p');
      highlight(paragraph, definition, glossaryState.query);
      if (needle && fold(definition).includes(needle) && !fold(term).includes(needle)) item.open = true;
      item.append(summary, paragraph);
      glossaryList.appendChild(item);
    });

    if (glossaryCount) glossaryCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'término' : 'términos'}`;
    if (glossaryClear) glossaryClear.hidden = !glossaryState.query;
    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'glossary-empty';
      empty.textContent = 'No hay términos que coincidan con la búsqueda.';
      glossaryList.appendChild(empty);
    }
    if (glossaryToggle) {
      glossaryToggle.hidden = !filtered.length;
      glossaryToggle.textContent = 'Expandir todo';
      glossaryToggle.dataset.expanded = 'false';
    }
  };

  glossaryInput?.addEventListener('input', () => { glossaryState.query = glossaryInput.value; renderGlossary(); });
  glossaryClear?.addEventListener('click', () => {
    glossaryInput.value = '';
    glossaryState.query = '';
    renderGlossary();
    glossaryInput.focus();
  });
  glossaryToggle?.addEventListener('click', () => {
    const expand = glossaryToggle.dataset.expanded !== 'true';
    qsa('details', glossaryList).forEach((item) => { item.open = expand; });
    glossaryToggle.dataset.expanded = String(expand);
    glossaryToggle.textContent = expand ? 'Colapsar todo' : 'Expandir todo';
  });
  renderLetters();
  renderGlossary();
  document.addEventListener('netlab:cut', () => {
    glossaryState.letter = '';
    glossaryState.query = '';
    if (glossaryInput) glossaryInput.value = '';
    renderLetters();
    renderGlossary();
  });

  /* ==============================
     Quiz
  ================================ */
  const quizRoot = qs('[data-quiz]');
  if (quizRoot && window.NetlabQuiz && data?.quiz) {
    const bank = () => data.quiz.filter((item) => (item.cut || 'first') === (document.documentElement.dataset.cut || 'first'));
    const quiz = new window.NetlabQuiz(quizRoot, bank());
    document.addEventListener('netlab:cut', () => quiz.load(bank()));
  }

  /* ==============================
     Navegación de capítulos
  ================================ */
  qsa('[data-scroll-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = document.getElementById(button.dataset.scrollTarget);
      target?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  /* ==============================
     Año del footer
  ================================ */
  const year = qs('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* API pública para js/enhancements.js */
  window.NETLAB_API = {
    packet: {
      go: (index) => { stopPacketPlay(); renderPacketStep(index); },
      get index() { return packetIndex; },
      get playing() { return Boolean(packetTimer); },
      toggle: () => packetPlay?.click(),
      setSpeed: (value) => { packetSpeed = value; if (packetTimer) startPacketTimer(); }
    },
    lab: {
      go: (index) => renderLab(index),
      get index() { return labIndex; }
    }
  };
})();
