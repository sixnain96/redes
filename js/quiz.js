/* ==============================
   Quiz educativo
   - Preguntas y opciones en orden aleatorio
   - Atajos de teclado: A–D / 1–4 para responder, Enter para avanzar
   - Revisión de respuestas falladas y mejor puntaje guardado
================================ */
(() => {
  'use strict';

  const storeKey = () => `netlab:quiz-best:${document.documentElement.dataset.cut || 'first'}`;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const store = {
    get() { try { return JSON.parse(window.localStorage.getItem(storeKey())); } catch (e) { return null; } },
    set(value) { try { window.localStorage.setItem(storeKey(), JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ } }
  };

  const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const prepare = (questions) => shuffle(questions).map((item) => {
    const order = shuffle(item.options.map((text, index) => ({ text, correct: index === item.answer })));
    return {
      question: item.question,
      options: order.map((entry) => entry.text),
      answer: order.findIndex((entry) => entry.correct),
      explanation: item.explanation
    };
  });

  const countUp = (element, to, suffix = '', duration = 900) => {
    if (reduceMotion) { element.textContent = `${to}${suffix}`; return; }
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      element.textContent = `${Math.round(to * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  class NetlabQuiz {
    constructor(root, questions) {
      this.root = root;
      this.source = Array.isArray(questions) ? questions : [];
      this.current = 0;
      this.score = 0;
      this.answered = false;
      this.missed = [];

      if (!this.root || !this.source.length) return;
      this.limit = Math.max(1, Number(this.root.dataset.quizLimit) || this.source.length);
      this.questions = prepare(this.source).slice(0, this.limit);

      this.questionEl = this.root.querySelector('[data-quiz-question]');
      this.optionsEl = this.root.querySelector('[data-quiz-options]');
      this.feedbackEl = this.root.querySelector('[data-quiz-feedback]');
      this.progressEl = this.root.querySelector('[data-quiz-progress]');
      this.progressTextEl = this.root.querySelector('[data-quiz-progress-text]');
      this.scoreEl = this.root.querySelector('[data-quiz-score]');
      this.nextBtn = this.root.querySelector('[data-quiz-next]');
      this.restartBtn = this.root.querySelector('[data-quiz-restart]');
      this.resultEl = this.root.querySelector('[data-quiz-result]');
      this.bodyEl = this.root.querySelector('[data-quiz-body]');

      this.nextBtn?.addEventListener('click', () => this.next());
      this.restartBtn?.addEventListener('click', () => this.restart());
      this.inView = false;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(([entry]) => { this.inView = entry.isIntersecting; }, { threshold: 0.35 }).observe(this.root);
      }
      document.addEventListener('keydown', (event) => this.onKey(event));

      const hint = document.createElement('p');
      hint.className = 'quiz__hint';
      hint.textContent = 'Atajos: A–D o 1–4 para responder · Enter para continuar';
      this.bodyEl.appendChild(hint);

      this.render();
    }

    onKey(event) {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      if (this.bodyEl.hidden) return;
      const target = event.target;
      const inside = this.root.contains(target);
      const typing = target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
      if (typing || (!inside && !this.inView)) return;
      const key = event.key.toLowerCase();
      const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
      if (key in map && !this.answered && map[key] < this.questions[this.current].options.length) {
        event.preventDefault();
        this.select(map[key]);
      } else if (key === 'enter' && this.answered && document.activeElement !== this.nextBtn) {
        event.preventDefault();
        this.next();
      }
    }

    render() {
      const item = this.questions[this.current];
      if (!item || !this.questionEl || !this.optionsEl) return;

      this.answered = false;
      this.questionEl.textContent = item.question;
      this.optionsEl.replaceChildren();
      this.feedbackEl.hidden = true;
      this.feedbackEl.textContent = '';
      this.nextBtn.disabled = true;
      this.nextBtn.textContent = this.current === this.questions.length - 1 ? 'Ver resultado' : 'Siguiente pregunta';

      this.bodyEl.classList.remove('is-entering');
      void this.bodyEl.offsetWidth;
      this.bodyEl.classList.add('is-entering');

      item.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option';
        button.dataset.index = String(index);
        button.style.setProperty('--i', String(index));
        button.setAttribute('aria-pressed', 'false');

        const marker = document.createElement('span');
        marker.className = 'quiz-option__marker';
        marker.setAttribute('aria-hidden', 'true');
        marker.textContent = String.fromCharCode(65 + index);

        const label = document.createElement('span');
        label.textContent = option;

        button.append(marker, label);
        button.addEventListener('click', () => this.select(index));
        this.optionsEl.appendChild(button);
      });

      this.progressEl.style.width = `${(this.current / this.questions.length) * 100}%`;
      this.progressTextEl.textContent = `Pregunta ${this.current + 1} de ${this.questions.length}`;
      this.scoreEl.textContent = `${this.score} correctas`;
    }

    select(index) {
      if (this.answered) return;
      const item = this.questions[this.current];
      const buttons = [...this.optionsEl.querySelectorAll('.quiz-option')];
      this.answered = true;

      buttons.forEach((button, buttonIndex) => {
        button.disabled = true;
        button.setAttribute('aria-pressed', buttonIndex === index ? 'true' : 'false');
        if (buttonIndex === item.answer) button.classList.add('is-correct');
        if (buttonIndex === index && index !== item.answer) button.classList.add('is-incorrect');
      });

      const correct = index === item.answer;
      if (correct) this.score += 1;
      else this.missed.push({ item, chosen: index });

      this.feedbackEl.hidden = false;
      this.feedbackEl.className = `quiz-feedback ${correct ? 'is-correct' : 'is-incorrect'}`;
      this.feedbackEl.textContent = `${correct ? 'Correcto. ' : 'Respuesta incorrecta. '}${item.explanation}`;
      this.scoreEl.textContent = `${this.score} correctas`;
      this.progressEl.style.width = `${((this.current + 1) / this.questions.length) * 100}%`;
      this.nextBtn.disabled = false;
      this.nextBtn.focus({ preventScroll: true });
    }

    next() {
      if (!this.answered) return;
      if (this.current < this.questions.length - 1) {
        this.current += 1;
        this.render();
        this.questionEl?.focus({ preventScroll: true });
      } else {
        this.showResult();
      }
    }

    showResult() {
      const total = this.questions.length;
      const percentage = Math.round((this.score / total) * 100);
      let title = 'Buen recorrido';
      let message = 'Repasa los puntos donde tuviste dudas y vuelve a intentarlo.';

      if (percentage >= 90) {
        title = 'Dominio sobresaliente';
        message = 'Reconoces con precisión los conceptos fundamentales trabajados en el material.';
      } else if (percentage >= 70) {
        title = 'Comprensión sólida';
        message = 'Tienes una base clara. Un repaso puntual puede ayudarte a afianzar los detalles.';
      } else if (percentage >= 50) {
        title = 'Base en construcción';
        message = 'Ya identificas varios conceptos; conviene revisar dispositivos, direccionamiento y medios.';
      }

      const previous = store.get();
      const isRecord = !previous || this.score > previous.score;
      if (isRecord) store.set({ score: this.score, total, date: Date.now() });

      this.progressEl.style.width = '100%';
      this.bodyEl.hidden = true;
      this.resultEl.hidden = false;
      this.resultEl.classList.remove('is-entering');
      void this.resultEl.offsetWidth;
      this.resultEl.classList.add('is-entering');

      this.resultEl.querySelector('[data-result-title]').textContent = title;
      this.resultEl.querySelector('[data-result-message]').textContent = message;
      const scoreEl = this.resultEl.querySelector('[data-result-score]');
      const percentEl = this.resultEl.querySelector('[data-result-percent]');
      scoreEl.textContent = `0/${total}`;
      countUp(percentEl, percentage, '%');
      if (reduceMotion) scoreEl.textContent = `${this.score}/${total}`;
      else {
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / 900);
          scoreEl.textContent = `${Math.round(this.score * (1 - Math.pow(1 - t, 3)))}/${total}`;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }

      this.renderExtras(previous, isRecord);
      this.resultEl.focus({ preventScroll: true });
      document.dispatchEvent(new CustomEvent('netlab:quiz-finished', { detail: { score: this.score, total, record: isRecord } }));
    }

    renderExtras(previous, isRecord) {
      this.resultEl.querySelectorAll('.quiz-extra').forEach((node) => node.remove());
      const anchor = this.restartBtn;

      const best = document.createElement('p');
      best.className = 'quiz-extra quiz-result__best';
      if (isRecord && previous) best.textContent = `Nuevo mejor puntaje. Antes: ${previous.score}/${previous.total}.`;
      else if (isRecord) best.textContent = 'Primer intento guardado como tu mejor puntaje.';
      else best.textContent = `Tu mejor puntaje: ${previous.score}/${previous.total}.`;
      anchor.before(best);

      if (!this.missed.length) {
        const perfect = document.createElement('p');
        perfect.className = 'quiz-extra quiz-result__best';
        perfect.textContent = 'No fallaste ninguna pregunta.';
        anchor.before(perfect);
        return;
      }

      const review = document.createElement('div');
      review.className = 'quiz-extra quiz-review';
      const heading = document.createElement('h4');
      heading.textContent = `Para repasar (${this.missed.length})`;
      review.appendChild(heading);
      this.missed.forEach(({ item, chosen }, index) => {
        const card = document.createElement('article');
        card.style.setProperty('--i', String(index));
        const q = document.createElement('strong');
        q.textContent = item.question;
        const mine = document.createElement('p');
        mine.className = 'quiz-review__mine';
        mine.textContent = `Tu respuesta: ${item.options[chosen]}`;
        const right = document.createElement('p');
        right.className = 'quiz-review__right';
        right.textContent = `Correcta: ${item.options[item.answer]}`;
        const why = document.createElement('p');
        why.textContent = item.explanation;
        card.append(q, mine, right, why);
        review.appendChild(card);
      });
      anchor.before(review);
    }

    load(questions) {
      this.source = Array.isArray(questions) ? questions : [];
      this.limit = Math.max(1, Number(this.root.dataset.quizLimit) || this.source.length);
      this.restart();
    }

    restart() {
      this.questions = prepare(this.source).slice(0, this.limit);
      this.current = 0;
      this.score = 0;
      this.missed = [];
      this.answered = false;
      this.resultEl.hidden = true;
      this.bodyEl.hidden = false;
      this.render();
      this.questionEl?.focus({ preventScroll: true });
    }
  }

  window.NetlabQuiz = NetlabQuiz;
})();
