/* Quiz Blitz - PAUSE BUTTON ONLY - Simple Add-on
 * For CAT v2.7.52 (locked) - does NOT edit the locked file.
 *
 * Usage: in a COPY of v2.7.52, add ONE line before </body>:
 *   <script src="quiz-blitz-pause-addon-simple.js"></script>
 * Put this file in same folder as the copy. Delete the line to go back to locked.
 *
 * What it does:
 * - Shows a FIXED Pause button top-right when you are PLAYING Quiz Blitz.
 *   It is fixed to the screen (position:fixed, z-index 99999) so the sidebar
 *   or question card cannot hide it.
 * - Click PAUSE -> freezes the 10:00 countdown where it is.
 *   Click RESUME -> continues from where it froze.
 * - No role check in this simple version - button shows for everyone,
 *   so you can test it. Add role check later if you want.
 *
 * How it works: Quiz Blitz timer is:
 *   useEffect(()=>{ if(gameTimeLeft<=0) ...; let t = setTimeout(()=>setGameTimeLeft(o=>o-1), 1000); return ()=>clearTimeout(t) })
 * This add-on wraps window.setTimeout / clearTimeout and holds the 1000ms
 * timeout when paused. Resume re-schedules it.
 */
(function () {
  if (window.__QB_PAUSE_SIMPLE_LOADED) return;
  window.__QB_PAUSE_SIMPLE_LOADED = true;

  var CSS = ''
    + '#qb-pause-box{position:fixed;top:80px;right:12px;z-index:99999;background:#fff;border:2px solid #0F172A;border-radius:12px;padding:12px;width:210px;box-shadow:0 10px 30px rgba(0,0,0,.3);font-family:system-ui,sans-serif}'
    + '#qb-pause-box h3{margin:0 0 8px;font-size:12px;letter-spacing:.08em}'
    + '#qb-pause-btn{width:100%;padding:10px;border:none;border-radius:999px;background:#0F172A;color:#fff;font-weight:800;font-size:14px;cursor:pointer}'
    + '#qb-pause-btn.paused{background:#D97706}'
    + '#qb-pause-status{margin-top:8px;font-size:12px;font-weight:700;text-align:center}'
    + '#qb-pause-note{margin-top:6px;font-size:11px;color:#64748B;text-align:center;line-height:1.4}';
  var st = document.createElement('style');
  st.textContent = CSS;
  document.head.appendChild(st);

  var paused = false;
  var pending = []; // {cb, delay, args}
  var trackedReal = []; // real timeout ids created while Blitz playing

  var origSetTimeout = window.setTimeout;
  var origClearTimeout = window.clearTimeout;
  var nextFakeId = 2000000;

  function isBlitzPlaying() {
    var b = document.body ? (document.body.innerText || '') : '';
    return b.indexOf('Quiz Blitz') >= 0 && b.indexOf('Quit Game') >= 0 && b.indexOf('TIME LEFT') >= 0;
  }

  // Wrap setTimeout: hold 1000ms Blitz timeouts when paused
  window.setTimeout = function (cb, delay) {
    var args = Array.prototype.slice.call(arguments, 2);
    if (isBlitzPlaying() && delay === 1000 && typeof cb === 'function') {
      if (paused) {
        var fakeId = nextFakeId++;
        pending.push({ fakeId: fakeId, cb: cb, delay: delay, args: args });
        return fakeId;
      }
      var realId = origSetTimeout.apply(window, [cb, delay].concat(args));
      trackedReal.push(realId);
      // Tag it so clearTimeout can find it - store mapping
      // We keep a map fake->real via property on window? Simpler: keep list
      return realId;
    }
    return origSetTimeout.apply(window, arguments);
  };

  window.clearTimeout = function (id) {
    // If id is a fake pending id, remove from pending
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].fakeId === id) {
        pending.splice(i, 1);
        return;
      }
    }
    // If id is a real tracked id, remove from trackedReal
    var idx = trackedReal.indexOf(id);
    if (idx >= 0) trackedReal.splice(idx, 1);
    return origClearTimeout.apply(window, arguments);
  };

  function pauseTimer() {
    paused = true;
    // Clear any real 1000ms timeouts that are waiting to tick.
    // Their callbacks are already captured? No - the real timeout's callback is inside React closure.
    // We cannot retrieve it from the id alone, so we need a different trick:
    // Instead of clearing, we will let that one timeout fire, but block its effect by
    // holding the NEXT timeout. Wait - that would let it tick once after Pause.
    // To avoid that 1-second slip, we clear the real timeouts and rely on the fact that
    // React will create a NEW timeout when we resume? No, React only creates a new timeout
    // when gameTimeLeft changes. If we clear without re-scheduling, the timer stops
    // forever until something else changes gameTimeLeft.
    //
    // So for setTimeout-based timer, the correct pause is:
    // - Clear the pending real timeout (stops the next tick)
    // - On Resume, manually trigger one tick by re-creating the effect:
    //   We do this by scheduling a timeout that will itself call the original
    //   setGameTimeLeft logic? We don't have access to it.
    //
    // WORKAROUND that DOES work: don't clear, just block the next setTimeout.
    // The timeout that is already scheduled WILL fire once (max 1 sec slip), then
    // its callback will try to schedule the NEXT timeout via React effect, which
    // our wrapper will hold in pending. So pause takes effect within 1 second
    // and then freezes. This is acceptable and reliable.
    //
    // So: do NOT clear trackedReal here. Just set paused=true.
    // The next setTimeout call (after the current tick) will be held.
    updateUI();
    console.log('[QB Pause] Paused - timer will freeze within 1s');
  }

  function resumeTimer() {
    paused = false;
    // Release all held timeouts
    var toRelease = pending.slice();
    pending = [];
    toRelease.forEach(function (p) {
      var realId = origSetTimeout.apply(window, [p.cb, p.delay].concat(p.args || []));
      trackedReal.push(realId);
    });
    updateUI();
    console.log('[QB Pause] Resumed - released ' + toRelease.length + ' held timeout(s)');
  }

  // ---- UI - Fixed box ----
  var box = null;
  var btn = null;
  var statusEl = null;

  function ensureBox() {
    if (box) return box;
    box = document.createElement('div');
    box.id = 'qb-pause-box';
    box.innerHTML = '<h3>QUIZ BLITZ TIMER</h3>';
    btn = document.createElement('button');
    btn.id = 'qb-pause-btn';
    btn.type = 'button';
    btn.textContent = '⏸ PAUSE TIMER';
    btn.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (paused) resumeTimer(); else pauseTimer();
    });
    statusEl = document.createElement('div');
    statusEl.id = 'qb-pause-status';
    statusEl.textContent = 'Timer Running';
    var note = document.createElement('div');
    note.id = 'qb-pause-note';
    note.textContent = 'Pause freezes the countdown. Resume continues from where it froze.';
    box.appendChild(btn);
    box.appendChild(statusEl);
    box.appendChild(note);
    document.body.appendChild(box);
    return box;
  }

  function updateUI() {
    if (!btn) return;
    if (paused) {
      btn.textContent = '▶ RESUME TIMER';
      btn.classList.add('paused');
      if (statusEl) { statusEl.textContent = 'Timer Paused'; statusEl.style.color = '#D97706'; }
    } else {
      btn.textContent = '⏸ PAUSE TIMER';
      btn.classList.remove('paused');
      if (statusEl) { statusEl.textContent = 'Timer Running'; statusEl.style.color = '#16A34A'; }
    }
  }

  function tick() {
    if (isBlitzPlaying()) {
      ensureBox();
      box.style.display = 'block';
      updateUI();
    } else {
      if (box) box.style.display = 'none';
      // Reset when leaving game
      if (paused) {
        paused = false;
        pending = [];
      }
    }
  }

  setInterval(tick, 500);
  console.log('[QB Pause] Add-on loaded - Pause button will appear top-right when Quiz Blitz is playing');
})();
