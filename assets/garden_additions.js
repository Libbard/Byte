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
