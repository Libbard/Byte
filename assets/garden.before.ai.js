/* ═══════════════════════════════════════════════════════════════
   CS Level 5 · Digital Garden · garden.js v3.1
   
   v3.1 Changes:
   - SM-2 Dashboard: expandable widget with stats (last review, next due, card distribution)
   - Action Links: flashcards & quiz links highlighted in sidebar with pulse animation
   - Student Notes: select text → save notes → panel in sidebar
   
   v3.0 Changes:
   - FLASHCARDS: grade 0/2 re-queues card to END of session (not removed)
   - FLASHCARDS: ascending counter stays fixed to original total
   - FLASHCARDS: restart fully reloads all due cards from scratch
   - FLASHCARDS: compact toolbar (reset inline, ⓘ at corner)
   - QUIZ: live score updates immediately
   ═══════════════════════════════════════════════════════════════ */

;(function() {
  'use strict';

  const THEMES = ['dark', 'dim', 'light'];
  const THEME_ICONS = { dark: '🌫️', dim: '️☀️', light: '🌙' };

  let currentLang = localStorage.getItem('garden_lang') || 'ar';
  let currentTheme = localStorage.getItem('garden_theme') || 'dark';

  /* ─── Early font-size restoration (prevent flash) ─── */
  (function() {
    const fs = localStorage.getItem('garden_font_size');
    if (fs) document.documentElement.setAttribute('data-font-size', fs);
  })();

  /* ─── i18n ──────────────────────────────────────────────── */
  const i18n = {
    ar: {
      'nav.home':'الرئيسية','nav.prev':'السابق','nav.next':'التالي',
      'layer.flash':'⚡ سريع','layer.full':'📖 كامل','layer.deep':'🔬 عميق',
      'fc.title':'البطاقات التعليمية','fc.due':'بطاقة للمراجعة',
      'fc.none_due':'أحسنت! لا توجد بطاقات مستحقة اليوم','fc.flip':'اضغط للقلب',
      'fc.grade.0':'لم أتذكر','fc.grade.2':'صعب','fc.grade.3':'جيد','fc.grade.5':'سهل',
      'fc.reset':'إعادة الضبط',
      'fc.info':'البطاقات تعمل بنظام التكرار المتباعد (SM-2) — أحد أقوى تقنيات الحفظ العلمية.\n\n📊 كيف يعمل التقييم:\n• "لم أتذكر" (0): البطاقة تعود لنهاية الجلسة لمحاولة أخرى.\n• "صعب" (2): تعود لنهاية الجلسة مع تقليل معامل السهولة.\n• "جيد" (3): تختفي اليوم وتعود بعد أيام.\n• "سهل" (5): تختفي وتعود بعد أسابيع أو أكثر.\n\n🧠 النظام يتكيف معك — كلما أجبت صح، زادت الفترة قبل المراجعة التالية.\n\n↺ إعادة الضبط: يمسح كل التقدم (يطلب تأكيد أولاً).',
      'fc.reset_all':'إعادة جميع البطاقات','fc.reset_hard':'الصعبة فقط',
      'fc.practice':'🔁 مراجعة حرة','fc.practice_badge':'وضع المراجعة الحرة — لا يؤثر على تقدمك',
      'fc.practice_done':'انتهت المراجعة الحرة','fc.practice_next':'التالي',
      'quiz.title':'اختبر نفسك','quiz.hint':'💡 تلميح','quiz.score':'النتيجة',
      'quiz.next':'التالي','quiz.retry':'إعادة الاختبار',
      'vault.title':'🔐 خزنة الامتحان','prof.title':'🎓 حديث البروفيسور',
      'ask.title':'❓ اسأل البروفيسور','obj.title':'🎯 أهداف التعلم',
      'toc.title':'محتويات الوحدة',
      'notes.btn':'ملاحظاتي'
    },
    en: {
      'nav.home':'Home','nav.prev':'Previous','nav.next':'Next',
      'layer.flash':'⚡ Quick','layer.full':'📖 Full','layer.deep':'🔬 Deep',
      'fc.title':'Flashcards','fc.due':'cards due',
      'fc.none_due':'Well done! No cards due today','fc.flip':'Click to flip',
      'fc.grade.0':'Blackout','fc.grade.2':'Hard','fc.grade.3':'Good','fc.grade.5':'Easy',
      'fc.reset':'Reset',
      'fc.info':'Cards use Spaced Repetition (SM-2) — one of the most powerful evidence-based memorization techniques.\n\n📊 Grading system:\n• "Blackout" (0): Card goes back to the end for another try.\n• "Hard" (2): Goes to the end with reduced ease factor.\n• "Good" (3): Disappears today, comes back in days.\n• "Easy" (5): Disappears, comes back in weeks or more.\n\n🧠 The system adapts to you — the better you know a card, the longer before you see it again.\n\n↺ Reset: Clears all progress (asks for confirmation first).',
      'fc.reset_all':'Reset All Cards','fc.reset_hard':'Hard Only',
      'fc.practice':'🔁 Free Review','fc.practice_badge':'Practice Mode — does not affect your progress',
      'fc.practice_done':'Practice session complete','fc.practice_next':'Next',
      'quiz.title':'Self Quiz','quiz.hint':'💡 Hint','quiz.score':'Score',
      'quiz.next':'Next','quiz.retry':'Retry Quiz',
      'vault.title':'🔐 Exam Vault','prof.title':'🎓 Professor\'s Narrative',
      'ask.title':'❓ Ask The Professor','obj.title':'🎯 Learning Objectives',
      'toc.title':'Module Contents',
      'notes.btn':'My Notes'
    }
  };

  /* ═══ CONFIRMATION MODAL ═══ */
  function showModal({ icon, title, message, confirmText, cancelText, onConfirm, danger }) {
    // Remove any existing modal
    document.querySelector('.garden-modal-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'garden-modal-overlay';
    overlay.innerHTML = `
      <div class="garden-modal">
        <div class="garden-modal-icon">${icon || '⚠️'}</div>
        <div class="garden-modal-title">${title || ''}</div>
        <div class="garden-modal-message">${message || ''}</div>
        <div class="garden-modal-actions">
          <button class="garden-modal-btn garden-modal-btn--cancel" id="modal-cancel">${cancelText || (currentLang === 'ar' ? 'إلغاء' : 'Cancel')}</button>
          <button class="garden-modal-btn ${danger ? 'garden-modal-btn--danger' : ''}" id="modal-confirm">${confirmText || (currentLang === 'ar' ? 'تأكيد' : 'Confirm')}</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    // Close on Escape
    const escHandler = (e) => {
      if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', escHandler); }
    };
    document.addEventListener('keydown', escHandler);

    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#modal-confirm').addEventListener('click', () => {
      overlay.remove();
      if (onConfirm) onConfirm();
    });
  }

  /* ═══ THEME ═══ */
  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('garden_theme', theme);
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = THEME_ICONS[theme] || '🌙';
  }
  function cycleTheme() {
    applyTheme(THEMES[(THEMES.indexOf(currentTheme) + 1) % THEMES.length]);
    if (document.querySelector('.mermaid')) location.reload();
  }

  /* ═══ LANGUAGE ═══ */
  function setLanguage(lang) {
    currentLang = lang;
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    localStorage.setItem('garden_lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang]?.[key]) el.textContent = i18n[lang][key];
    });
    document.querySelectorAll('[data-bilingual]').forEach(container => {
      const tpl = container.querySelector(`.content-${lang}`);
      const target = container.querySelector('.content-target');
      if (tpl && target) target.innerHTML = tpl.innerHTML;
    });
    document.querySelectorAll('.smart-term').forEach(term => {
      const tip = term.querySelector('.smart-term-tooltip');
      if (!tip) return;
      const enDef = term.getAttribute('data-en-def') || '';
      const termEn = term.getAttribute('data-term-en') || '';
      tip.textContent = lang === 'ar' ? `${termEn}: ${enDef}` : enDef;
    });
    const ll = document.getElementById('lang-label');
    if (ll) ll.textContent = lang === 'ar' ? 'EN' : 'AR';

    if (window._gardenFC.cards) { const wasFlipped = document.getElementById('fc-card')?.classList.contains('flipped'); renderFlashcard(); if (wasFlipped) flipCard(); }
    if (window._gardenQuiz.questions) renderQuestion();
    if (typeof window._algoRefresh === 'function') window._algoRefresh();
	
    // تحديث المعادلات الرياضية بعد تغيير اللغة أو تحميل الصفحة
    if (window.MathJax && typeof MathJax.typesetPromise === 'function') {
      MathJax.typesetPromise().catch((err) => console.log('MathJax Error:', err));
    }
  }
  function toggleLanguage() { setLanguage(currentLang === 'ar' ? 'en' : 'ar'); }

  /* ═══ DEPTH LAYERS ═══ */
  function initDepthTabs() {
    document.querySelectorAll('.depth-tabs').forEach(tg => {
      const card = tg.closest('.concept-card'); if (!card) return;
      const tabs = tg.querySelectorAll('.depth-tab');
      const layers = card.querySelectorAll('.depth-layer');
      tabs.forEach(tab => tab.addEventListener('click', () => {
        const t = tab.getAttribute('data-layer');
        tabs.forEach(x => x.classList.remove('active'));
        layers.forEach(x => x.classList.remove('active'));
        tab.classList.add('active');
        card.querySelector(`.depth-layer[data-layer="${t}"]`)?.classList.add('active');
      }));
    });
  }

  /* ═══ ACCORDION ═══ */
  function initAccordion() {
    document.querySelectorAll('.accordion-trigger').forEach(tr => {
      tr.addEventListener('click', () => {
        const item = tr.closest('.accordion-item');
        const was = item.classList.contains('open');
        item.closest('.accordion')?.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
        if (!was) item.classList.add('open');
      });
    });
  }

  /* ═══════════════════════════════════════════════════════════
     SM-2 FLASHCARD ENGINE v3.0
     
     Key behavior:
     - Grade 0 or 2 → card goes to END of queue (will see it again this session)
     - Grade 3 or 5 → card is DONE for this session (SM-2 schedules future review)
     - Counter: "reviewed / totalOriginal" — ascending, total never changes
     - Reset: clears SM-2 state, reloads all cards
     ═══════════════════════════════════════════════════════════ */
  window._gardenFC = {};

  function fcKey() {
    const s = document.documentElement.getAttribute('data-subject') || 'XX';
    const m = document.documentElement.getAttribute('data-module') || '0';
    return `garden_${s}_m${m}_fc`;
  }
  function sm2Calc(card, grade) {
    let { n, ef, interval } = card;
    if (grade >= 3) {
      interval = n === 0 ? 1 : n === 1 ? 6 : Math.round(interval * ef);
      n++;
    } else { n = 0; interval = 1; }
    ef = Math.max(1.3, ef + 0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    return { n, ef, interval, nextReview: Date.now() + interval * 86400000, lastGrade: grade };
  }
  function newCard() { return { n: 0, ef: 2.5, interval: 0, nextReview: Date.now() }; }
  function loadSM2() { try { return JSON.parse(localStorage.getItem(fcKey())) || {}; } catch(e) { return {}; } }
  function saveSM2(st) {
    try { localStorage.setItem(fcKey(), JSON.stringify(st)); }
    catch(e) { if (e.name==='QuotaExceededError') { Object.keys(localStorage).filter(k=>k.startsWith('garden_')&&k.endsWith('_fc')).sort().slice(0,1).forEach(k=>localStorage.removeItem(k)); try{localStorage.setItem(fcKey(),JSON.stringify(st))}catch(e2){} } }
  }

  function initFlashcards() {
    const el = document.getElementById('flashcard-data');
    if (!el) return;
    try { window._gardenFC.cards = JSON.parse(el.textContent); } catch(e) { return; }
    window._gardenFC.sm2 = loadSM2();
    buildQueue();
    renderFlashcard();
    updateDueCount();
  }

  function buildQueue() {
    const fc = window._gardenFC;
    const now = Date.now();
    fc.queue = fc.cards
      .map((card, i) => ({ card, i, state: fc.sm2[i] || newCard() }))
      .filter(({ state }) => state.nextReview <= now);
    fc.pos = 0;
    fc.totalOriginal = fc.queue.length; // FIXED total for this session
    fc.completed = 0;

  }

  function renderFlashcard() {
    const fc = window._gardenFC;
    const box = document.getElementById('fc-container');
    if (!box) return;
    const L = currentLang;

    // No cards left in queue
    if (!fc.queue || fc.queue.length === 0 || fc.pos >= fc.queue.length) {
      const fcInfoText = (i18n[L]?.['fc.info']||'').split('\n').join('<br>');
      box.innerHTML = `
        <div class="fc-toolbar">
          <div class="flashcard-counter" style="visibility:hidden">—</div>
          <div class="fc-toolbar-actions">
            <button class="fc-mini-btn" onclick="Garden.resetFC('all')" title="${i18n[L]?.['fc.reset']||'Reset'}">↺</button>
            <button class="fc-report-btn" onclick="Garden.report()" title="${L==='ar'?'تقرير SM-2':'SM-2 Report'}">R</button>
            <span class="fc-info-btn" tabindex="0">ⓘ<span class="fc-info-tooltip">${fcInfoText}</span></span>
          </div>
        </div>
        <div class="fc-empty">
          <div class="fc-empty-icon">🎉</div>
          <p>${i18n[L]?.['fc.none_due']||''}</p>
          <div class="fc-actions">
            <button class="fc-reset-btn fc-practice-btn" onclick="Garden.practice()">${i18n[L]?.['fc.practice']||''}</button>
            <button class="fc-reset-btn" onclick="Garden.resetFC('all')">${i18n[L]?.['fc.reset_all']||''}</button>
            <button class="fc-reset-btn" onclick="Garden.resetFC('hard')">${i18n[L]?.['fc.reset_hard']||''}</button>
          </div>
        </div>`;
      return;
    }

    const item = fc.queue[fc.pos];
    const card = item.card;
    const num = fc.completed + 1;
    const total = fc.totalOriginal;

    box.innerHTML = `
      <div class="fc-toolbar">
        <div class="flashcard-counter">${num} / ${total}</div>
        <div class="fc-toolbar-actions">
          <button class="fc-mini-btn" onclick="Garden.resetFC('all')" title="${i18n[L]?.['fc.reset']||'Reset'}">↺</button>
          <button class="fc-report-btn" onclick="Garden.report()" title="${L==='ar'?'تقرير SM-2':'SM-2 Report'}">R</button>
          <span class="fc-info-btn" tabindex="0">ⓘ<span class="fc-info-tooltip">${(i18n[L]?.['fc.info']||'').replace(/\n/g,'<br>')}</span></span>
        </div>
      </div>
      <div class="flashcard-scene">
        <div class="flashcard-card" id="fc-card" onclick="Garden.flip()">
          <div class="flashcard-face flashcard-front">
            <div class="fc-term" data-bilingual>
              <template class="content-ar">${card.front?.ar||''}</template>
              <template class="content-en">${card.front?.en||''}</template>
              <div class="content-target">${card.front?.[L]||''}</div>
            </div>
            <div class="flashcard-hint">${i18n[L]?.['fc.flip']||''}</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="fc-definition" data-bilingual>
              <template class="content-ar">${card.back?.definition?.ar||''}</template>
              <template class="content-en">${card.back?.definition?.en||''}</template>
              <div class="content-target">${card.back?.definition?.[L]||''}</div>
            </div>
            ${card.back?.example?`<div class="fc-example" data-bilingual>
              <template class="content-ar">${card.back.example.ar||''}</template>
              <template class="content-en">${card.back.example.en||''}</template>
              <div class="content-target">${card.back.example[L]||''}</div>
            </div>`:''}
          </div>
        </div>
      </div>
      <div class="sm2-grades hidden" id="fc-grades">
        <button class="sm2-btn sm2-btn--0" onclick="Garden.grade(0)">${i18n[L]?.['fc.grade.0']||'0'}</button>
        <button class="sm2-btn sm2-btn--2" onclick="Garden.grade(2)">${i18n[L]?.['fc.grade.2']||'2'}</button>
        <button class="sm2-btn sm2-btn--3" onclick="Garden.grade(3)">${i18n[L]?.['fc.grade.3']||'3'}</button>
        <button class="sm2-btn sm2-btn--5" onclick="Garden.grade(5)">${i18n[L]?.['fc.grade.5']||'5'}</button>
      </div>`;
  }

  function flipCard() {
    const c = document.getElementById('fc-card');
    const g = document.getElementById('fc-grades');
    if (c) c.classList.toggle('flipped');
    if (g) g.classList.toggle('hidden', !c?.classList.contains('flipped'));
  }

  /* ── PRACTICE MODE (read-only, no SM-2 state change) ── */
  function startPractice() {
    const fc = window._gardenFC;
    if (!fc.cards || fc.cards.length === 0) return;
    // Build practice queue: all cards, shuffled
    fc.practiceMode = true;
    fc.practiceQueue = fc.cards
      .map((card, i) => ({ card, i }))
      .sort(() => Math.random() - 0.5);
    fc.practicePos = 0;
    renderPractice();
  }

  function renderPractice() {
    const fc = window._gardenFC;
    const box = document.getElementById('fc-container');
    if (!box) return;
    const L = currentLang;
    const q = fc.practiceQueue;
    const pos = fc.practicePos;

    if (!q || pos >= q.length) {
      fc.practiceMode = false;
      box.innerHTML = `
        <div class="fc-empty">
          <div class="fc-empty-icon">✅</div>
          <p>${i18n[L]?.['fc.practice_done']||''}</p>
          <div class="fc-actions">
            <button class="fc-reset-btn fc-practice-btn" onclick="Garden.practice()">${i18n[L]?.['fc.practice']||''}</button>
            <button class="fc-reset-btn" onclick="Garden.resetFC('all')">${i18n[L]?.['fc.reset_all']||''}</button>
          </div>
        </div>`;
      return;
    }

    const item = q[pos];
    const card = item.card;
    const num  = pos + 1;
    const total = q.length;

    box.innerHTML = `
      <div class="fc-practice-badge">${i18n[L]?.['fc.practice_badge']||''}</div>
      <div class="fc-toolbar">
        <div class="flashcard-counter">${num} / ${total}</div>
        <div class="fc-toolbar-actions">
          <button class="fc-mini-btn" onclick="window._gardenFC.practiceMode=false;Garden.renderFC()" title="${L==='ar'?'إنهاء المراجعة الحرة':'Exit Practice'}">✕</button>
          <button class="fc-report-btn" onclick="Garden.report()" title="${L==='ar'?'تقرير SM-2':'SM-2 Report'}">R</button>
        </div>
      </div>
      <div class="flashcard-scene">
        <div class="flashcard-card" id="fc-card" onclick="this.classList.toggle('flipped');document.getElementById('fc-pnext')?.classList.toggle('hidden',!this.classList.contains('flipped'))">
          <div class="flashcard-face flashcard-front">
            <div class="fc-term" data-bilingual>
              <template class="content-ar">${card.front?.ar||''}</template>
              <template class="content-en">${card.front?.en||''}</template>
              <div class="content-target">${card.front?.[L]||''}</div>
            </div>
            <div class="flashcard-hint">${i18n[L]?.['fc.flip']||''}</div>
          </div>
          <div class="flashcard-face flashcard-back">
            <div class="fc-definition" data-bilingual>
              <template class="content-ar">${card.back?.definition?.ar||''}</template>
              <template class="content-en">${card.back?.definition?.en||''}</template>
              <div class="content-target">${card.back?.definition?.[L]||''}</div>
            </div>
            ${card.back?.example?`<div class="fc-example" data-bilingual>
              <template class="content-ar">${card.back.example.ar||''}</template>
              <template class="content-en">${card.back.example.en||''}</template>
              <div class="content-target">${card.back.example[L]||''}</div>
            </div>`:''}
          </div>
        </div>
      </div>
      <div class="sm2-grades hidden" id="fc-pnext">
        <button class="sm2-btn" style="background:var(--brand-500);min-width:160px" onclick="window._gardenFC.practicePos++;Garden.renderPractice()">${i18n[L]?.['fc.practice_next']||'Next'} →</button>
      </div>`;
  }

  function gradeCard(grade) {
    const fc = window._gardenFC;
    if (!fc.queue || fc.pos >= fc.queue.length) return;
    const item = fc.queue[fc.pos];

    if (grade >= 3) {
      // PASSED — save SM-2 state, remove from queue permanently, count once
      fc.sm2[item.i] = sm2Calc(item.state, grade);
      saveSM2(fc.sm2);
      fc.queue.splice(fc.pos, 1);
      fc.completed++; // card leaves queue → count exactly once
      // Record final grade — card exits queue permanently
    } else {
      // FAILED (0 or 2) — update SM-2 state, keep nextReview=now so it stays due
      const updated = sm2Calc(item.state, grade);
      updated.nextReview = Date.now();
      fc.sm2[item.i] = updated;
      item.state = updated;
      saveSM2(fc.sm2);
      // Track retry count per card — hard limit prevents infinite loops
      item.retryCount = (item.retryCount || 0) + 1;
      if (item.retryCount < 3) {
        // Re-queue to end — do NOT record grade yet (card still active)
        const removed = fc.queue.splice(fc.pos, 1)[0];
        fc.queue.push(removed);
      } else {
        // Max retries reached — remove card, record final grade (last attempt)
        fc.queue.splice(fc.pos, 1);
        fc.completed++;
      }
    }

    if (fc.pos >= fc.queue.length) fc.pos = 0;
    renderFlashcard();
    updateDueCount();
  }

  function resetFC(mode) {
    const L = currentLang;
    const isAll = mode === 'all';

    const modalConfig = isAll ? {
      icon: '🔄',
      title: L === 'ar' ? 'إعادة ضبط جميع البطاقات؟' : 'Reset All Cards?',
      message: L === 'ar'
        ? 'سيتم مسح كل تقدمك في البطاقات التعليمية لهذه الوحدة وإعادة جميع البطاقات من الصفر. هذا الإجراء لا يمكن التراجع عنه.'
        : 'This will erase all your flashcard progress for this module and bring back every card from scratch. This action cannot be undone.',
      confirmText: L === 'ar' ? 'نعم، إعادة الضبط' : 'Yes, Reset All',
      danger: true
    } : {
      icon: '🔁',
      title: L === 'ar' ? 'إعادة البطاقات الصعبة فقط؟' : 'Reset Hard Cards Only?',
      message: L === 'ar'
        ? 'سيتم إعادة البطاقات التي كانت صعبة عليك (معامل السهولة أقل من 2.0) فقط. البطاقات التي أتقنتها ستبقى كما هي.'
        : 'Only cards you found difficult (ease factor below 2.0) will be reset. Cards you\'ve mastered will remain unchanged.',
      confirmText: L === 'ar' ? 'نعم، إعادة الصعبة' : 'Yes, Reset Hard',
      danger: false
    };

    showModal({
      ...modalConfig,
      onConfirm: () => {
        const fc = window._gardenFC;
        if (isAll) {
          fc.sm2 = {};
        } else {
          Object.keys(fc.sm2).forEach(k => {
            if (fc.sm2[k].ef < 2.0) fc.sm2[k] = newCard();
          });
        }
        saveSM2(fc.sm2);
        buildQueue();
        renderFlashcard();
        updateDueCount();
      }
    });
  }

  function updateDueCount() {
    const fc = window._gardenFC;
    const el = document.getElementById('fc-due-count');
    // Show unique remaining cards (not duplicates from re-queued retries)
    if (el && fc.queue) {
      const uniqueLeft = new Set(fc.queue.map(it => it.i)).size;
      el.textContent = uniqueLeft;
    } else if (el) { el.textContent = 0; }

    // Pulse widget if cards are due
    const widget = document.querySelector('.sidebar-widget');
    if (widget && fc.queue?.length > 0) widget.classList.add('has-due');

    // Update dashboard stats if open
    updateSM2Dashboard();
  }

  /* ═══ SM-2 DASHBOARD (enhanced sidebar widget) ═══ */
  function initSM2Dashboard() {
    const widget = document.querySelector('.sidebar-widget');
    if (!widget) return;

    // Transform the existing widget into expandable dashboard
    const dueNum = widget.querySelector('.widget-number');
    const dueLabel = widget.querySelector('.widget-label');
    if (!dueNum || !dueLabel) return;

    const currentNum = dueNum.textContent;
    const currentLabel = dueLabel.textContent;

    widget.innerHTML = `
      <button class="sm2-widget-toggle" id="sm2-toggle" aria-expanded="false">
        <div>
          <div class="widget-number" id="fc-due-count">${currentNum}</div>
          <div class="widget-label" data-i18n="fc.due">${currentLabel}</div>
        </div>
        <span class="widget-chevron">▼</span>
      </button>
      <div class="sm2-dashboard" id="sm2-dashboard">
        <div class="sm2-dash-row">
          <span class="sm2-dash-label" id="sm2-last-label">📅</span>
          <span class="sm2-dash-value" id="sm2-last-review">—</span>
        </div>
        <div class="sm2-dash-row">
          <span class="sm2-dash-label" id="sm2-next-label">⏭️</span>
          <span class="sm2-dash-value" id="sm2-next-review">—</span>
        </div>
        <div class="sm2-dash-row">
          <span class="sm2-dash-label" id="sm2-total-label">📊</span>
          <span class="sm2-dash-value" id="sm2-total-cards">—</span>
        </div>
        <div class="sm2-dash-bar" id="sm2-bar">
          <span class="sm2-bar-new" style="width:100%"></span>
          <span class="sm2-bar-learning" style="width:0%"></span>
          <span class="sm2-bar-mastered" style="width:0%"></span>
        </div>
        <div class="sm2-dash-legend">
          <span class="sm2-legend-new" id="sm2-leg-new"></span>
          <span class="sm2-legend-learning" id="sm2-leg-learning"></span>
          <span class="sm2-legend-mastered" id="sm2-leg-mastered"></span>
        </div>
      </div>`;

		// Toggle expand/collapse — Popover mode
		const toggle = document.getElementById('sm2-toggle');
		const dash   = document.getElementById('sm2-dashboard');

		// أنشئ الـ overlay مرة واحدة
		let overlay = document.getElementById('sm2-overlay');
		if (!overlay) {
		  overlay = document.createElement('div');
		  overlay.className = 'sm2-overlay';
		  overlay.id = 'sm2-overlay';
		  document.body.appendChild(overlay);
		}

		function openSM2() {
			const rect = widget.getBoundingClientRect();
			const bottomFromViewport = window.innerHeight - rect.top + 8;
			dash.style.bottom = bottomFromViewport + 'px';
			const popoverWidth = 260;
			const widgetCenter = rect.left + rect.width / 2;
			const idealLeft = widgetCenter - popoverWidth / 2;
			// تأكد إنه ما يخرج من الشاشة
			const clampedLeft = Math.max(8, Math.min(idealLeft, window.innerWidth - popoverWidth - 8));
			dash.style.left  = clampedLeft + 'px';
			dash.style.right = 'auto';		
			dash.classList.add('open');
			overlay.classList.add('open');
			toggle.setAttribute('aria-expanded', 'true');
			updateSM2Dashboard();
		}

		function closeSM2() {
		  dash.classList.remove('open');
		  overlay.classList.remove('open');
		  toggle.setAttribute('aria-expanded', 'false');
		}

		toggle.addEventListener('click', () => {
		  dash.classList.contains('open') ? closeSM2() : openSM2();
		});

		overlay.addEventListener('click', closeSM2);											

    updateSM2Dashboard();
  }

  function updateSM2Dashboard() {
    const fc = window._gardenFC;
    if (!fc.cards || !fc.sm2) return;
    const dash = document.getElementById('sm2-dashboard');
    if (!dash) return;

    const L = currentLang;
    const now = Date.now();
    const total = fc.cards.length;

    // Categorize cards
    let newCount = 0, learningCount = 0, masteredCount = 0;
    let lastReviewTime = 0, nextReviewTime = Infinity;

    for (let i = 0; i < total; i++) {
      const st = fc.sm2[i];
      if (!st) { newCount++; continue; }

      // Track last review (nextReview minus interval gives approximate last review)
      const reviewedAt = st.nextReview - (st.interval * 86400000);
      if (reviewedAt > lastReviewTime && st.n > 0) lastReviewTime = reviewedAt;

      // Track next review
      if (st.nextReview > now && st.nextReview < nextReviewTime) nextReviewTime = st.nextReview;

      // Consistent mastery: interval >= 21 days (Anki standard)
      if (st.interval >= 21) masteredCount++;
      else learningCount++;
    }

    // Labels
    const labels = {
      ar: { last: '📅 آخر مراجعة', next: '⏭️ القادمة', total: '📊 الإجمالي',
            newL: 'جديدة', learning: 'قيد التعلم', mastered: 'متقنة',
            never: 'لم تبدأ بعد', today: 'اليوم', tomorrow: 'غداً',
            daysAgo: 'يوم', daysLater: 'يوم', allDone: 'أنجزت الكل!' },
      en: { last: '📅 Last review', next: '⏭️ Next due', total: '📊 Total',
            newL: 'New', learning: 'Learning', mastered: 'Mastered',
            never: 'Not started', today: 'Today', tomorrow: 'Tomorrow',
            daysAgo: 'days ago', daysLater: 'days', allDone: 'All done!' }
    };
    const t = labels[L] || labels.ar;

    // Format relative time
    function relTime(ts, isFuture) {
      if (!ts || ts === Infinity || ts === 0) return isFuture ? t.allDone : t.never;
      const diff = Math.abs(ts - now);
      const days = Math.round(diff / 86400000);
      if (days === 0) return t.today;
      if (days === 1) return t.tomorrow;
      return isFuture ? `${days} ${t.daysLater}` : `${days} ${t.daysAgo}`;
    }

    // Update elements
    const $l = id => document.getElementById(id);
    const setT = (id, v) => { const e = $l(id); if(e) e.textContent = v; };

    setT('sm2-last-label', t.last);
    setT('sm2-next-label', t.next);
    setT('sm2-total-label', t.total);
    setT('sm2-last-review', relTime(lastReviewTime, false));
    setT('sm2-next-review', relTime(nextReviewTime, true));
    setT('sm2-total-cards', `${total}`);
    setT('sm2-leg-new', `${newCount} ${t.newL}`);
    setT('sm2-leg-learning', `${learningCount} ${t.learning}`);
    setT('sm2-leg-mastered', `${masteredCount} ${t.mastered}`);

    // Update bar
    const bar = $l('sm2-bar');
    if (bar && total > 0) {
      const spans = bar.querySelectorAll('span');
      spans[0].style.width = `${(newCount/total)*100}%`;
      spans[1].style.width = `${(learningCount/total)*100}%`;
      spans[2].style.width = `${(masteredCount/total)*100}%`;
    }
  }

  /* ═══ SM-2 REPORT MODAL ═══ */
  function showSM2Report() {
    const fc = window._gardenFC;
    const L = currentLang;
    const isAr = L === 'ar';
    document.querySelector('.sm2-report-overlay')?.remove();

    const now = Date.now();
    const today = new Date(); today.setHours(0,0,0,0);
    const total = fc.cards?.length || 0;

    // ── Categorise all cards & build forecast ──
    let newCount = 0, learningCount = 0, masteredCount = 0;
    let totalEF = 0, efCount = 0;
    const forecast = {};

    // SM-2 mastery standard: interval >= 21 days (Anki "mature" definition)
    // This avoids the broken n>=3&&ef>=2.0 criterion which fails for grade=3 users
    let needsReviews1 = 0, needsReviews2 = 0, needsReviews3plus = 0;
    let nextDueTs = Infinity;
    for (let i = 0; i < total; i++) {
      const st = fc.sm2?.[i];
      if (!st || st.n === 0) {
        newCount++;
        forecast[0] = (forecast[0] || 0) + 1;
        needsReviews3plus++;
      } else {
        const dueDate = new Date(st.nextReview); dueDate.setHours(0,0,0,0);
        const diff = Math.round((dueDate - today) / 86400000);
        const key = Math.max(0, diff);
        if (key <= 30) forecast[key] = (forecast[key] || 0) + 1;
        if (st.nextReview > now && st.nextReview < nextDueTs) nextDueTs = st.nextReview;
        if (st.interval >= 21) {
          masteredCount++;
        } else {
          learningCount++;
          // How many more successful reviews until interval hits 21+?
          // n=0,1 → need 3+ (rep1→1d, rep2→6d, rep3→13d, rep4→27d≥21)
          // n=2   → need 2 more  (rep3→13d, rep4→27d≥21)
          // n=3+  → need 1 more  (next review crosses 21d)
          const repsNeeded = (st.n <= 1) ? 3 : st.n === 2 ? 2 : 1;
          if (repsNeeded === 1) needsReviews1++;
          else if (repsNeeded === 2) needsReviews2++;
          else needsReviews3plus++;
        }
        totalEF += st.ef; efCount++;
      }
    }
    const nextDueDate = nextDueTs < Infinity ? new Date(nextDueTs) : null;
    const avgEF = efCount > 0 ? (totalEF / efCount).toFixed(2) : '—';

    // ── Session stats ──
    const sessionTotal = fc.totalOriginal || 0;
    const sessionDone  = fc.completed || 0;
    const sessionLeft  = fc.queue ? new Set(fc.queue.map(it => it.i)).size : 0;
    // Derive grade distribution from sm2 lastGrade — one value per card, always accurate
    const gs = {0:0, 2:0, 3:0, 5:0};
    for (let i = 0; i < total; i++) {
      const st = fc.sm2?.[i];
      if (st && st.lastGrade !== undefined) gs[st.lastGrade] = (gs[st.lastGrade] || 0) + 1;
    }
    const gsTot = (gs[0]||0)+(gs[2]||0)+(gs[3]||0)+(gs[5]||0);

    // ── Forecast rows (next 14 days, skip empty days after day 7) ──
    const allKeys = Object.keys(forecast).map(Number).sort((a,b)=>a-b);
    const maxVal  = allKeys.length ? Math.max(...allKeys.map(k => forecast[k])) : 1;
    const forecastHTML = allKeys.filter(d => d <= 14 || forecast[d] > 0).map(d => {
      const count = forecast[d];
      const pct   = Math.round((count / maxVal) * 100);
      const label = d === 0 ? (isAr ? 'اليوم' : 'Today')
                  : d === 1 ? (isAr ? 'غداً'  : 'Tomorrow')
                  : isAr ? `بعد ${d} أيام` : `In ${d} days`;
      return `<div class="sm2-rfc-row">
        <span class="sm2-rfc-label">${label}</span>
        <div class="sm2-rfc-track"><div class="sm2-rfc-bar${d===0?' sm2-rfc-today':''}" style="width:${Math.max(pct,3)}%"></div></div>
        <span class="sm2-rfc-num${count===0?' sm2-rfc-zero':''}">${count}</span>
      </div>`;
    }).join('') || `<p class="sm2-report-empty">${isAr?'لا توجد بطاقات مجدولة بعد':'No cards scheduled yet'}</p>`;

    const overlay = document.createElement('div');
    overlay.className = 'sm2-report-overlay';
    overlay.innerHTML = `
      <div class="sm2-report-modal" dir="${isAr?'rtl':'ltr'}">
        <div class="sm2-report-header">
          <span class="sm2-report-header-icon">📊</span>
          <h3 class="sm2-report-title">${isAr?'تقرير البطاقات التعليمية':'Flashcard SM-2 Report'}</h3>
          <button class="sm2-report-close" id="sm2-report-close">✕</button>
        </div>
        <div class="sm2-report-body">

          ${sessionTotal > 0 ? `
          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span>⚡</span>${isAr?'جلسة اليوم':"Today's Session"}</div>
            <div class="sm2-rpills">
              <div class="sm2-rpill sm2-rpill--blue"><span class="sm2-rpill-n">${sessionTotal}</span><span class="sm2-rpill-l">${isAr?'إجمالي':'Total'}</span></div>
              <div class="sm2-rpill sm2-rpill--green"><span class="sm2-rpill-n">${sessionDone}</span><span class="sm2-rpill-l">${isAr?'أُنجز':'Done'}</span></div>
              <div class="sm2-rpill sm2-rpill--orange"><span class="sm2-rpill-n">${sessionLeft}</span><span class="sm2-rpill-l">${isAr?'متبقي':'Left'}</span></div>
            </div>
          </div>` : ''}

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span>🗂️</span>${isAr?'حالة البطاقات':'Card Status'}<span class="sm2-rtotal-badge">${total} ${isAr?'بطاقة':'cards'}</span></div>
            <div class="sm2-rstat-bar">
              <div class="sm2-rsb-new"      style="width:${total?((newCount/total)*100).toFixed(1):0}%"></div>
              <div class="sm2-rsb-learning" style="width:${total?((learningCount/total)*100).toFixed(1):0}%"></div>
              <div class="sm2-rsb-mastered" style="width:${total?((masteredCount/total)*100).toFixed(1):0}%"></div>
            </div>
            <div class="sm2-rstat-legend">
              <div class="sm2-rsl"><span class="sm2-rsl-dot sm2-rsl-new"></span><span>${isAr?'جديدة':'New'}</span><strong>${newCount}</strong></div>
              <div class="sm2-rsl"><span class="sm2-rsl-dot sm2-rsl-learning"></span><span>${isAr?'قيد التعلم':'Learning'}</span><strong>${learningCount}</strong></div>
              <div class="sm2-rsl"><span class="sm2-rsl-dot sm2-rsl-mastered"></span><span>${isAr?'متقنة':'Mastered'}</span><strong>${masteredCount}</strong></div>
            </div>
            ${efCount > 0 ? `<div class="sm2-ref-row"><span>${isAr?'متوسط معامل السهولة (EF):':'Avg. Ease Factor (EF):'}</span><strong>${avgEF}</strong></div>` : ''}
          </div>

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span>🎯</span>${isAr?'مسار الإتقان':'Path to Mastery'}</div>
            <div class="sm2-rmastery-note">${isAr?'البطاقة تُعتبر متقنة عند وصول الفاصل الزمني إلى <strong>21 يوماً أو أكثر</strong> (معيار Anki العالمي). يستلزم ذلك <strong>3 مراجعات ناجحة متتالية</strong> كحد أدنى.':'A card is considered <strong>mastered</strong> when its interval reaches <strong>21+ days</strong> (Anki global standard). This requires a minimum of <strong>3 consecutive successful reviews</strong>.'}</div>
            <div class="sm2-rmastery-path">
              <div class="sm2-rmp-step sm2-rmp-s1"><span class="sm2-rmp-day">${isAr?'اليوم':'Today'}</span><span class="sm2-rmp-icon">📖</span><span class="sm2-rmp-label">${isAr?'مراجعة ١':'Review 1'}</span></div>
              <div class="sm2-rmp-arrow">→</div>
              <div class="sm2-rmp-step sm2-rmp-s2"><span class="sm2-rmp-day">${isAr?'+1 يوم':'+1 day'}</span><span class="sm2-rmp-icon">📖</span><span class="sm2-rmp-label">${isAr?'مراجعة ٢':'Review 2'}</span></div>
              <div class="sm2-rmp-arrow">→</div>
              <div class="sm2-rmp-step sm2-rmp-s3"><span class="sm2-rmp-day">${isAr?'+6 أيام':'+6 days'}</span><span class="sm2-rmp-icon">📖</span><span class="sm2-rmp-label">${isAr?'مراجعة ٣':'Review 3'}</span></div>
              <div class="sm2-rmp-arrow">→</div>
              <div class="sm2-rmp-step sm2-rmp-s4"><span class="sm2-rmp-day">${isAr?'+21 يوماً':'+21 days'}</span><span class="sm2-rmp-icon">🏆</span><span class="sm2-rmp-label">${isAr?'متقنة!':'Mastered!'}</span></div>
            </div>
            ${(learningCount > 0) ? `<div class="sm2-rmastery-breakdown">
              ${needsReviews1 > 0 ? `<div class="sm2-rmb-row"><span class="sm2-rmb-dot" style="background:#10b981"></span><span>${isAr?`${needsReviews1} بطاقة — مراجعة واحدة بعيدة عن الإتقان`:`${needsReviews1} card${needsReviews1>1?'s':''} — 1 more review to mastery`}</span></div>` : ''}
              ${needsReviews2 > 0 ? `<div class="sm2-rmb-row"><span class="sm2-rmb-dot" style="background:#f59e0b"></span><span>${isAr?`${needsReviews2} بطاقة — مراجعتان متبقيتان`:`${needsReviews2} card${needsReviews2>1?'s':''} — 2 more reviews to mastery`}</span></div>` : ''}
              ${needsReviews3plus > 0 ? `<div class="sm2-rmb-row"><span class="sm2-rmb-dot" style="background:#6b7280"></span><span>${isAr?`${needsReviews3plus} بطاقة — 3 مراجعات أو أكثر متبقية`:`${needsReviews3plus} card${needsReviews3plus>1?'s':''} — 3+ more reviews to mastery`}</span></div>` : ''}
            </div>` : ''}
            ${gsTot > 0 ? `<div class="sm2-rgrade-stats">
              <div class="sm2-rgs-label">${isAr?'احصائياتك:':'Your stats:'}</div>
              <div class="sm2-rgs-pills">
                <span class="sm2-rgs-pill sm2-rgs-pill-0"><span class="sm2-rgs-dot"></span>${isAr?'لم أتذكر':'Blackout'}<strong>${gs[0]||0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-2"><span class="sm2-rgs-dot"></span>${isAr?'صعب':'Hard'}<strong>${gs[2]||0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-3"><span class="sm2-rgs-dot"></span>${isAr?'جيد':'Good'}<strong>${gs[3]||0}</strong></span>
                <span class="sm2-rgs-pill sm2-rgs-pill-5"><span class="sm2-rgs-dot"></span>${isAr?'سهل':'Easy'}<strong>${gs[5]||0}</strong></span>
              </div>
            </div>` : ''}
          </div>

          ${nextDueDate ? `<div class="sm2-report-section">
            <div class="sm2-rsec-title"><span>🔔</span>${isAr?'الزيارة القادمة المقررة':'Your Next Scheduled Visit'}</div>
            <div class="sm2-rnext-date">
              <div class="sm2-rnd-big">${nextDueDate.toLocaleDateString(isAr?'ar-SA':'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
              <div class="sm2-rnd-sub">${(() => {
                const diff = Math.round((nextDueDate - today) / 86400000);
                if (diff <= 0) return isAr ? 'البطاقات متاحة الآن' : 'Cards available now';
                if (diff === 1) return isAr ? 'غداً' : 'Tomorrow';
                return isAr ? `بعد ${diff} أيام` : `In ${diff} days`;
              })()}</div>
            </div>
          </div>` : ''}

          <div class="sm2-report-section">
            <div class="sm2-rsec-title"><span>📅</span>${isAr?'جدول المراجعات القادمة':'Upcoming Review Schedule'}</div>
            <div class="sm2-rfc-list">${forecastHTML}</div>
          </div>

          <div class="sm2-report-section sm2-report-howto">
            <div class="sm2-rsec-title"><span>🧠</span>${isAr?'كيف يعمل نظام SM-2؟':'How does SM-2 work?'}</div>
            <div class="sm2-rhow-grid">
              <div class="sm2-rhow-item sm2-rhow-0"><span class="sm2-rhow-g">0</span><div><strong>${isAr?'لم أتذكر':'Blackout'}</strong><p>${isAr?'تُعاد لنهاية الجلسة (حتى ٣ محاولات)':'Re-queued to end (up to 3 tries)'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-2"><span class="sm2-rhow-g">2</span><div><strong>${isAr?'صعب':'Hard'}</strong><p>${isAr?'تُعاد، يقل معامل السهولة':'Re-queued, ease factor reduced'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-3"><span class="sm2-rhow-g">3</span><div><strong>${isAr?'جيد':'Good'}</strong><p>${isAr?'تختفي اليوم، تعود بعد أيام':'Done today, returns in days'}</p></div></div>
              <div class="sm2-rhow-item sm2-rhow-5"><span class="sm2-rhow-g">5</span><div><strong>${isAr?'سهل':'Easy'}</strong><p>${isAr?'تختفي، تعود بعد أسابيع أو أكثر':'Done, returns in weeks or more'}</p></div></div>
            </div>
            <div class="sm2-rformula">
              <div class="sm2-rformula-title">${isAr?'معادلة EF (معامل السهولة):':'EF (Ease Factor) formula:'}</div>
              <code class="sm2-rformula-code">EF = EF + 0.1 − (5 − grade) × (0.08 + (5 − grade) × 0.02)</code>
              <div class="sm2-rformula-note">${isAr?'EF لا يقل عن 1.3 — يتكيف مع مستواك تلقائياً':'EF never goes below 1.3 — adapts automatically to your level'}</div>
            </div>
          </div>

        </div>
      </div>`;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const closeReport = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 220); };
    overlay.addEventListener('click', e => { if (e.target === overlay) closeReport(); });
    overlay.querySelector('#sm2-report-close').addEventListener('click', closeReport);
    document.addEventListener('keydown', function escRpt(e) {
      if (e.key === 'Escape') { closeReport(); document.removeEventListener('keydown', escRpt); }
    });
  }

  /* ═══ ACTION LINKS HIGHLIGHTER ═══ */
  function initActionLinks() {
    const selectors = [
      '.toc-link[href="#flashcards"]',
      '.toc-link[href="#quiz"]'
    ];
    selectors.forEach(sel => {
      const link = document.querySelector(sel);
      if (!link) return;
      link.classList.add('toc-link--action');
      // Add icon
      const href = link.getAttribute('href');
      const icon = document.createElement('span');
      icon.className = 'toc-action-icon';
      icon.textContent = href === '#flashcards' ? '🃏' : '🎯';
      link.prepend(icon);
      // Pulse on first visit (check sessionStorage)
      try {
        const key = 'garden_action_pulsed';
        if (!sessionStorage.getItem(key)) {
          link.classList.add('pulse');
          sessionStorage.setItem(key, '1');
        }
      } catch(e) {}
    });
  }

  /* ═══ QUIZ ENGINE (live score) ═══ */
  window._gardenQuiz = {};

  function initQuiz() {
    const el = document.getElementById('quiz-data');
    if (!el) return;
    try { window._gardenQuiz.questions = JSON.parse(el.textContent); } catch(e) { return; }
    window._gardenQuiz.current = 0;
    window._gardenQuiz.score = 0;
    window._gardenQuiz.answered = false;
    liveScore();
    renderQuestion();
  }

  function liveScore() {
    const el = document.getElementById('quiz-score-live');
    if (el) el.textContent = window._gardenQuiz.score;
  }

  function renderQuestion() {
    const q = window._gardenQuiz;
    if (!q.questions) return;
    const total = q.questions.length;
    if (q.current >= total) { showResults(); return; }
    q.answered = false;
    const item = q.questions[q.current];
    const labels = ['A','B','C','D'];
    const L = currentLang;

    const counter = document.getElementById('quiz-counter');
    const prog = document.getElementById('quiz-progress-fill');
    const qText = document.getElementById('quiz-question-text');
    const opts = document.getElementById('quiz-options-container');
    const fb = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');
    const hintBtn = document.getElementById('quiz-hint-btn');

    if (counter) counter.textContent = `${q.current+1} / ${total}`;
    if (prog) prog.style.width = `${(q.current/total)*100}%`;
    if (qText) qText.textContent = item.question?.[L]||'';
    if (fb) { fb.className='quiz-feedback hidden'; fb.textContent=''; }
    if (nextBtn) nextBtn.classList.add('hidden');
    if (hintBtn) { hintBtn.classList.remove('hidden'); hintBtn.onclick=()=>showHint(); }

    if (opts) {
      opts.innerHTML = (item.options?.[L]||[]).map((o,i) =>
        `<button class="mcq-option" onclick="Garden.pick(${i})"><span class="mcq-label">${labels[i]}</span><span>${o}</span></button>`
      ).join('');
    }
  }

  function selectOption(idx) {
    const q = window._gardenQuiz;
    if (q.answered) return;
    q.answered = true;
    const item = q.questions[q.current];
    const btns = document.querySelectorAll('.mcq-option');
    btns.forEach(b => b.disabled = true);
    const ok = idx === item.correctIndex;
    if (ok) { btns[idx]?.classList.add('correct'); q.score++; }
    else { btns[idx]?.classList.add('wrong'); btns[item.correctIndex]?.classList.add('correct'); }
    liveScore();
    const fb = document.getElementById('quiz-feedback');
    if (fb) { fb.textContent = item.explanation?.[currentLang]||''; fb.className = `quiz-feedback ${ok?'quiz-feedback--correct':'quiz-feedback--wrong'}`; }
    document.getElementById('quiz-next-btn')?.classList.remove('hidden');
    document.getElementById('quiz-hint-btn')?.classList.add('hidden');
  }

  function nextQ() { window._gardenQuiz.current++; renderQuestion(); }

  function showHint() {
    const q = window._gardenQuiz; if (q.answered) return;
    const fb = document.getElementById('quiz-feedback');
    if (fb) { fb.textContent = q.questions[q.current].hint?.[currentLang]||''; fb.className='quiz-feedback'; fb.style.cssText='background:var(--bg-elevated);color:var(--text-secondary);border:1px solid var(--border-color)'; }
  }

  function showResults() {
    const q = window._gardenQuiz;
    document.getElementById('quiz-content')?.classList.add('hidden');
    document.getElementById('quiz-results')?.classList.remove('hidden');
    const pf = document.getElementById('quiz-progress-fill'); if(pf) pf.style.width='100%';
    const se = document.getElementById('quiz-score-display'); if(se) se.textContent=`${q.score} / ${q.questions.length}`;
    const ee = document.getElementById('quiz-score-emoji');
    const pct = q.score/q.questions.length;
    if(ee){ if(pct>=0.9){ee.textContent='🏆';try{confetti({particleCount:150,spread:80,origin:{y:0.6}})}catch(e){}} else if(pct>=0.7)ee.textContent='🌟'; else if(pct>=0.5)ee.textContent='💪'; else ee.textContent='📚'; }
    const s=document.documentElement.getAttribute('data-subject')||'XX', m=document.documentElement.getAttribute('data-module')||'0';
    try{const p=parseInt(localStorage.getItem(`garden_${s}_m${m}_quiz`))||0;if(q.score>p)localStorage.setItem(`garden_${s}_m${m}_quiz`,q.score)}catch(e){}
  }

  function retryQuiz() {
    const q = window._gardenQuiz; q.current=0; q.score=0; q.answered=false; liveScore();
    document.getElementById('quiz-content')?.classList.remove('hidden');
    document.getElementById('quiz-results')?.classList.add('hidden');
    renderQuestion();
  }

  /* ═══ AUTO SYNTAX HIGHLIGHTER ═══ */
  function initSyntaxHighlight() {
    document.querySelectorAll('.code-block').forEach(block => {
      const headerSpan = block.querySelector('.code-block-header span');
      const codeEl = block.querySelector('pre code');
      if (!codeEl) return;

      const lang = (headerSpan?.textContent || '').trim().toLowerCase();
      const raw = codeEl.textContent; // plain text, no HTML

      let highlighted;
      if (['sql','mysql','postgresql','plsql','sqlite'].includes(lang)) {
        highlighted = hlSQL(raw);
      } else if (['pseudocode','pseudo','algorithm'].includes(lang)) {
        highlighted = hlPseudo(raw);
      } else if (['python','py'].includes(lang)) {
        highlighted = hlPython(raw);
      } else if (['java','c','cpp','c++','csharp','c#'].includes(lang)) {
        highlighted = hlCLike(raw);
      } else if (['javascript','js','typescript','ts'].includes(lang)) {
        highlighted = hlJS(raw);
      } else {
        highlighted = hlGeneric(raw);
      }

      codeEl.innerHTML = highlighted;
    });

    document.querySelectorAll('.pseudo-block code, pre.pseudo-block').forEach(codeEl => {
      if (codeEl.closest('.code-block')) return;
      codeEl.innerHTML = hlPseudo(codeEl.textContent);
    });
  }

  /*
   * Tokenizer approach:
   * 1. Scan the line character-by-character, extracting tokens
   * 2. Each token is { type: 'kw'|'fn'|'str'|'num'|'cm'|'op'|'ty'|'ct'|'plain', text: '...' }
   * 3. Render: escape text, wrap in <span class="type"> for non-plain
   * This avoids the cascading-replace problem entirely.
   */

  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderTokens(tokens) {
    return tokens.map(t => {
      const safe = escHtml(t.text);
      return t.type === 'plain' ? safe : '<span class="'+t.type+'">'+safe+'</span>';
    }).join('');
  }

  function tokenizeLine(line, rules) {
    const tokens = [];
    let pos = 0;
    while (pos < line.length) {
      let matched = false;
      for (const rule of rules) {
        rule.regex.lastIndex = pos;
        const m = rule.regex.exec(line);
        if (m && m.index === pos) {
          if (pos > m.index) continue; // safety
          tokens.push({ type: rule.type, text: m[0] });
          pos += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        // Accumulate plain text
        const last = tokens[tokens.length-1];
        if (last && last.type === 'plain') {
          last.text += line[pos];
        } else {
          tokens.push({ type: 'plain', text: line[pos] });
        }
        pos++;
      }
    }
    return tokens;
  }

  // ── SQL Rules ──
  const SQL_RULES = [
    { type:'cm', regex:/--.*$/gm },
    { type:'cm', regex:/\/\*[\s\S]*?\*\//g },
    { type:'str', regex:/'(?:[^'\\]|\\.)*'/g },
    { type:'num', regex:/\b\d+(?:\.\d+)?\b/g },
    { type:'ct', regex:/\b(?:NULL|TRUE|FALSE|DEFAULT)\b/gi },
    { type:'kw', regex:/\b(?:SELECT|FROM|WHERE|AND|OR|NOT|IN|EXISTS|LIKE|BETWEEN|UNION|ALL|DISTINCT|AS|JOIN|INNER|LEFT|RIGHT|OUTER|CROSS|NATURAL|ON|USING|GROUP\s+BY|ORDER\s+BY|HAVING|LIMIT|OFFSET|INSERT\s+INTO|INSERT|VALUES|UPDATE|SET|DELETE|CREATE\s+TABLE|CREATE\s+SCHEMA|CREATE\s+DOMAIN|CREATE\s+INDEX|CREATE\s+VIEW|CREATE\s+TRIGGER|CREATE\s+ASSERTION|CREATE|DROP|ALTER\s+TABLE|ALTER|ADD|COLUMN|MODIFY|RENAME|TRUNCATE|REPLACE|INTO|TABLE|SCHEMA|VIEW|INDEX|GRANT|REVOKE|BEGIN|END|COMMIT|ROLLBACK|SAVEPOINT|IF|ELSE|THEN|WHEN|CASE|CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|UNIQUE|CHECK|NOT\s+NULL|ON\s+DELETE|ON\s+UPDATE|CASCADE|RESTRICT|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION|AUTHORIZATION|WITH|RECURSIVE|DECLARE|CURSOR|FETCH|OPEN|CLOSE|FOR\s+EACH\s+ROW|BEFORE|AFTER|INSTEAD\s+OF|PROCEDURE|FUNCTION|RETURNS|RETURN|CALL|EXECUTE|ASC|DESC)\b/gi },
    { type:'fn', regex:/\b(?:COUNT|SUM|AVG|MIN|MAX|UPPER|LOWER|LENGTH|TRIM|SUBSTRING|CONCAT|COALESCE|CAST|CONVERT|ROUND|CEIL|FLOOR|ABS|MOD|POWER|SQRT|NOW|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|EXTRACT|DATEDIFF|IFNULL|NULLIF|NVL|GREATEST|LEAST)\s*(?=\()/gi },
    { type:'ty', regex:/\b(?:INT|INTEGER|SMALLINT|BIGINT|FLOAT|DOUBLE\s+PRECISION|REAL|DECIMAL|NUMERIC|CHAR|VARCHAR|NCHAR|NVARCHAR|TEXT|CLOB|BLOB|BOOLEAN|BIT|DATE|TIME|TIMESTAMP|INTERVAL|SERIAL|DOMAIN|ENUM)\b/gi },
    { type:'op', regex:/[<>=!]+|:=|\|\||&&/g },
  ];

  function hlSQL(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, SQL_RULES))).join('\n');
  }

  // ── Pseudocode Rules ──
  const PSEUDO_RULES = [
    { type:'cm', regex:/\/\/.*$/gm },
    { type:'cm', regex:/#.*$/gm },
    { type:'str', regex:/"[^"]*"|'[^']*'/g },
    { type:'num', regex:/\b\d+(?:\.\d+)?\b/g },
    { type:'ct', regex:/\b(?:NULL|nil|null|TRUE|FALSE|true|false|INFINITY|EMPTY|undefined|NaN)\b/g },
    { type:'kw', regex:/\b(?:if|else|elif|then|while|for|do|end|begin|return|function|procedure|algorithm|call|input|output|print|read|write|repeat|until|break|continue|switch|case|default|try|catch|throw|new|class|extends|import|from|export|var|let|const|def|lambda|yield|async|await|each|in|of|to|downto|step|and|or|not|xor|mod|div|is|set|get)\b/gi },
    { type:'fn', regex:/\b[a-zA-Z_]\w*\s*(?=\()/g },
    { type:'op', regex:/←|→|≤|≥|≠|:=|==|!=|<>|&&|\|\||[<>=!]+/g },
  ];

  function hlPseudo(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, PSEUDO_RULES))).join('\n');
  }

  // ── Python Rules ──
  const PY_RULES = [
    { type:'cm', regex:/#.*$/gm },
    { type:'str', regex:/"""[\s\S]*?"""|'''[\s\S]*?'''|"[^"]*"|'[^']*'/g },
    { type:'num', regex:/\b\d+(?:\.\d+)?\b/g },
    { type:'ct', regex:/\b(?:None|True|False)\b/g },
    { type:'kw', regex:/\b(?:def|class|if|elif|else|for|while|return|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|assert|del|print|async|await)\b/g },
    { type:'fn', regex:/\b[a-zA-Z_]\w*\s*(?=\()/g },
    { type:'op', regex:/==|!=|<=|>=|:=|\*\*|[<>=!+\-*\/%]+/g },
  ];

  function hlPython(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, PY_RULES))).join('\n');
  }

  // ── C-Like Rules ──
  const C_RULES = [
    { type:'cm', regex:/\/\/.*$/gm },
    { type:'cm', regex:/\/\*[\s\S]*?\*\//g },
    { type:'str', regex:/"[^"]*"|'[^']*'/g },
    { type:'num', regex:/\b\d+(?:\.\d+)?[fFdDlL]?\b/g },
    { type:'ct', regex:/\b(?:null|NULL|true|false|nullptr)\b/g },
    { type:'ty', regex:/\b(?:int|float|double|char|void|bool|boolean|long|short|unsigned|signed|string|String|auto|Integer|Float|Double|Boolean|ArrayList|HashMap|LinkedList|Queue|Stack|Set|List|Map)\b/g },
    { type:'kw', regex:/\b(?:const|static|final|public|private|protected|abstract|virtual|override|class|struct|enum|interface|extends|implements|new|delete|this|super|sizeof|typeof|instanceof|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|throw|throws|finally|import|package|include|using|namespace|var)\b/g },
    { type:'fn', regex:/\b[a-zA-Z_]\w*\s*(?=\()/g },
    { type:'op', regex:/==|!=|<=|>=|&&|\|\||::|->|\+\+|--|[<>=!+\-*\/%&|^~]+/g },
  ];

  function hlCLike(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, C_RULES))).join('\n');
  }

  // ── JavaScript Rules ──
  const JS_RULES = [
    { type:'cm', regex:/\/\/.*$/gm },
    { type:'cm', regex:/\/\*[\s\S]*?\*\//g },
    { type:'str', regex:/`[^`]*`|"[^"]*"|'[^']*'/g },
    { type:'num', regex:/\b\d+(?:\.\d+)?\b/g },
    { type:'ct', regex:/\b(?:null|undefined|NaN|Infinity|true|false)\b/g },
    { type:'kw', regex:/\b(?:var|let|const|function|return|if|else|for|while|do|switch|case|default|break|continue|try|catch|throw|finally|new|delete|typeof|instanceof|in|of|class|extends|super|this|import|export|from|as|async|await|yield|static|get|set)\b/g },
    { type:'fn', regex:/\b[a-zA-Z_$]\w*\s*(?=\()/g },
    { type:'op', regex:/===|!==|==|!=|=>|<=|>=|&&|\|\||[<>=!+\-*\/%&|^~?:]+/g },
  ];

  function hlJS(code) {
    return code.split('\n').map(line => renderTokens(tokenizeLine(line, JS_RULES))).join('\n');
  }

  // ── Generic (auto-detect) ──
  function hlGeneric(code) {
    const sqlHits = (code.match(/\b(SELECT|CREATE|INSERT|DELETE|UPDATE|FROM|WHERE|TABLE|PRIMARY|FOREIGN|KEY|REFERENCES|CONSTRAINT)\b/gi) || []).length;
    return sqlHits >= 2 ? hlSQL(code) : hlPseudo(code);
  }

  /* ═══ STUDENT NOTES SYSTEM ═══ */
  function notesKey() {
    const s = document.documentElement.getAttribute('data-subject') || 'XX';
    const m = document.documentElement.getAttribute('data-module') || '0';
    return `garden_${s}_m${m}_notes`;
  }
  function loadNotes() { try { return JSON.parse(localStorage.getItem(notesKey())) || []; } catch(e) { return []; } }
  function saveNotes(notes) { try { localStorage.setItem(notesKey(), JSON.stringify(notes)); } catch(e) {} }

  function initNotes() {
    // Add tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'notes-tooltip';
    tooltip.id = 'notes-tooltip';
    tooltip.innerHTML = `<button id="notes-save-btn">📝 ${currentLang === 'ar' ? 'حفظ ملاحظة' : 'Save Note'}</button>`;
    document.body.appendChild(tooltip);

    // Add notes button to sidebar
    const widget = document.querySelector('.sidebar-widget');
    if (widget) {
      const notesBtn = document.createElement('button');
      notesBtn.className = 'sidebar-notes-btn';
      notesBtn.id = 'sidebar-notes-btn';
      const notes = loadNotes();
      notesBtn.innerHTML = `📝 <span data-i18n="notes.btn">${currentLang === 'ar' ? 'ملاحظاتي' : 'My Notes'}</span> <span class="notes-count" id="notes-count">${notes.length}</span>`;
      notesBtn.addEventListener('click', openNotesPanel);
      widget.parentNode.insertBefore(notesBtn, widget.nextSibling);
    }

    // Text selection - desktop (mouseup) + mobile (selectionchange)
    let selectionTimeout;
    const mainContent = document.querySelector('.main-content');
    mainContent?.addEventListener('mouseup', (e) => {
      clearTimeout(selectionTimeout);
      selectionTimeout = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 3 && text.length < 500) {
          showNotesTooltip(e.clientX, e.clientY, text);
        } else { hideNotesTooltip(); }
      }, 200);
    });

    // Mobile: selectionchange fires alongside OS menu
    let mobileSelTimeout;
    document.addEventListener('selectionchange', () => {
      clearTimeout(mobileSelTimeout);
      if (window.innerWidth > 1024) return;
      mobileSelTimeout = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim();
        if (text && text.length > 3 && text.length < 500 && mainContent?.contains(sel.anchorNode)) {
          showMobileNoteSaveBar(text);
        } else { hideMobileNoteSaveBar(); }
      }, 800);
    });

    document.addEventListener('mousedown', (e) => {
      if (!e.target.closest('.notes-tooltip') && !e.target.closest('.notes-panel') && !e.target.closest('.mobile-note-bar')) {
        hideNotesTooltip();
      }
    });

    // Save button handler
    document.getElementById('notes-save-btn')?.addEventListener('click', () => {
      const text = window._gardenNotesSelection;
      if (!text) return;
      promptNoteText(text);
    });

    // Restore highlights
    restoreHighlights();
  }

  function showNotesTooltip(x, y, text) {
    const tip = document.getElementById('notes-tooltip');
    if (!tip) return;
    window._gardenNotesSelection = text;
    tip.style.display = 'block';
    tip.style.left = `${Math.min(x, window.innerWidth - 180)}px`;
    tip.style.top = `${Math.max(y - 50, 10)}px`;
    const btn = tip.querySelector('button');
    if (btn) btn.textContent = `📝 ${currentLang === 'ar' ? 'حفظ ملاحظة' : 'Save Note'}`;
  }

  function hideNotesTooltip() {
    const tip = document.getElementById('notes-tooltip');
    if (tip) tip.style.display = 'none';
  }

  function showMobileNoteSaveBar(text) {
    let bar = document.getElementById('mobile-note-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'mobile-note-bar';
      bar.className = 'mobile-note-bar';
      document.body.appendChild(bar);
    }
    window._gardenNotesSelection = text;
    const L = currentLang;
    const preview = text.length > 50 ? text.substring(0, 50) + '...' : text;
    bar.innerHTML =
      '<div class="mnb-text">' + escapeHTML(preview) + '</div>' +
      '<button class="mnb-save" id="mnb-save">\ud83d\udcdd ' + (L === 'ar' ? '\u062d\u0641\u0638' : 'Save') + '</button>';
    bar.style.display = 'flex';
    bar.querySelector('#mnb-save').onclick = () => {
      hideMobileNoteSaveBar();
      promptNoteText(text);
    };
  }

  function hideMobileNoteSaveBar() {
    const bar = document.getElementById('mobile-note-bar');
    if (bar) bar.style.display = 'none';
  }

  function promptNoteText(highlightText) {
    hideNotesTooltip();
    window.getSelection()?.removeAllRanges();

    const L = currentLang;
    // Build a mini modal for note input
    document.querySelector('.garden-modal-overlay')?.remove();
    const overlay = document.createElement('div');
    overlay.className = 'garden-modal-overlay';
    overlay.innerHTML = `
      <div class="garden-modal" style="max-width:450px;">
        <div class="garden-modal-icon">📝</div>
        <div class="garden-modal-title">${L === 'ar' ? 'أضف ملاحظتك' : 'Add Your Note'}</div>
        <div style="text-align:start;margin-bottom:1rem;">
          <div style="font-size:0.8rem;color:var(--brand-500);font-style:italic;border-inline-start:3px solid var(--brand-500);padding-inline-start:0.6rem;margin-bottom:0.75rem;line-height:1.5;font-weight:600;">"${highlightText.substring(0, 120)}${highlightText.length > 120 ? '...' : ''}"</div>
          <textarea id="note-input" rows="3" placeholder="${L === 'ar' ? 'اكتب ملاحظتك هنا...' : 'Write your note here...'}" style="width:100%;padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-elevated);color:var(--text-primary);font-family:inherit;font-size:0.9rem;font-weight:600;resize:vertical;"></textarea>
        </div>
        <div class="garden-modal-actions">
          <button class="garden-modal-btn garden-modal-btn--cancel" id="note-cancel">${L === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button class="garden-modal-btn" id="note-confirm" style="background:var(--brand-500);color:#fff;border-color:var(--brand-500);">${L === 'ar' ? 'حفظ' : 'Save'}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.querySelector('#note-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#note-confirm').addEventListener('click', () => {
      const input = document.getElementById('note-input');
      const userNote = input?.value?.trim() || '';
      const note = {
        id: Date.now(),
        highlight: highlightText,
        note: userNote,
        date: new Date().toISOString().split('T')[0],
        lang: L
      };
      const notes = loadNotes();
      notes.unshift(note);
      saveNotes(notes);
      updateNotesCount();
      overlay.remove();
    });

    // Focus textarea
    setTimeout(() => document.getElementById('note-input')?.focus(), 100);
  }

  function promptFreeNote() {
    const L = currentLang;
    document.querySelector('.garden-modal-overlay')?.remove();
    const ov = document.createElement('div');
    ov.className = 'garden-modal-overlay';
    ov.innerHTML = `
      <div class="garden-modal" style="max-width:450px;">
        <div class="garden-modal-icon">📝</div>
        <div class="garden-modal-title">${L === 'ar' ? 'ملاحظة جديدة' : 'New Note'}</div>
        <div style="text-align:start;margin-bottom:0.75rem;">
          <input id="free-note-title" type="text" placeholder="${L === 'ar' ? 'عنوان الملاحظة...' : 'Note title...'}" style="width:100%;padding:0.6rem 0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-elevated);color:var(--text-primary);font-family:inherit;font-size:0.9rem;font-weight:700;margin-bottom:0.5rem;">
          <textarea id="free-note-body" rows="4" placeholder="${L === 'ar' ? 'اكتب ملاحظتك...' : 'Write your note...'}" style="width:100%;padding:0.75rem;border-radius:var(--radius-md);border:1px solid var(--border-color);background:var(--bg-elevated);color:var(--text-primary);font-family:inherit;font-size:0.9rem;font-weight:600;resize:vertical;"></textarea>
        </div>
        <div class="garden-modal-actions">
          <button class="garden-modal-btn garden-modal-btn--cancel" id="free-note-cancel">${L === 'ar' ? 'إلغاء' : 'Cancel'}</button>
          <button class="garden-modal-btn" id="free-note-save" style="background:var(--brand-500);color:#fff;border-color:var(--brand-500);">${L === 'ar' ? 'حفظ' : 'Save'}</button>
        </div>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) ov.remove(); });
    ov.querySelector('#free-note-cancel').onclick = () => ov.remove();
    ov.querySelector('#free-note-save').onclick = () => {
      const title = document.getElementById('free-note-title')?.value?.trim() || '';
      const body = document.getElementById('free-note-body')?.value?.trim() || '';
      if (!title && !body) return;
      const note = { id: Date.now(), highlight: title || (L === 'ar' ? 'ملاحظة عامة' : 'General note'), note: body, date: new Date().toISOString().split('T')[0], lang: L, free: true };
      const notes = loadNotes();
      notes.unshift(note);
      saveNotes(notes);
      updateNotesCount();
      ov.remove();
    };
    setTimeout(() => document.getElementById('free-note-title')?.focus(), 100);
  }

  function updateNotesCount() {
    const el = document.getElementById('notes-count');
    if (el) el.textContent = loadNotes().length;
  }

  function restoreHighlights() {
    // Lightweight: we don't try to re-highlight text in DOM (fragile).
    // Highlights only show in the notes panel.
  }

  function openNotesPanel() {
    // Remove existing
    document.querySelector('.notes-panel-overlay')?.remove();
    document.querySelector('.notes-panel')?.remove();

    const L = currentLang;
    const notes = loadNotes();

    const overlay = document.createElement('div');
    overlay.className = 'notes-panel-overlay';
    overlay.style.display = 'block';

    const panel = document.createElement('div');
    panel.className = 'notes-panel';
    panel.innerHTML = `
      <div class="notes-panel-header">
        <h3>📝 ${L === 'ar' ? 'ملاحظاتي' : 'My Notes'} (${notes.length})</h3>
        <button class="notes-add-free" id="notes-add-free" title="${L === 'ar' ? 'ملاحظة جديدة' : 'New note'}">＋</button>
        <button class="notes-panel-close" id="notes-panel-close">✕</button>
      </div>
      <div class="notes-panel-body" id="notes-panel-body">
        ${notes.length === 0 
          ? `<div class="notes-empty">${L === 'ar' ? 'لا توجد ملاحظات بعد.<br>حدد أي نص في المحتوى واضغط "حفظ ملاحظة"' : 'No notes yet.<br>Select any text in the content and click "Save Note"'}</div>`
          : notes.map(n => `
            <div class="note-card" data-note-id="${n.id}">
              <div class="note-highlight-text">"${(n.highlight || '').substring(0, 150)}${(n.highlight || '').length > 150 ? '...' : ''}"</div>
              ${n.note ? `<div class="note-user-text">${escapeHTML(n.note)}</div>` : ''}
              <div class="note-meta">
                <span>${n.date || ''}</span>
                <button class="note-delete" data-del-id="${n.id}" title="${L === 'ar' ? 'حذف' : 'Delete'}">🗑️</button>
              </div>
            </div>`).join('')
        }
      </div>`;

    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    // Close handlers
    const closePanel = () => { overlay.remove(); panel.remove(); };
    overlay.addEventListener('click', closePanel);
    panel.querySelector('#notes-panel-close').addEventListener('click', closePanel);
    document.addEventListener('keydown', function escN(e) {
      if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', escN); }
    });

    // Free note button
    panel.querySelector('#notes-add-free')?.addEventListener('click', () => {
      closePanel();
      promptFreeNote();
    });

    // Delete handlers
    panel.querySelectorAll('.note-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-del-id'));
        let notes = loadNotes();
        notes = notes.filter(n => n.id !== id);
        saveNotes(notes);
        updateNotesCount();
        btn.closest('.note-card')?.remove();
        // Update header count
        const h = panel.querySelector('h3');
        if (h) h.textContent = `📝 ${L === 'ar' ? 'ملاحظاتي' : 'My Notes'} (${notes.length})`;
        if (notes.length === 0) {
          const body = document.getElementById('notes-panel-body');
          if (body) body.innerHTML = `<div class="notes-empty">${L === 'ar' ? 'لا توجد ملاحظات بعد' : 'No notes yet'}</div>`;
        }
      });
    });
  }

  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ═══ VIDEO RECOMMENDATIONS (fetch from _vault, no HTML modification) ═══ */
  function initVideos() {
    const subject = document.documentElement.getAttribute('data-subject');
    const moduleNum = document.documentElement.getAttribute('data-module');
    if (!subject || !moduleNum) return;

    const moduleStr = `M${String(moduleNum).padStart(2, '0')}`;
    const jsonPath = `_vault/${moduleStr}_videos.json`;

    fetch(jsonPath)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        if (!data.videos || data.videos.length === 0) return;
        renderVideoSection(data);
      })
      .catch(() => { /* No videos file — silently skip */ });
  }

  function renderVideoSection(data) {
    const L = currentLang;
    const videos = data.videos;

    // Find insertion point: before #professor or before #flashcards
    const anchor = document.getElementById('professor')
      || document.getElementById('flashcards')
      || document.getElementById('vault');
    if (!anchor) return;

    const section = document.createElement('section');
    section.id = 'videos';
    section.className = 'video-section fade-up';

    const videoCards = videos.map(v => {
      const topicAr = v.topic_ar || v.topic_en || '';
      const topicEn = v.topic_en || v.topic_ar || '';
      return `
        <a href="${v.url}" target="_blank" rel="noopener" class="video-card glass-card" title="${escapeHTML(v.title)}">
          <div class="video-card-lang">${v.language === 'ar' ? 'عر' : 'EN'}</div>
          <div class="video-card-body">
            <div class="video-card-title">${escapeHTML(v.title)}</div>
            <div class="video-card-channel">${escapeHTML(v.channel)}</div>
            <div class="video-card-topic" data-bilingual>
              <template class="content-ar">${escapeHTML(topicAr)}</template>
              <template class="content-en">${escapeHTML(topicEn)}</template>
              <span class="content-target">${escapeHTML(L === 'ar' ? topicAr : topicEn)}</span>
            </div>
          </div>
          <div class="video-card-play">▶</div>
        </a>`;
    }).join('');

    section.innerHTML = `
      <button class="video-toggle glass-card" id="video-toggle" aria-expanded="false">
        <div class="video-toggle-content" data-bilingual>
          <template class="content-ar">🎬 فيديوهات تعليمية مقترحة (${videos.length})</template>
          <template class="content-en">🎬 Recommended Videos (${videos.length})</template>
          <span class="content-target">${L === 'ar' ? `🎬 فيديوهات تعليمية مقترحة (${videos.length})` : `🎬 Recommended Videos (${videos.length})`}</span>
        </div>
        <span class="video-toggle-chevron">▼</span>
      </button>
      <div class="video-collapsible" id="video-collapsible">
        <p class="video-section-desc" data-bilingual>
          <template class="content-ar">فيديوهات مختارة بعناية لأصعب المواضيع في هذه الوحدة</template>
          <template class="content-en">Carefully selected videos for the hardest topics in this module</template>
          <span class="content-target">${L === 'ar' ? 'فيديوهات مختارة بعناية لأصعب المواضيع في هذه الوحدة' : 'Carefully selected videos for the hardest topics in this module'}</span>
        </p>
        <div class="video-list">${videoCards}</div>
      </div>`;

    anchor.parentNode.insertBefore(section, anchor);

    // Toggle collapse
    document.getElementById('video-toggle').addEventListener('click', () => {
      const btn = document.getElementById('video-toggle');
      const list = document.getElementById('video-collapsible');
      const isOpen = list.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    });

    // Add to sidebar TOC
    const tocDivider = document.querySelector('.toc-divider');
    if (tocDivider) {
      const tocLink = document.createElement('a');
      tocLink.href = '#videos';
      tocLink.className = 'toc-link toc-link--action';
      tocLink.setAttribute('data-bilingual', '');
      tocLink.innerHTML = `
        <span class="toc-action-icon">🎬</span>
        <template class="content-ar">فيديوهات مقترحة</template>
        <template class="content-en">Recommended Videos</template>
        <span class="content-target">${L === 'ar' ? 'فيديوهات مقترحة' : 'Recommended Videos'}</span>`;
      tocDivider.parentNode.insertBefore(tocLink, tocDivider);
    }

    // Observe for fade-up
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08 });
    obs.observe(section);
  }

  /* ═══ FONT SIZE SCALING v8.8 ═══ */
  const FONT_SIZES = ['xs', 'sm', 'md', 'lg', 'xl'];
  const FONT_LABELS = { xs: 'XS', sm: 'S', md: 'M', lg: 'L', xl: 'XL' };
  let currentFontSize = localStorage.getItem('garden_font_size') || 'md';

  function applyFontSize(size) {
    if (!FONT_SIZES.includes(size)) size = 'md';
    currentFontSize = size;
    document.documentElement.setAttribute('data-font-size', size);
    localStorage.setItem('garden_font_size', size);
    updateFontSizeUI();
  }

  function changeFontSize(direction) {
    const idx = FONT_SIZES.indexOf(currentFontSize);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= FONT_SIZES.length) return;
    applyFontSize(FONT_SIZES[newIdx]);
  }

  function updateFontSizeUI() {
    const indicator = document.getElementById('font-size-indicator');
    const btnMinus = document.getElementById('font-size-minus');
    const btnPlus = document.getElementById('font-size-plus');
    if (indicator) indicator.textContent = FONT_LABELS[currentFontSize] || 'M';
    if (btnMinus) btnMinus.classList.toggle('at-limit', FONT_SIZES.indexOf(currentFontSize) === 0);
    if (btnPlus) btnPlus.classList.toggle('at-limit', FONT_SIZES.indexOf(currentFontSize) === FONT_SIZES.length - 1);
  }

  function initFontSize() {
    // تطبيق الحجم المحفوظ
    applyFontSize(currentFontSize);

    // حقن أزرار التحكم في الهيدر
    const actions = document.querySelector('.header-actions');
    if (!actions) {
      // لو ما فيه header-actions (مثل Dashboard) → حقن في dash-actions
      const dashActions = document.querySelector('.dash-actions');
      if (dashActions) injectFontButtons(dashActions, 'before');
      return;
    }
    injectFontButtons(actions, 'before');
  }

  function injectFontButtons(container, position) {
    // لا تحقن لو موجودة مسبقاً
    if (document.getElementById('font-size-group')) return;

    const group = document.createElement('div');
    group.className = 'font-size-group';
    group.id = 'font-size-group';
    group.innerHTML =
      '<button class="font-size-btn" id="font-size-minus" title="' + (currentLang === 'ar' ? 'تصغير الخط' : 'Decrease font') + '"><i class="fa-solid fa-minus"></i></button>' +
      '<span class="font-size-indicator" id="font-size-indicator">' + (FONT_LABELS[currentFontSize] || 'M') + '</span>' +
      '<button class="font-size-btn" id="font-size-plus" title="' + (currentLang === 'ar' ? 'تكبير الخط' : 'Increase font') + '"><i class="fa-solid fa-plus"></i></button>';

    // إدراج قبل الـ divider الأول (بدون إضافة divider جديد لتجنب التكرار)
    const divider = container.querySelector('.divider-v');
    if (divider && position === 'before') {
      container.insertBefore(group, divider);
    } else {
      container.prepend(group);
    }

    // Event listeners
    document.getElementById('font-size-minus').addEventListener('click', () => changeFontSize(-1));
    document.getElementById('font-size-plus').addEventListener('click', () => changeFontSize(1));
    updateFontSizeUI();
  }

  /* ═══ SCROLL-TO-TOP BUTTON (global) v8.8 ═══ */
  function initScrollToTop() {
    // لا تضف الزر لو موجود مسبقاً (صفحات المراجعة القديمة لها زر inline)
    if (document.querySelector('.garden-scroll-top') || document.getElementById('back-to-top')) return;
    const btn = document.createElement('button');
    btn.className = 'garden-scroll-top';
    btn.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
    btn.setAttribute('aria-label', currentLang === 'ar' ? 'العودة للأعلى' : 'Back to top');
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    document.body.appendChild(btn);

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          btn.classList.toggle('visible', window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ═══ AUTO TABLE WRAPPER v8.8 ═══ */
  function initTableWrap() {
    // لف كل comparison-table غير ملفوف في .comparison-wrapper تلقائياً
    document.querySelectorAll('.comparison-table').forEach(table => {
      if (table.parentElement?.classList.contains('comparison-wrapper')) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'comparison-wrapper';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  /* ═══ UTILITIES ═══ */
  function initScrollAnimations() {
    const obs = new IntersectionObserver(entries => { entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); }); }, { threshold: 0.08 });
    document.querySelectorAll('.fade-up').forEach(el => obs.observe(el));
  }
  function initTOC() {
    const secs = document.querySelectorAll('section[id]'); if(!secs.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const l = document.querySelector(`.toc-link[href="#${e.target.id}"]`);
        if (l) {
          l.classList.toggle('active', e.isIntersecting);
          if (e.isIntersecting) {
            const scroller = document.querySelector('.toc-concepts');
            if (scroller && l.closest('.toc-concepts-wrapper')) {
              const top = l.offsetTop - scroller.offsetTop - scroller.clientHeight / 2 + l.clientHeight / 2;
              scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            }
          }
        }
      });
    }, { rootMargin: '-15% 0px -75% 0px' });
    secs.forEach(s => obs.observe(s));
  }
  function initProgress() {
    const bar = document.querySelector('.reading-progress'); if(!bar) return;
    window.addEventListener('scroll', () => { const t=document.body.scrollHeight-window.innerHeight; bar.style.width=t>0?`${(window.scrollY/t)*100}%`:'0%'; }, { passive: true });
  }
  function initCopy() {
    document.querySelectorAll('.copy-btn').forEach(btn => { btn.addEventListener('click', () => { const code=btn.closest('.code-block')?.querySelector('pre')?.textContent||''; navigator.clipboard.writeText(code).then(()=>{const o=btn.textContent;btn.textContent='✅';setTimeout(()=>btn.textContent=o,1500)}); }); });
  }

  /* === SMART SIDEBAR - pin top/bottom, scroll concepts === */
  function initSmartSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const tocList = document.querySelector('.toc-list');
    if (!sidebar || !tocList) return;

    const divider = tocList.querySelector('.toc-divider');
    if (!divider) return;

    // ── Classify every direct child of tocList ──────────────────────
    // conceptLinks : ALL toc-links before the divider (hero, objectives, topics…)
    // bottomLinks  : ALL toc-links after the divider (professor, flashcards…)
    const conceptLinks = [], bottomLinks = [];
    let passedDivider = false;

    Array.from(tocList.children).forEach(el => {
      if (el === divider)                     { passedDivider = true; return; }
      if (!el.classList.contains('toc-link')) { return; }
      if (passedDivider) { bottomLinks.push(el); } else { conceptLinks.push(el); }
    });

    // Need at least 4 concept links to bother with smart layout
    if (conceptLinks.length < 4) return;
    sidebar.classList.add('smart');

    // ── Scrollable concepts wrapper ──────────────────────────────────
    const wrapper = document.createElement('div');
    wrapper.className = 'toc-concepts-wrapper at-top at-bottom';

    if (conceptLinks.length >= 10) {
      // ≥10 → pin first 2 and last 2, scroll the middle
      const innerTop = document.createElement('div');
      innerTop.className = 'toc-inner-top';
      conceptLinks.slice(0, 2).forEach(l => innerTop.appendChild(l));

      const scroller = document.createElement('div');
      scroller.className = 'toc-concepts';
      conceptLinks.slice(2, -2).forEach(l => scroller.appendChild(l));

      const innerBot = document.createElement('div');
      innerBot.className = 'toc-inner-bottom';
      conceptLinks.slice(-2).forEach(l => innerBot.appendChild(l));

      wrapper.appendChild(innerTop);
      wrapper.appendChild(scroller);
      wrapper.appendChild(innerBot);

      scroller.addEventListener('scroll', () => {
        wrapper.classList.toggle('at-top',
          scroller.scrollTop < 5);
        wrapper.classList.toggle('at-bottom',
          scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 5);
      }, { passive: true });

      // After render: if content doesn't actually overflow, switch to centered layout
      requestAnimationFrame(() => {
        if (scroller.scrollHeight <= scroller.clientHeight) {
          // No real scroll needed — flatten to centered no-scroll layout
          wrapper.style.overflow = 'visible';
          wrapper.style.flex     = '0 0 auto';
          // Move innerTop links to the START (in order) and innerBot to the END
          const topFragment = document.createDocumentFragment();
          Array.from(innerTop.children).forEach(l => topFragment.appendChild(l));
          scroller.insertBefore(topFragment, scroller.firstChild);
          Array.from(innerBot.children).forEach(l => scroller.appendChild(l));
          innerTop.remove();
          innerBot.remove();
          scroller.style.flex   = '0 0 auto';
          scroller.style.height = 'auto';
          // Re-wrap in centerGroup (pinnedBottom stays in sidebar — no change needed)
          tocList.innerHTML = '';
          const centerGroup = document.createElement('div');
          centerGroup.className = 'toc-center-group';
          centerGroup.appendChild(wrapper);
          tocList.appendChild(centerGroup);
        }
      });

    } else {
      // 4–9 links → no scroll, center the block vertically
      wrapper.style.overflow = 'visible';
      wrapper.style.flex     = '0 0 auto';
      const scroller = document.createElement('div');
      scroller.className = 'toc-concepts';
      scroller.style.flex   = '0 0 auto';
      scroller.style.height = 'auto';
      conceptLinks.forEach(l => scroller.appendChild(l));
      wrapper.appendChild(scroller);
    }

    // ── pinnedBottom (divider + professor + flashcards…) ────────────
    // Inserted directly into .sidebar (NOT into toc-list) so it is
    // always visible and never competes with the scroll zone for space.
    const pinnedBottom = document.createElement('div');
    pinnedBottom.className = 'toc-pinned-bottom';
    pinnedBottom.appendChild(divider);
    bottomLinks.forEach(l => pinnedBottom.appendChild(l));

    // ── Rebuild toc-list ─────────────────────────────────────────────
    tocList.innerHTML = '';

    if (conceptLinks.length < 10) {
      // Center vertically when few concepts
      const centerGroup = document.createElement('div');
      centerGroup.className = 'toc-center-group';
      centerGroup.appendChild(wrapper);
      tocList.appendChild(centerGroup);
    } else {
      tocList.appendChild(wrapper);
    }

    // pinnedBottom goes into sidebar, before the widget
    const widget = sidebar.querySelector('.sidebar-widget');
    if (widget) {
      sidebar.insertBefore(pinnedBottom, widget);
    } else {
      sidebar.appendChild(pinnedBottom);
    }
  }


  /* === MOBILE FABs - edge tabs with bottom-sheet === */
  function initMobileFabs() {
    if (window.innerWidth > 1024) return;
    const hasCards = !!document.getElementById('flashcard-data');
    const hasNotes = !!document.querySelector('.sidebar-notes-btn');
    if (!hasCards && !hasNotes) return;
    const L = () => document.documentElement.lang || 'ar';
    const ctn = document.createElement('div');
    ctn.className = 'mobile-fab-container';
    ctn.id = 'mobile-fabs';

    // Cards FAB
    if (hasCards) {
      const fab = document.createElement('button');
      fab.className = 'mobile-fab';
      fab.innerHTML = '\ud83d\udcc7';
      const badge = document.createElement('span');
      badge.className = 'fab-badge'; badge.id = 'fab-cards-badge'; badge.textContent = '0';
      fab.appendChild(badge);
      fab.addEventListener('click', () => {
        const old = document.getElementById('fab-card-sheet');
        if (old) { old.remove(); return; }
        const isAr = L() === 'ar';
        const dueEl = document.getElementById('fc-due-count');
        const dueN = dueEl ? dueEl.textContent : '0';
        const sheet = document.createElement('div');
        sheet.id = 'fab-card-sheet'; sheet.className = 'mobile-bottom-sheet';
        sheet.innerHTML =
          '<div class="mbs-handle"></div>' +
          '<div class="mbs-row">' +
            '<span class="mbs-icon">\ud83d\udcc7</span>' +
            '<div class="mbs-info"><span class="mbs-count">' + dueN + '</span> ' +
            '<span class="mbs-label">' + (isAr ? '\u0628\u0637\u0627\u0642\u0629 \u0644\u0644\u0645\u0631\u0627\u062c\u0639\u0629' : 'cards due') + '</span></div>' +
            '<button class="mbs-go" id="mbs-go-cards">' + (isAr ? '\u0627\u0628\u062f\u0623 \u25b6' : 'Start \u25b6') + '</button>' +
          '</div>' +
          '<button class="mbs-dismiss" id="mbs-dismiss">\ud83d\udccc ' + (isAr ? '\u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0632\u0631 \u0627\u0644\u0639\u0627\u0626\u0645' : 'Hide floating button') + '</button>';
        document.body.appendChild(sheet);
        requestAnimationFrame(() => sheet.classList.add('open'));
        sheet.querySelector('#mbs-go-cards').onclick = () => {
          sheet.remove();
          document.getElementById('flashcards')?.scrollIntoView({ behavior: 'smooth' });
        };
        sheet.querySelector('#mbs-dismiss').onclick = () => { sheet.remove(); ctn.classList.add('docked'); };
        sheet.querySelector('.mbs-handle').onclick = () => sheet.remove();
        setTimeout(() => { if (sheet.parentNode) sheet.remove(); }, 8000);
      });
      ctn.appendChild(fab);
      const syncBadge = () => { const d = document.getElementById('fc-due-count'); if (d) badge.textContent = d.textContent; };
      syncBadge();
      const dueEl = document.getElementById('fc-due-count');
      if (dueEl) new MutationObserver(syncBadge).observe(dueEl, { childList: true, characterData: true, subtree: true });
    }

    // Notes FAB
    if (hasNotes) {
      const nfab = document.createElement('button');
      nfab.className = 'mobile-fab';
      nfab.innerHTML = '\ud83d\udcdd';
      const nbadge = document.createElement('span');
      nbadge.className = 'fab-badge'; nbadge.id = 'fab-notes-badge';
      const nc = document.getElementById('notes-count');
      nbadge.textContent = nc ? nc.textContent : '0';
      nfab.appendChild(nbadge);
      nfab.onclick = () => { document.getElementById('sidebar-notes-btn')?.click(); };
      ctn.appendChild(nfab);
      if (nc) new MutationObserver(() => { nbadge.textContent = nc.textContent; }).observe(nc, { childList: true, characterData: true, subtree: true });
    }

    document.body.appendChild(ctn);
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      ctn.classList.toggle('scrolling-down', y > lastY && y > 150);
      lastY = y;
    }, { passive: true });
  }

  function initKeys() {
    document.addEventListener('keydown', e => {
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return;
      switch(e.key){
        case ' ':if(document.getElementById('fc-card')){e.preventDefault();flipCard();}break;
        case 't':case 'T':cycleTheme();break;
        case 'l':case 'L':toggleLanguage();break;
        case '0':case '2':case '3':case '5':if(document.getElementById('fc-card')?.classList.contains('flipped')){gradeCard(Number(e.key));}break;
        case '+':case '=':changeFontSize(1);break;
        case '-':case '_':changeFontSize(-1);break;
      }
    });
  }

  /* ═══ ALGO PALETTE RANDOMISER ═══
   *
   *  Picks ONE of THREE designer-loved color libraries randomly on every
   *  page load. No storage — fresh roll each visit.
   *  Theme changes (dark/dim/light) are handled by MutationObserver.
   *
   *  Libraries used (all open-source, design-community loved):
   *
   *    1. Catppuccin Mocha/Latte  —  catppuccin.com
   *       "Soothing pastel theme for the high-spirited"
   *       Pastel tones, very easy on the eyes, huge following
   *
   *    2. Nord / Aurora  —  nordtheme.com
   *       "An arctic, north-bluish color palette"
   *       Clean, minimal, used in dozens of top design systems
   *
   *    3. Gruvbox  —  github.com/morhetz/gruvbox
   *       "Retro groove color scheme"
   *       Warm earthy tones, extremely high contrast & readable
   *
   *  swap is NEVER warm/pink — always a cool accent (teal/frost/aqua)
   *  so it never clashes with the rose brand bar color (CS353).
   *  Each state gets its own --algo-*-glow var for matched pulse color.
   *
   * ════════════════════════════════════════════════════════════════ */
  function initAlgoPalette() {
    /* * THE MASTER PALETTES : RETRO ARCADE (Synthwave)
     * Light Mode: 600-level (Deep & Vibrant)
     * Dark/Dim Mode: 400-level (Soft Neon / Pastel Glow)
     */
    const PALETTES = {
      // 🌸 CS353: المادة الوردية (Pink Base)
      // الألوان: نعناعي نيون | أزرق كهربائي | ثلجي مضيء | برتقالي يوسفي
      'CS353': {
        dark: { compare: '#2DD4BF', compareGlow: 'rgba(45, 212, 191, 0.35)', swap: '#60A5FA', swapGlow: 'rgba(96, 165, 250, 0.35)', sorted: '#22D3EE', active: '#FB923C', activeGlow: 'rgba(251, 146, 60, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim:  { compare: '#2DD4BF', compareGlow: 'rgba(45, 212, 191, 0.25)', swap: '#60A5FA', swapGlow: 'rgba(96, 165, 250, 0.25)', sorted: '#22D3EE', active: '#FB923C', activeGlow: 'rgba(251, 146, 60, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light:{ compare: '#0D9488', compareGlow: 'rgba(13, 148, 136, 0.25)', swap: '#2563EB', swapGlow: 'rgba(37, 99, 235, 0.25)',  sorted: '#0891B2', active: '#EA580C', activeGlow: 'rgba(234, 88, 12, 0.25)',   bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      },
      // 🌊 CS352: المادة الزرقاء (Blue Base)
      // الألوان: أصفر شمسي | خوخي نيون | نعناعي مضيء | لافندر فاقع
      'CS352': {
        dark: { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.35)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.35)', sorted: '#34D399', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim:  { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.25)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.25)', sorted: '#34D399', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light:{ compare: '#CA8A04', compareGlow: 'rgba(202, 138, 4, 0.25)',  swap: '#DB2777', swapGlow: 'rgba(219, 39, 119, 0.25)',  sorted: '#059669', active: '#9333EA', activeGlow: 'rgba(147, 51, 234, 0.25)',   bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      },
      // ⚡ CS350: المادة الكهرمانية (Amber Base)
      // الألوان: ثلجي مضيء | أحمر ياقوتي | نعناعي نيون | أزرق كهربائي
      'CS350': {
        dark: { compare: '#22D3EE', compareGlow: 'rgba(34, 211, 238, 0.35)', swap: '#F87171', swapGlow: 'rgba(248, 113, 113, 0.35)', sorted: '#2DD4BF', active: '#60A5FA', activeGlow: 'rgba(96, 165, 250, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim:  { compare: '#22D3EE', compareGlow: 'rgba(34, 211, 238, 0.25)', swap: '#F87171', swapGlow: 'rgba(248, 113, 113, 0.25)', sorted: '#2DD4BF', active: '#60A5FA', activeGlow: 'rgba(96, 165, 250, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light:{ compare: '#0891B2', compareGlow: 'rgba(8, 145, 178, 0.25)',  swap: '#DC2626', swapGlow: 'rgba(220, 38, 38, 0.25)',   sorted: '#0D9488', active: '#2563EB', activeGlow: 'rgba(37, 99, 235, 0.25)',   bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      },
      // 🌿 CS351: المادة الخضراء (Green Base)
      // الألوان: أصفر شمسي | خوخي نيون | ثلجي مضيء | لافندر فاقع
      'CS351': {
        dark: { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.35)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.35)', sorted: '#22D3EE', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.35)', bar: 'var(--brand-400)', nodeText: '#0F172A', barLabel: '#0F172A' },
        dim:  { compare: '#FDE047', compareGlow: 'rgba(253, 224, 71, 0.25)', swap: '#F472B6', swapGlow: 'rgba(244, 114, 182, 0.25)', sorted: '#22D3EE', active: '#C084FC', activeGlow: 'rgba(192, 132, 252, 0.25)', bar: 'var(--brand-300)', nodeText: '#0F172A', barLabel: '#0F172A' },
        light:{ compare: '#CA8A04', compareGlow: 'rgba(202, 138, 4, 0.25)',  swap: '#DB2777', swapGlow: 'rgba(219, 39, 119, 0.25)',  sorted: '#0891B2', active: '#9333EA', activeGlow: 'rgba(147, 51, 234, 0.25)',   bar: 'var(--brand-500)', nodeText: '#ffffff', barLabel: '#ffffff' },
      }
    };

    const root = document.documentElement;
    const currentSubject = root.getAttribute('data-subject') || 'CS352';
    const palette = PALETTES[currentSubject] || PALETTES['CS352'];

    function applyAlgoPalette() {
      const theme = root.getAttribute('data-theme') || 'dark';
      const p = palette[theme] || palette['dark'];
      
      root.style.setProperty('--algo-compare',       p.compare);
      root.style.setProperty('--algo-compare-glow',  p.compareGlow);
      root.style.setProperty('--algo-swap',          p.swap);
      root.style.setProperty('--algo-swap-glow',     p.swapGlow);
      root.style.setProperty('--algo-sorted',        p.sorted);
      root.style.setProperty('--algo-active',        p.active);
      root.style.setProperty('--algo-active-glow',   p.activeGlow);
      root.style.setProperty('--algo-bar',           p.bar);
      root.style.setProperty('--algo-node-text',     p.nodeText);
      root.style.setProperty('--algo-bar-label',     p.barLabel);
    }

    applyAlgoPalette();

    /* التحديث اللحظي عند تغيير الثيم */
    new MutationObserver(applyAlgoPalette)
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    root.setAttribute('data-algo-palette', currentSubject);
  }

  /* ═══ ALGO WIDGET LOADER v8.8 ═══ */
  function initAlgoLoader() {
    const m = document.documentElement.getAttribute('data-module');
    if (!m || m === 'review' || m === 'midterm' || m === 'final' || isNaN(m)) return;
    // لا تحمّل لو السكربت موجود مسبقاً (inline loader قديم)
    const padded = 'M' + String(m).padStart(2, '0') + '_algo.js';
    if (document.querySelector(`script[src="${padded}"]`)) return;
    const s = document.createElement('script');
    s.src = padded;
    s.onerror = function() {}; // silently ignore if file doesn't exist
    document.body.appendChild(s);
  }

  /* ═══ INIT ═══ */
  function init() {
    setLanguage(currentLang);
    initDepthTabs(); initAccordion(); initFlashcards(); initQuiz();
    initScrollAnimations(); initSmartSidebar(); initTOC(); initProgress(); initCopy(); initKeys();
    initSyntaxHighlight();
    initSM2Dashboard(); initActionLinks(); initNotes(); initVideos(); initMobileFabs();
    initAlgoPalette();
    initTableWrap(); initScrollToTop(); initFontSize(); initAlgoLoader();
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* ═══ PUBLIC API ═══ */
  window.Garden = {
    cycleTheme, toggleLanguage, setLanguage, applyTheme,
    flip: flipCard, grade: gradeCard, resetFC, report: showSM2Report,
    practice: startPractice, renderPractice, renderFC: renderFlashcard,
    pick: selectOption, nextQ, retryQuiz, showQuizHint: showHint,
    fontUp: () => changeFontSize(1), fontDown: () => changeFontSize(-1), setFontSize: applyFontSize
  };
  
  /* ═══════════════════════════════════════════════════════════════
   CS Level 5 · Digital Garden · garden_additions.js v1.0
   ─────────────────────────────────────────────────────────────
   HOW TO INTEGRATE:
   Option A (Recommended): Append this entire file to garden.js
     before the closing `})();` of the IIFE.
     Then expose the new public methods in the window.Garden object.
   
   Option B: Include as a separate script AFTER garden.js:
     <script src="../assets/garden.js"></script>
     <script src="../assets/garden_additions.js"></script>
   
   Adds:
   - Essay Q&A Engine (reads from #essay-data JSON block)
   - Review-page multi-quiz support
   - Essay score tracking + persistence
   ═══════════════════════════════════════════════════════════════ */

;(function() {
  'use strict';

  /* ─── Helpers ───────────────────────────────────────────────── */
  function getLang() {
    return document.documentElement.getAttribute('lang') || 'ar';
  }

  function essayKey() {
    const s = document.documentElement.getAttribute('data-subject') || 'XX';
    const p = document.documentElement.getAttribute('data-page')    || 'review';
    const t = document.documentElement.getAttribute('data-review-type') || 'mid';
    return `garden_${s}_${p}_${t}_essays`;
  }

  function loadEssayProgress() {
    try { return JSON.parse(sessionStorage.getItem(essayKey())) || {}; } catch(e) { return {}; }
  }

  function saveEssayProgress(state) {
    try { sessionStorage.setItem(essayKey(), JSON.stringify(state)); } catch(e) {}
  }

  /* ─── i18n additions ────────────────────────────────────────── */
  const essayI18n = {
    ar: {
      'essay.title':         '📝 أسئلة المقالي',
      'essay.score':         'نقاطك:',
      'essay.write':         'اكتب إجابتك هنا...',
      'essay.reveal':        '👁️ أظهر الإجابة النموذجية',
      'essay.answer_label':  '✍️ الإجابة النموذجية',
      'essay.grade_prompt':  'قيّم إجابتك:',
      'essay.correct':       '✅ أجبت صحيح',
      'essay.wrong':         '❌ لم أتذكر',
      'essay.q_num':         'سؤال',
      'essay.module':        'وحدة',
    },
    en: {
      'essay.title':         '📝 Essay Questions',
      'essay.score':         'Score:',
      'essay.write':         'Write your answer here...',
      'essay.reveal':        '👁️ Show Model Answer',
      'essay.answer_label':  '✍️ Model Answer',
      'essay.grade_prompt':  'Rate your answer:',
      'essay.correct':       '✅ I got it right',
      'essay.wrong':         '❌ I missed it',
      'essay.q_num':         'Q',
      'essay.module':        'Module',
    }
  };

  function t(key) {
    const L = getLang();
    return essayI18n[L]?.[key] || essayI18n.ar[key] || key;
  }

  /* ═══ ESSAY ENGINE ═══════════════════════════════════════════ */
  window._gardenEssay = { questions: null, state: {}, correct: 0 };

  function initEssayEngine() {
    const el = document.getElementById('essay-data');
    if (!el) return;

    let questions;
    try { questions = JSON.parse(el.textContent); }
    catch(e) { console.warn('[Garden Essay] Failed to parse essay-data:', e); return; }

    if (!Array.isArray(questions) || questions.length === 0) return;

    window._gardenEssay.questions = questions;
    window._gardenEssay.state     = loadEssayProgress();

    // Restore correct count from saved state
    window._gardenEssay.correct = Object.values(window._gardenEssay.state)
      .filter(v => v === 1).length;

    renderEssaySection();
  }

  function renderEssaySection() {
    const container = document.getElementById('essay-container');
    if (!container) return;

    const questions  = window._gardenEssay.questions;
    const state      = window._gardenEssay.state;
    const L          = getLang();

    // Update total count
    const totalEl = document.getElementById('essay-total');
    if (totalEl) totalEl.textContent = questions.length;

    // Update score display
    updateEssayScoreUI();

    // Render each essay item
    container.innerHTML = questions.map((q, i) => {
      const graded     = state[i];
      const wasRevealed = graded !== undefined;
      const isCorrect  = graded === 1;
      const borderColor = !wasRevealed ? 'var(--brand-500)' : isCorrect ? '#10b981' : '#ef4444';

      const questionText = q.question?.[L] || q.question?.ar || '';
      const answerText   = q.answer?.[L]   || q.answer?.ar   || '';
      const moduleNum    = q.module || '?';

      return `
<div class="essay-item glass-card" id="essay-item-${i}"
     data-graded="${graded !== undefined ? graded : ''}"
     style="border-inline-start-color:${borderColor}">
  <div class="essay-item-header">
    <span class="module-chip">${t('essay.module')} ${moduleNum}</span>
    <span style="font-size:0.8rem;font-weight:800;color:var(--text-muted)">#${i+1}</span>
    ${wasRevealed ? `<span style="font-size:0.8rem;font-weight:700;color:${isCorrect?'#10b981':'#ef4444'}">
      ${isCorrect ? '✅' : '❌'}
    </span>` : ''}
  </div>

  <div class="essay-question-text" data-bilingual>
    <template class="content-ar">${q.question?.ar || ''}</template>
    <template class="content-en">${q.question?.en || ''}</template>
    <div class="content-target">${questionText}</div>
  </div>

  <textarea class="essay-textarea" id="essay-ta-${i}"
    placeholder="${t('essay.write')}"
    rows="4">${state['ta_' + i] || ''}</textarea>

  <button class="essay-reveal-btn ${wasRevealed ? 'hidden' : ''}"
          id="essay-reveal-${i}" onclick="Garden.revealEssay(${i})">
    ${t('essay.reveal')}
  </button>

  <div class="essay-answer-box ${wasRevealed ? '' : 'hidden'}" id="essay-answer-${i}">
    <span class="essay-answer-label">${t('essay.answer_label')}</span>
    <div data-bilingual>
      <template class="content-ar">${q.answer?.ar || ''}</template>
      <template class="content-en">${q.answer?.en || ''}</template>
      <div class="content-target">${answerText}</div>
    </div>

    <div class="essay-grade-bar" id="essay-grade-bar-${i}">
      <span class="essay-grade-label">${t('essay.grade_prompt')}</span>
      <button class="essay-grade-btn essay-grade-btn--correct ${graded===1?'active':''}"
              id="essay-grade-correct-${i}"
              onclick="Garden.gradeEssay(${i}, 1)"
              ${wasRevealed ? 'disabled' : ''}>
        ${t('essay.correct')}
      </button>
      <button class="essay-grade-btn essay-grade-btn--wrong ${graded===0?'active':''}"
              id="essay-grade-wrong-${i}"
              onclick="Garden.gradeEssay(${i}, 0)"
              ${wasRevealed ? 'disabled' : ''}>
        ${t('essay.wrong')}
      </button>
    </div>
  </div>
</div>`;
    }).join('');

    // Save textarea content on blur
    questions.forEach((_, i) => {
      const ta = document.getElementById(`essay-ta-${i}`);
      if (ta) {
        ta.addEventListener('blur', () => {
          window._gardenEssay.state['ta_' + i] = ta.value;
          saveEssayProgress(window._gardenEssay.state);
        });
      }
    });
  }

  function revealEssay(idx) {
    const L = getLang();
    const q = window._gardenEssay.questions?.[idx];
    if (!q) return;

    // Hide reveal button, show answer box
    document.getElementById(`essay-reveal-${idx}`)?.classList.add('hidden');
    document.getElementById(`essay-answer-${idx}`)?.classList.remove('hidden');

    // Save textarea value before reveal
    const ta = document.getElementById(`essay-ta-${idx}`);
    if (ta) {
      window._gardenEssay.state['ta_' + idx] = ta.value;
    }
    saveEssayProgress(window._gardenEssay.state);
  }

  function gradeEssay(idx, correct) {
    const was = window._gardenEssay.state[idx];

    // Update correct count
    if (was === 1) window._gardenEssay.correct--;
    if (correct)  window._gardenEssay.correct++;

    // Save state
    window._gardenEssay.state[idx] = correct;
    saveEssayProgress(window._gardenEssay.state);

    // Update item border & appearance
    const item = document.getElementById(`essay-item-${idx}`);
    if (item) {
      item.style.borderInlineStartColor = correct ? '#10b981' : '#ef4444';
      item.setAttribute('data-graded', correct);
    }

    // Disable + style grade buttons
    const btnCorrect = document.getElementById(`essay-grade-correct-${idx}`);
    const btnWrong   = document.getElementById(`essay-grade-wrong-${idx}`);
    [btnCorrect, btnWrong].forEach(b => { if (b) { b.disabled = true; b.classList.remove('active'); } });
    if (correct && btnCorrect) btnCorrect.classList.add('active');
    if (!correct && btnWrong)  btnWrong.classList.add('active');

    updateEssayScoreUI();
  }

  function updateEssayScoreUI() {
    const scoreEl = document.getElementById('essay-score');
    if (scoreEl) scoreEl.textContent = window._gardenEssay.correct;
    const totalEl = document.getElementById('essay-total');
    if (totalEl) totalEl.textContent = window._gardenEssay.questions?.length || 0;
  }

  function refreshEssayLanguage() {
    // Re-render the whole essay section when language changes
    if (!window._gardenEssay.questions) return;
    const L = getLang();

    // Update textareas direction
    document.querySelectorAll('.essay-textarea').forEach(ta => {
      ta.setAttribute('dir', L === 'ar' ? 'rtl' : 'ltr');
      ta.style.direction  = L === 'ar' ? 'rtl' : 'ltr';
      ta.style.textAlign  = L === 'ar' ? 'right' : 'left';
      ta.placeholder      = t('essay.write');
    });

    // Update grade button labels
    window._gardenEssay.questions.forEach((_, i) => {
      const bc = document.getElementById(`essay-grade-correct-${i}`);
      const bw = document.getElementById(`essay-grade-wrong-${i}`);
      if (bc) bc.textContent = t('essay.correct');
      if (bw) bw.textContent = t('essay.wrong');
      const rb = document.getElementById(`essay-reveal-${i}`);
      if (rb) rb.textContent = t('essay.reveal');
    });

    // Update labels
    document.querySelectorAll('.essay-grade-label').forEach(el => {
      el.textContent = t('essay.grade_prompt');
    });
    document.querySelectorAll('.essay-answer-label').forEach(el => {
      el.textContent = t('essay.answer_label');
    });
    updateEssayScoreUI();
  }

  /* ─── Patch Garden.setLanguage to also update essay ─────────── */
  function patchLanguageToggle() {
    const orig = window.Garden?.setLanguage;
    if (!orig) return;
    window.Garden.setLanguage = function(lang) {
      orig(lang);
      setTimeout(refreshEssayLanguage, 60);
    };

    const origToggle = window.Garden?.toggleLanguage;
    if (origToggle) {
      window.Garden.toggleLanguage = function() {
        origToggle();
        setTimeout(refreshEssayLanguage, 60);
      };
    }
  }

  /* ─── Init ───────────────────────────────────────────────────── */
  function initAdditions() {
    initEssayEngine();
    patchLanguageToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdditions);
  } else {
    initAdditions();
  }

  /* ─── Extend Public API ──────────────────────────────────────── */
  if (!window.Garden) window.Garden = {};
  window.Garden.revealEssay   = revealEssay;
  window.Garden.gradeEssay    = gradeEssay;
  window.Garden.refreshEssays = renderEssaySection;

})();
})();

