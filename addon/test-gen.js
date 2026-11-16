/* Test Generator add-on for CAT v2.7.57 (locked)
 * Usage: add ONE line to a COPY of v2.7.57, right before </body>:
 *   <script src="test-gen-addon.js"></script>
 * If it breaks, delete that one line and you are back to working v2.7.57.
 * It never edits the base app. It injects a "Test Gen" button before
 * "Favorites" on the Take Test page, opens its own modal, and runs its
 * own test runner overlay. Questions come from the app's existing
 * data-loading path (the same manifest the app already fetches),
 * never from a direct folder fetch.
 */
(function () {
  if (window.__TG_ADDON_LOADED) return;
  window.__TG_ADDON_LOADED = true;

  var CSS = ''
    + '#tg-add-on-btn{cursor:pointer}'
    + '#tg-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);z-index:9998;display:none;align-items:center;justify-content:center;padding:16px}'
    + '#tg-overlay.open{display:flex}'
    + '#tg-modal{background:#fff;color:#0F172A;border-radius:16px;max-width:520px;width:100%;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.35);max-height:90vh;overflow:auto}'
    + '#tg-modal h2{margin:0 0 4px;font-size:20px}'
    + '#tg-modal p.sub{margin:0 0 16px;color:#64748B;font-size:13px}'
    + '.tg-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 0;border-bottom:1px solid #E2E8F0}'
    + '.tg-row label{font-weight:600}'
    + '.tg-row input[type=number]{width:90px;padding:8px 10px;border:1px solid #CBD5E1;border-radius:8px;font-size:15px}'
    + '.tg-total{font-weight:800;padding:12px 0 4px}'
    + '.tg-opts{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}'
    + '.tg-opts label{display:flex;align-items:center;gap:7px;padding:8px 12px;border:1px solid #CBD5E1;border-radius:999px;cursor:pointer;font-weight:600;font-size:13px;background:#F8FAFC}'
    + '.tg-opts label.checked{background:#0F172A;color:#fff;border-color:#0F172A}'
    + '.tg-opts input{accent-color:#0F172A}'
    + '#tg-status{font-size:12px;color:#64748B;margin:8px 0;min-height:18px}'
    + '.tg-btns{display:flex;gap:10px;justify-content:flex-end;margin-top:12px}'
    + '.tg-btns button{padding:10px 16px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;cursor:pointer;font-weight:700}'
    + '#tg-start{background:#0F172A;color:#fff;border-color:#0F172A}'
    + '#tg-start:disabled{opacity:.45;cursor:not-allowed}'
    + '#tg-runner{position:fixed;inset:0;background:#F8FAFC;color:#0F172A;z-index:9999;display:none;flex-direction:column}'
    + '#tg-runner.open{display:flex}'
    + '#tg-run-head{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:14px 18px;background:#fff;border-bottom:1px solid #E2E8F0;flex-wrap:wrap}'
    + '#tg-run-head b{font-size:16px}'
    + '#tg-run-body{padding:20px;max-width:760px;width:100%;margin:0 auto;overflow:auto;flex:1}'
    + '#tg-run-body h3{font-size:18px;line-height:1.5;margin:0 0 12px}'
    + '#tg-passage{background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:14px;margin:0 0 14px;line-height:1.6;white-space:pre-wrap}'
    + '.tg-opt{display:block;width:100%;text-align:left;padding:12px 14px;margin:0 0 8px;background:#fff;border:1px solid #CBD5E1;border-radius:10px;cursor:pointer}'
    + '.tg-opt.selected{background:#0F172A;color:#fff;border-color:#0F172A}'
    + '.tg-seg{display:inline-block;padding:2px 5px;margin:2px 3px;border-radius:8px;border:1px solid transparent;cursor:pointer;background:#fff}'
    + '.tg-seg.selected{background:rgba(255,232,204,.2);border:1px solid #F59E0B}'
    + '.tg-seg .idx{font-size:.85em;opacity:.7;margin-right:4px}'
    + '.tg-corr{width:100%;padding:8px 10px;margin:6px 0 12px;border:1px solid #F59E0B;border-radius:8px}'
    + '.tg-token{display:inline-block;padding:4px 7px;margin:2px;border:1px solid #CBD5E1;border-radius:8px;cursor:pointer;background:#fff}'
    + '.tg-token.selected{background:#FEE2E2;border-color:#EF4444}'
    + '#tg-run-foot{display:flex;gap:10px;justify-content:space-between;padding:14px 18px;background:#fff;border-top:1px solid #E2E8F0}'
    + '#tg-run-foot button{padding:10px 16px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;cursor:pointer;font-weight:700}'
    + '#tg-submit{background:#0F172A;color:#fff;border-color:#0F172A}'
    + '.tg-result{margin:0 0 10px;padding:12px;background:#fff;border:1px solid #E2E8F0;border-radius:10px}'
    + '.tg-result.good{border-color:#22C55E}'
    + '.tg-result.bad{border-color:#EF4444}';

  function injectCSS() {
    if (document.getElementById('tg-addon-css')) return;
    var s = document.createElement('style');
    s.id = 'tg-addon-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function textOf(q) {
    return q.question || q.text || q.stem || q.prompt || q.title || '(No question text)';
  }
  function passageOf(q) {
    return q.passage || q.context || q.reading || q.story || '';
  }
  function difficultyOf(q) {
    var raw = '';
    if (q.meta && q.meta.level != null) raw = String(q.meta.level);
    else if (q.level != null) raw = String(q.level);
    else if (q.difficulty != null) raw = String(q.difficulty);
    else if (q.meta && q.meta.difficulty != null) raw = String(q.meta.difficulty);
    raw = raw.toLowerCase().trim();
    if (raw === '1' || raw === 'easy' || raw === 'beginner' || raw === 'a1' || raw === 'a2') return 'Easy';
    if (raw === '3' || raw === 'hard' || raw === 'advanced' || raw === 'difficult' || raw === 'c1' || raw === 'c2') return 'Hard';
    return 'Medium';
  }
  function normalize(v) { return String(v == null ? '' : v).trim().toLowerCase(); }
  function shuffle(a) {
    var arr = a.slice();
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }
  function asArray(x) {
    if (!x) return [];
    if (Array.isArray(x)) return x;
    if (Array.isArray(x.questions)) return x.questions;
    if (Array.isArray(x.data)) return x.data;
    if (Array.isArray(x.items)) return x.items;
    return [x];
  }

  /* --- Load via the app's existing data-loading path --- */
  async function loadPool(statusEl) {
    // 1) Already-loaded pool, if the app exposes it
    var candidates = [];
    if (Array.isArray(window.__CAT_QUESTIONS)) candidates = candidates.concat(window.__CAT_QUESTIONS);
    if (window.__CAT__ && Array.isArray(window.__CAT__.questions)) candidates = candidates.concat(window.__CAT__.questions);
    if (candidates.length) return { pool: candidates, source: 'app question pool' };

    // 2) Same manifest the app already fetches on startup
    var manifestUrls = ['./data/questions-manifest.json', 'data/questions-manifest.json', './data/questions-manifest.json?x=' + Date.now()];
    for (var mi = 0; mi < manifestUrls.length; mi++) {
      try {
        if (statusEl) statusEl.textContent = 'Loading via app manifest…';
        var res = await fetch(manifestUrls[mi]);
        if (!res.ok) continue;
        var man = await res.json();
        var entries = [];
        if (Array.isArray(man)) entries = man;
        else if (Array.isArray(man.files)) entries = man.files;
        else if (Array.isArray(man.tests)) entries = man.tests;
        else if (Array.isArray(man.manifest)) entries = man.manifest;
        else if (man && typeof man === 'object') {
          // manifest may be { "testName": "path", ... } or { questions: [...] }
          if (Array.isArray(man.questions)) return { pool: man.questions, source: 'app manifest' };
          Object.keys(man).forEach(function (k) { if (typeof man[k] === 'string') entries.push(man[k]); });
        }
        if (!entries.length) continue;
        var pool = [];
        for (var ei = 0; ei < entries.length; ei++) {
          var e = entries[ei];
          var url = typeof e === 'string' ? e : (e.path || e.file || e.url || '');
          if (!url) continue;
          try {
            var r = await fetch(url);
            if (!r.ok) continue;
            var j = await r.json();
            pool = pool.concat(asArray(j));
          } catch (err) { /* skip one bad file */ }
        }
        if (pool.length) return { pool: pool, source: 'app manifest (' + pool.length + ' questions)' };
      } catch (err) { /* try next manifest URL */ }
    }
    // 3) Last resort: look for questions already in the page
    var scripts = document.querySelectorAll('script');
    for (var si = 0; si < scripts.length; si++) {
      var txt = scripts[si].textContent || '';
      var m = txt.match(/"questions"\s*:\s*\[/);
      if (m) { try { var parsed = JSON.parse(txt.slice(txt.indexOf('{'))); if (parsed && parsed.questions) return { pool: parsed.questions, source: 'page data' }; } catch (e) {} }
    }
    return { pool: [], source: 'none' };
  }

  /* --- UI: button + modal --- */
  function buildUI() {
    injectCSS();
    if (document.getElementById('tg-overlay')) return;

    var overlay = document.createElement('div');
    overlay.id = 'tg-overlay';
    overlay.innerHTML =
      '<div id="tg-modal" role="dialog" aria-modal="true">'
      + '<h2>Test Generator</h2>'
      + '<p class="sub">Choose how many questions for each difficulty, then START.</p>'
      + '<div class="tg-row"><label>Easy</label><input id="tg-count-Easy" type="number" min="0" max="50" value="0"></div>'
      + '<div class="tg-row"><label>Medium</label><input id="tg-count-Medium" type="number" min="0" max="50" value="0"></div>'
      + '<div class="tg-row"><label>Hard</label><input id="tg-count-Hard" type="number" min="0" max="50" value="0"></div>'
      + '<div class="tg-total" id="tg-total">Total: 0 questions</div>'
      + '<div class="tg-opts">'
      + '<label><input type="checkbox" id="tg-opt-FAST"> FAST</label>'
      + '<label class="checked"><input type="checkbox" id="tg-opt-NORMAL" checked> NORMAL</label>'
      + '<label><input type="checkbox" id="tg-opt-EASY"> EASY</label>'
      + '</div>'
      + '<div id="tg-status">Source: —</div>'
      + '<div class="tg-btns"><button id="tg-cancel" type="button">Cancel</button><button id="tg-start" type="button" disabled>START</button></div>'
      + '</div>';
    document.body.appendChild(overlay);

    var runner = document.createElement('div');
    runner.id = 'tg-runner';
    runner.innerHTML =
      '<div id="tg-run-head"><b id="tg-run-title">Test Generator</b><span id="tg-run-timer"></span><button id="tg-run-close" type="button">✕ End test</button></div>'
      + '<div id="tg-run-body"></div>'
      + '<div id="tg-run-foot"><button id="tg-prev" type="button">← Prev</button><span id="tg-run-progress"></span><button id="tg-next" type="button">Next →</button><button id="tg-submit" type="button">Submit</button></div>';
    document.body.appendChild(runner);

    // Single-choice checkboxes, styled like No Timer / Random / No Idx
    ['FAST', 'NORMAL', 'EASY'].forEach(function (name) {
      var cb = document.getElementById('tg-opt-' + name);
      cb.addEventListener('change', function () {
        if (!cb.checked) { cb.checked = true; return; }
        ['FAST', 'NORMAL', 'EASY'].forEach(function (other) {
          var o = document.getElementById('tg-opt-' + other);
          o.checked = (other === name);
          o.closest('label').classList.toggle('checked', o.checked);
        });
      });
    });
    function updateTotal() {
      var t = 0;
      ['Easy', 'Medium', 'Hard'].forEach(function (d) {
        t += parseInt(document.getElementById('tg-count-' + d).value || '0', 10) || 0;
      });
      document.getElementById('tg-total').textContent = 'Total: ' + t + ' questions';
      document.getElementById('tg-start').disabled = (t <= 0);
    }
    ['Easy', 'Medium', 'Hard'].forEach(function (d) {
      document.getElementById('tg-count-' + d).addEventListener('input', updateTotal);
    });
    document.getElementById('tg-cancel').addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closeModal(); });
    document.getElementById('tg-start').addEventListener('click', startTest);
    document.getElementById('tg-run-close').addEventListener('click', closeRunner);
    document.getElementById('tg-prev').addEventListener('click', function () { goTo(state.idx - 1); });
    document.getElementById('tg-next').addEventListener('click', function () { goTo(state.idx + 1); });
    document.getElementById('tg-submit').addEventListener('click', submitTest);
  }

  function openModal() {
    buildUI();
    document.getElementById('tg-overlay').classList.add('open');
    var status = document.getElementById('tg-status');
    status.textContent = 'Loading via app manifest…';
    loadPool(status).then(function (res) {
      state.pool = res.pool;
      status.textContent = res.pool.length
        ? 'Source: ' + res.source + ' — ' + res.pool.length + ' questions available'
        : 'Source: could not load app pool. Open a test first, then try again.';
      // Hint about availability per difficulty
      var counts = { Easy: 0, Medium: 0, Hard: 0 };
      res.pool.forEach(function (q) { counts[difficultyOf(q)]++; });
      status.textContent += '  (Easy ' + counts.Easy + ' · Medium ' + counts.Medium + ' · Hard ' + counts.Hard + ')';
    });
  }
  function closeModal() {
    var o = document.getElementById('tg-overlay');
    if (o) o.classList.remove('open');
  }
  function closeRunner() {
    var r = document.getElementById('tg-runner');
    if (r) r.classList.remove('open');
    stopTimer();
  }

  /* --- Inject button before Favorites --- */
  function ensureButton() {
    buildUI();
    if (document.getElementById('tg-add-on-btn')) return true;
    var fav = null;
    var btns = Array.prototype.slice.call(document.querySelectorAll('button'));
    for (var i = 0; i < btns.length; i++) {
      if (normalize(btns[i].textContent) === 'favorites' || normalize(btns[i].textContent) === 'favourites') { fav = btns[i]; break; }
    }
    if (!fav) return false;
    // Only inject on Take Test page: header should be near a Take Test heading / test area
    var btn = document.createElement('button');
    btn.id = 'tg-add-on-btn';
    btn.type = 'button';
    btn.textContent = 'Test Gen';
    btn.className = fav.className || '';
    // If Favorites has no class (unstyled), give it a visible fallback
    if (!btn.className) {
      btn.style.cssText = 'padding:8px 12px;border-radius:10px;border:1px solid #CBD5E1;background:#fff;cursor:pointer;font-weight:700;margin-right:8px';
    } else {
      btn.style.marginRight = '8px';
    }
    btn.addEventListener('click', openModal);
    fav.parentNode.insertBefore(btn, fav);
    return true;
  }

  /* --- Runner state --- */
  var state = { pool: [], picked: [], answers: {}, idx: 0, mode: 'NORMAL', timerId: null, secondsLeft: 0 };
  function stopTimer() { if (state.timerId) { clearInterval(state.timerId); state.timerId = null; } }
  function modeOf() {
    if (document.getElementById('tg-opt-FAST').checked) return 'FAST';
    if (document.getElementById('tg-opt-EASY').checked) return 'EASY';
    return 'NORMAL';
  }
  function startTest() {
    var wants = {
      Easy: parseInt(document.getElementById('tg-count-Easy').value || '0', 10) || 0,
      Medium: parseInt(document.getElementById('tg-count-Medium').value || '0', 10) || 0,
      Hard: parseInt(document.getElementById('tg-count-Hard').value || '0', 10) || 0
    };
    var total = wants.Easy + wants.Medium + wants.Hard;
    if (!total) return;
    if (!state.pool.length) {
      document.getElementById('tg-status').textContent = 'No questions loaded yet. Open a test first, then try again.';
      return;
    }
    var buckets = { Easy: [], Medium: [], Hard: [] };
    state.pool.forEach(function (q) { buckets[difficultyOf(q)].push(q); });
    var picked = [];
    var notes = [];
    ['Easy', 'Medium', 'Hard'].forEach(function (d) {
      var n = wants[d];
      if (!n) return;
      var avail = shuffle(buckets[d]);
      if (avail.length < n) notes.push('Only ' + avail.length + ' ' + d + ' available');
      picked = picked.concat(avail.slice(0, n));
    });
    if (!picked.length) {
      document.getElementById('tg-status').textContent = 'No questions matched those difficulties.';
      return;
    }
    state.picked = shuffle(picked);
    state.answers = {};
    state.idx = 0;
    state.mode = modeOf();
    closeModal();
    var runner = document.getElementById('tg-runner');
    runner.classList.add('open');
    document.getElementById('tg-run-title').textContent = 'Test Generator — ' + state.mode + (notes.length ? ' · ' + notes.join(' · ') : '');
    var perQ = state.mode === 'FAST' ? 30 : state.mode === 'NORMAL' ? 60 : 0;
    state.secondsLeft = perQ ? perQ * state.picked.length : 0;
    stopTimer();
    if (perQ) {
      updateTimerLabel();
      state.timerId = setInterval(function () {
        state.secondsLeft--;
        updateTimerLabel();
        if (state.secondsLeft <= 0) { stopTimer(); submitTest(); }
      }, 1000);
    } else {
      document.getElementById('tg-run-timer').textContent = 'No Timer';
    }
    goTo(0);
  }
  function updateTimerLabel() {
    var m = Math.floor(state.secondsLeft / 60);
    var s = state.secondsLeft % 60;
    document.getElementById('tg-run-timer').textContent = 'Time left ' + m + ':' + (s < 10 ? '0' + s : s);
  }
  function goTo(i) {
    if (i < 0) i = 0;
    if (i >= state.picked.length) i = state.picked.length - 1;
    state.idx = i;
    renderQuestion();
  }
  function saveAnswer(key, val) { state.answers[key] = val; }

  function renderQuestion() {
    var body = document.getElementById('tg-run-body');
    var q = state.picked[state.idx];
    if (!q) { body.innerHTML = '<p>No questions.</p>'; return; }
    document.getElementById('tg-run-progress').textContent = 'Q ' + (state.idx + 1) + ' / ' + state.picked.length;
    var html = '';
    var passage = passageOf(q);
    if (passage) html += '<div id="tg-passage">' + escapeHtml(passage) + '</div>';
    html += '<h3>' + escapeHtml(textOf(q)) + '</h3>';
    html += '<div id="tg-q-area"></div>';
    body.innerHTML = html;
    var area = document.getElementById('tg-q-area');
    var key = 'q' + state.idx;

    // multi_error: segments
    var segs = q.multiErrorSegments || q.segments || q.errors || null;
    if (Array.isArray(segs) && segs.length) {
      var saved = state.answers[key] || { selected: [], corrections: {} };
      state.answers[key] = saved;
      segs.forEach(function (seg, si) {
        var txt = typeof seg === 'string' ? seg : (seg.text || seg.word || '');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'tg-seg' + (saved.selected.indexOf(si) >= 0 ? ' selected' : '');
        btn.innerHTML = '<span class="idx">' + (si + 1) + '</span>' + escapeHtml(txt);
        btn.addEventListener('click', function () {
          var at = saved.selected.indexOf(si);
          if (at >= 0) saved.selected.splice(at, 1); else saved.selected.push(si);
          renderQuestion();
        });
        area.appendChild(btn);
        area.appendChild(document.createTextNode(' '));
        if (saved.selected.indexOf(si) >= 0) {
          var inp = document.createElement('input');
          inp.className = 'tg-corr';
          inp.placeholder = 'Correction for #' + (si + 1);
          inp.value = saved.corrections[si] || '';
          inp.addEventListener('input', function () { saved.corrections[si] = inp.value; });
          area.appendChild(inp);
        }
      });
      var hint = document.createElement('p');
      hint.style.cssText = 'color:#64748B;font-size:13px';
      hint.textContent = 'Tap a phrase to mark it as an error, then type the correction.';
      area.appendChild(hint);
      return;
    }
    // tokens / click_correct
    var tokens = q.tokens || q.words || null;
    if (Array.isArray(tokens) && tokens.length) {
      var tSaved = state.answers[key] || { selected: [] };
      state.answers[key] = tSaved;
      tokens.forEach(function (tok, ti) {
        var t = typeof tok === 'string' ? tok : (tok.text || tok.word || '');
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'tg-token' + (tSaved.selected.indexOf(ti) >= 0 ? ' selected' : '');
        b.textContent = t;
        b.addEventListener('click', function () {
          var at = tSaved.selected.indexOf(ti);
          if (at >= 0) tSaved.selected.splice(at, 1); else tSaved.selected.push(ti);
          renderQuestion();
        });
        area.appendChild(b);
      });
      var corr = document.createElement('input');
      corr.className = 'tg-corr';
      corr.placeholder = 'Correction (if any)';
      corr.value = (state.answers[key] && state.answers[key].correction) || '';
      corr.addEventListener('input', function () { state.answers[key].correction = corr.value; });
      area.appendChild(corr);
      return;
    }
    // options
    var opts = q.options || q.choices || q.answers || null;
    if (Array.isArray(opts) && opts.length) {
      var multi = !!(q.multiple || q.multiCorrect || (Array.isArray(q.correctAnswer) && q.correctAnswer.length > 1));
      var oSaved = state.answers[key];
      if (oSaved == null) oSaved = multi ? [] : -1;
      state.answers[key] = oSaved;
      opts.forEach(function (opt, oi) {
        var label = typeof opt === 'string' ? opt : (opt.text || opt.label || JSON.stringify(opt));
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'tg-opt' + ((multi ? oSaved.indexOf(oi) >= 0 : oSaved === oi) ? ' selected' : '');
        b.textContent = label;
        b.addEventListener('click', function () {
          if (multi) {
            var at = oSaved.indexOf(oi);
            if (at >= 0) oSaved.splice(at, 1); else oSaved.push(oi);
          } else {
            state.answers[key] = oi;
          }
          renderQuestion();
        });
        area.appendChild(b);
      });
      return;
    }
    // fallback: text input
    var inp = document.createElement('input');
    inp.className = 'tg-corr';
    inp.placeholder = 'Type your answer';
    inp.value = state.answers[key] || '';
    inp.addEventListener('input', function () { state.answers[key] = inp.value; });
    area.appendChild(inp);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function isCorrect(q, ans) {
    var segs = q.multiErrorSegments || q.segments || null;
    if (Array.isArray(segs) && segs.length) {
      var expected = [];
      segs.forEach(function (seg, si) { if (seg && (seg.isError || seg.error || seg.incorrect)) expected.push(si); });
      if (!expected.length && q.errorIndices) expected = q.errorIndices;
      if (!expected.length) return null;
      var sel = (ans && ans.selected) || [];
      if (sel.length !== expected.length) return false;
      var sortedSel = sel.slice().sort(function (a, b) { return a - b; });
      var sortedExp = expected.slice().sort(function (a, b) { return a - b; });
      for (var i = 0; i < sortedExp.length; i++) if (sortedSel[i] !== sortedExp[i]) return false;
      // corrections: if expected corrections exist, check them loosely
      for (var j = 0; j < expected.length; j++) {
        var seg = segs[expected[j]];
        var want = seg && (seg.correction || seg.correct || seg.fix || '');
        if (want) {
          var got = (ans.corrections && ans.corrections[expected[j]]) || '';
          if (normalize(got) !== normalize(want)) return false;
        }
      }
      return true;
    }
    var tokens = q.tokens || q.words || null;
    if (Array.isArray(tokens) && tokens.length) {
      var idx = q.incorrectIndex != null ? q.incorrectIndex : (q.meta && q.meta.incorrectIndex);
      if (idx == null) return null;
      var tSel = (ans && ans.selected) || [];
      if (tSel.length !== 1 || tSel[0] !== idx) return false;
      var wantT = q.correction || (q.meta && q.meta.correction) || '';
      if (wantT && normalize(ans.correction || '') !== normalize(wantT)) return false;
      return true;
    }
    var opts = q.options || q.choices || null;
    if (Array.isArray(opts) && opts.length) {
      var correct = q.correctAnswer != null ? q.correctAnswer : (q.correctIndex != null ? q.correctIndex : (q.answer != null ? q.answer : (q.meta && q.meta.correctAnswer)));
      if (correct == null) return null;
      if (Array.isArray(correct)) {
        var selArr = Array.isArray(ans) ? ans.slice().sort() : [];
        var corArr = correct.slice().sort();
        return JSON.stringify(selArr) === JSON.stringify(corArr);
      }
      if (typeof correct === 'number') return ans === correct;
      // correct is text: find matching option
      var ci = -1;
      for (var k = 0; k < opts.length; k++) {
        var lt = typeof opts[k] === 'string' ? opts[k] : (opts[k].text || '');
        if (normalize(lt) === normalize(correct)) { ci = k; break; }
      }
      if (ci >= 0) return ans === ci;
      return null;
    }
    var wantText = q.correctAnswer || q.answer || (q.meta && q.meta.answer) || '';
    if (wantText) return normalize(ans || '') === normalize(wantText);
    return null;
  }

  function submitTest() {
    stopTimer();
    var body = document.getElementById('tg-run-body');
    var correctCount = 0, scored = 0;
    var html = '<h3>Result</h3>';
    state.picked.forEach(function (q, i) {
      var res = isCorrect(q, state.answers['q' + i]);
      if (res === true) correctCount++;
      if (res !== null) scored++;
      var cls = res === true ? ' good' : res === false ? ' bad' : '';
      var label = res === true ? '✓ Correct' : res === false ? '✗ Wrong' : '• Answered';
      html += '<div class="tg-result' + cls + '"><b>Q' + (i + 1) + ' — ' + label + '</b><div>' + escapeHtml(textOf(q)) + '</div></div>';
    });
    html += '<p><b>Score: ' + correctCount + ' / ' + state.picked.length + '</b>' + (scored < state.picked.length ? ' (some questions could not be auto-scored)' : '') + '</p>';
    html += '<p><button id="tg-done" type="button" style="padding:10px 16px;border-radius:10px;background:#0F172A;color:#fff;border:none;cursor:pointer;font-weight:700">Done</button></p>';
    body.innerHTML = html;
    document.getElementById('tg-run-foot').style.display = 'none';
    document.getElementById('tg-done').addEventListener('click', function () {
      document.getElementById('tg-run-foot').style.display = '';
      closeRunner();
    });
  }

  // Boot: keep trying to inject the button as React re-renders
  injectCSS();
  buildUI();
  var tries = 0;
  var iv = setInterval(function () {
    tries++;
    if (ensureButton() || tries > 60) clearInterval(iv);
  }, 500);
  var mo = new MutationObserver(function () { ensureButton(); });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  window.TGAddon = { open: openModal, ensureButton: ensureButton };
})();
