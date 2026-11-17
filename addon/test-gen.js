/* Auto Gen add-on v1 for CAT v2.7.52 (locked)
 * Usage: in a COPY of v2.7.52, add ONE line right before </body>:
 *   <script src="auto-gen-addon-v1.js"></script>
 * Put this file next to that copy. If it breaks, delete that one line
 * and you are back to working v2.7.52.
 * It never edits the base app. It only injects an "Auto Gen" card
 * next to "Quiz Blitz" on the Games page, and opens its own setup modal.
 * v1 = card + setup only. START just confirms the setup was captured.
 * The full test engine (no LIVES, no Hint, Take Test-style play)
 * comes in v2, on top of this same card.
 */
(function () {
  if (window.__AUTO_GEN_ADDON_LOADED) return;
  window.__AUTO_GEN_ADDON_LOADED = true;

  var CSS = ''
    + '#ag-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;display:none;align-items:center;justify-content:center;padding:16px}'
    + '#ag-overlay.open{display:flex}'
    + '#ag-modal{background:#fff;color:#0F172A;border-radius:16px;max-width:520px;width:100%;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35);max-height:90vh;overflow:auto}'
    + '#ag-modal h2{margin:0 0 4px;font-size:20px}'
    + '#ag-modal p.sub{margin:0 0 16px;color:#64748B;font-size:13px}'
    + '.ag-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #E2E8F0}'
    + '.ag-row label{font-weight:600}'
    + '.ag-row input[type=number]{width:90px;padding:8px 10px;border:1px solid #CBD5E1;border-radius:8px;font-size:15px}'
    + '.ag-total{font-weight:800;padding:12px 0 4px}'
    + '.ag-opts{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}'
    + '.ag-opts label{display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #CBD5E1;border-radius:999px;cursor:pointer;font-weight:600;font-size:13px;background:#F8FAFC}'
    + '.ag-opts label.checked{background:#0F172A;color:#fff;border-color:#0F172A}'
    + '.ag-opts input{accent-color:#0F172A}'
    + '#ag-status{font-size:12px;color:#64748B;margin:8px 0 0}'
    + '#ag-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#0F172A;color:#fff;padding:10px 16px;border-radius:999px;font-size:13px;font-weight:600;z-index:9999;display:none;box-shadow:0 10px 30px rgba(0,0,0,.3)}'
    + '#auto-gen-card{cursor:pointer}';
  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  function normalize(s) { return (s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

  function isGamesList() {
    // Games list has Quiz Blitz card, but NOT the Quiz Blitz lobby.
    var body = document.body ? document.body.innerText || '' : '';
    if (!body) return false;
    if (body.indexOf('Quiz Blitz') < 0) return false;
    if (body.indexOf('Start Quiz Blitz') >= 0) return false;
    if (body.indexOf('LIVES') >= 0 && body.indexOf('Quit Game') >= 0) return false;
    return true;
  }

  function findQuizCard() {
    // Find the most likely Games-list card for Quiz Blitz.
    var candidates = [];
    var all = document.querySelectorAll('div, section, article, li, button, a');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.id === 'auto-gen-card') continue;
      var txt = el.textContent || '';
      if (txt.indexOf('Quiz Blitz') < 0) continue;
      // Score: prefer small elements that directly contain the title,
      // then walk up to a card-like container.
      var score = 0;
      if (el.children.length <= 5) score += 3;
      if (txt.length < 600) score += 2;
      if (/button|card/i.test(el.className || '')) score += 2;
      candidates.push({ el: el, score: score, len: txt.length });
    }
    if (!candidates.length) return null;
    candidates.sort(function (a, b) { return (b.score - a.score) || (a.len - b.len); });
    var titleEl = candidates[0].el;
    // Walk up to find the card: parent that looks like a card / grid item
    // and still contains only this one game (not the whole page).
    var node = titleEl;
    for (var d = 0; d < 6; d++) {
      var p = node.parentElement;
      if (!p) break;
      var ptxt = p.textContent || '';
      // Card should contain Quiz Blitz once, plus a description/button,
      // but not the whole Games page (which would be very long).
      if (ptxt.length > 80 && ptxt.length < 1200 && ptxt.indexOf('Quiz Blitz') >= 0) {
        // If parent is a grid / list that holds BOTH games, stop one level down.
        var parentStyle = window.getComputedStyle ? window.getComputedStyle(p) : null;
        var isGrid = parentStyle && (parentStyle.display === 'grid' || parentStyle.display === 'flex');
        if (isGrid && p.children.length > 1) return node;
        node = p;
        // If this node itself looks like a card (border / background / padding),
        // keep it as candidate and keep walking one more level to check grid.
        continue;
      }
      break;
    }
    return node;
  }

  function replaceText(node, fromRe, toStr) {
    for (var i = 0; i < node.childNodes.length; i++) {
      var ch = node.childNodes[i];
      if (ch.nodeType === 3) {
        if (fromRe.test(ch.nodeValue)) ch.nodeValue = ch.nodeValue.replace(fromRe, toStr);
      } else if (ch.nodeType === 1) {
        replaceText(ch, fromRe, toStr);
      }
    }
  }

  function ensureModal() {
    var existing = document.getElementById('ag-overlay');
    if (existing) return existing;
    var ov = document.createElement('div');
    ov.id = 'ag-overlay';
    ov.innerHTML = ''
      + '<div id="ag-modal" role="dialog" aria-modal="true" aria-labelledby="ag-title">'
      + '<h2 id="ag-title">🤖 Auto Gen</h2>'
      + '<p class="sub">Build your own test — pick how many questions and difficulty, no lives, no hints, just like Take Test.</p>'
      + '<div class="ag-row"><label for="ag-easy">Easy</label><input id="ag-easy" type="number" min="0" max="50" value="2"></div>'
      + '<div class="ag-row"><label for="ag-med">Medium</label><input id="ag-med" type="number" min="0" max="50" value="3"></div>'
      + '<div class="ag-row"><label for="ag-hard">Hard</label><input id="ag-hard" type="number" min="0" max="50" value="1"></div>'
      + '<div class="ag-total" id="ag-total">Total: 6 questions</div>'
      + '<div class="ag-opts" id="ag-modes">'
      + '<label><input type="radio" name="ag-mode" value="FAST"> FAST (30s/q)</label>'
      + '<label class="checked"><input type="radio" name="ag-mode" value="NORMAL" checked> NORMAL (60s/q)</label>'
      + '<label><input type="radio" name="ag-mode" value="EASY"> EASY (No Timer)</label>'
      + '</div>'
      + '<p id="ag-status">v1 — setup only. START confirms your setup. Full Take Test-style play comes in v2.</p>'
      + '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">'
      + '<button id="ag-cancel" type="button" style="padding:10px 16px;border:1px solid #CBD5E1;border-radius:10px;background:#fff;cursor:pointer;font-weight:600">Cancel</button>'
      + '<button id="ag-start" type="button" style="padding:10px 18px;border:none;border-radius:10px;background:#0F172A;color:#fff;cursor:pointer;font-weight:700">START</button>'
      + '</div></div>';
    document.body.appendChild(ov);
    var toast = document.createElement('div');
    toast.id = 'ag-toast';
    document.body.appendChild(toast);

    function updateTotal() {
      var e = parseInt(document.getElementById('ag-easy').value || '0', 10) || 0;
      var m = parseInt(document.getElementById('ag-med').value || '0', 10) || 0;
      var h = parseInt(document.getElementById('ag-hard').value || '0', 10) || 0;
      var t = e + m + h;
      document.getElementById('ag-total').textContent = 'Total: ' + t + ' question' + (t === 1 ? '' : 's');
      document.getElementById('ag-start').disabled = (t === 0);
      document.getElementById('ag-start').style.opacity = (t === 0) ? '0.4' : '1';
    }
    ['ag-easy', 'ag-med', 'ag-hard'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', updateTotal);
    });
    document.querySelectorAll('#ag-modes label').forEach(function (lab) {
      lab.addEventListener('click', function () {
        document.querySelectorAll('#ag-modes label').forEach(function (l) { l.classList.remove('checked'); });
        lab.classList.add('checked');
      });
    });
    document.getElementById('ag-cancel').addEventListener('click', closeModal);
    ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
    document.getElementById('ag-start').addEventListener('click', function () {
      var e = parseInt(document.getElementById('ag-easy').value || '0', 10) || 0;
      var m = parseInt(document.getElementById('ag-med').value || '0', 10) || 0;
      var h = parseInt(document.getElementById('ag-hard').value || '0', 10) || 0;
      var mode = (document.querySelector('input[name="ag-mode"]:checked') || {}).value || 'NORMAL';
      closeModal();
      showToast('Auto Gen setup captured — Easy ' + e + ' · Medium ' + m + ' · Hard ' + h + ' · ' + mode + '. Full play comes in v2.');
      window.__AUTO_GEN_LAST_SETUP = { easy: e, medium: m, hard: h, total: e + m + h, mode: mode };
    });
    updateTotal();
    return ov;
  }
  function openModal() { ensureModal().classList.add('open'); }
  function closeModal() { var ov = document.getElementById('ag-overlay'); if (ov) ov.classList.remove('open'); }
  function showToast(msg) {
    var t = document.getElementById('ag-toast');
    if (!t) return;
    t.textContent = msg;
    t.style.display = 'block';
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.style.display = 'none'; }, 4000);
  }

  function tryInject() {
    if (!isGamesList()) return false;
    if (document.getElementById('auto-gen-card')) return true;
    var quizCard = findQuizCard();
    if (!quizCard || !quizCard.parentElement) return false;
    // Don't inject if the card we found is the whole page / body.
    if (quizCard === document.body || quizCard.parentElement === document.body) return false;

    var clone = quizCard.cloneNode(true);
    clone.id = 'auto-gen-card';
    // Remove React / framework ids that could confuse re-renders.
    clone.removeAttribute('data-testid');
    // Rewrite title / description / icon.
    replaceText(clone, /Quiz Blitz/g, 'Auto Gen');
    replaceText(clone, /⚡/g, '🤖');
    // Replace any description that mentions lives / hints / blitz.
    var descs = clone.querySelectorAll('p, span, div');
    for (var i = 0; i < descs.length; i++) {
      var el = descs[i];
      // Only leaf-ish nodes with short text, to avoid rewriting the whole card.
      if (el.children.length === 0 && el.textContent) {
        var t = el.textContent;
        if (/lives|hint|blitz|fast.*quiz/i.test(t) && t.length < 300) {
          el.textContent = 'Build your own test — pick how many questions and difficulty, no lives, no hints, just like Take Test.';
        }
      }
    }
    // Ensure there is a visible title if the clone lost it.
    if (clone.textContent.indexOf('Auto Gen') < 0) {
      var h = document.createElement('div');
      h.style.fontWeight = '700';
      h.style.fontSize = '18px';
      h.textContent = '🤖 Auto Gen';
      clone.prepend(h);
    }
    // Click opens our setup, not Quiz Blitz.
    clone.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openModal();
    }, true);
    // Also intercept clicks on inner buttons/links.
    var inners = clone.querySelectorAll('button, a');
    for (var j = 0; j < inners.length; j++) {
      inners[j].addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      }, true);
    }
    quizCard.parentElement.insertBefore(clone, quizCard.nextSibling);
    return true;
  }

  // Re-try because CAT is a SPA: Games page mounts after nav clicks.
  function scan() { tryInject(); }
  setInterval(scan, 800);
  var mo = new MutationObserver(function () { scan(); });
  if (document.body) mo.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', function () { setTimeout(scan, 300); }, true);
  window.addEventListener('hashchange', function () { setTimeout(scan, 300); });
  document.addEventListener('DOMContentLoaded', scan);
  setTimeout(scan, 500);
  setTimeout(scan, 1500);
})();
