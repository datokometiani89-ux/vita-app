/* ============================================================
   VITA — Camera / kinetic rep counter
   Uses MediaPipe Pose (loaded from CDN on demand) to count reps
   from body-joint angles. Falls back to a manual tap counter when
   the camera or the pose model is unavailable (offline, denied, etc).
   Public API:  V.openRepCounter({ move, onDone })
     move   : a V.repMoves entry (joints + thresholds + target)
     onDone : function(reps) called when the user finishes / saves
   ============================================================ */
(function () {
  var V = window.VITA;
  var POSE_CDN = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
  var _scriptLoading = null;

  function loadPose() {
    if (window.Pose) return Promise.resolve(true);
    if (_scriptLoading) return _scriptLoading;
    _scriptLoading = new Promise(function (resolve) {
      var s = document.createElement("script");
      s.src = POSE_CDN;
      s.crossOrigin = "anonymous";
      s.onload = function () { resolve(!!window.Pose); };
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
      // safety timeout — slow / blocked network → fall back to manual
      setTimeout(function () { resolve(!!window.Pose); }, 6000);
    });
    return _scriptLoading;
  }

  // angle at point b (degrees) for landmarks a-b-c
  function angle(a, b, c) {
    var ab = { x: a.x - b.x, y: a.y - b.y };
    var cb = { x: c.x - b.x, y: c.y - b.y };
    var dot = ab.x * cb.x + ab.y * cb.y;
    var mag = Math.sqrt(ab.x * ab.x + ab.y * ab.y) * Math.sqrt(cb.x * cb.x + cb.y * cb.y);
    if (!mag) return 180;
    var cos = Math.max(-1, Math.min(1, dot / mag));
    return Math.acos(cos) * 180 / Math.PI;
  }

  // pick the more-visible side, return its joint angle (or null)
  function moveAngle(lm, move) {
    function side(idx) {
      var a = lm[idx[0]], b = lm[idx[1]], c = lm[idx[2]];
      if (!a || !b || !c) return null;
      var vis = Math.min(a.visibility || 0, b.visibility || 0, c.visibility || 0);
      return { ang: angle(a, b, c), vis: vis };
    }
    var l = side(move.joints.L), r = side(move.joints.R);
    var best = null;
    if (l && (!best || l.vis > best.vis)) best = l;
    if (r && (!best || r.vis > best.vis)) best = r;
    if (!best || best.vis < 0.5) return null;
    return best.ang;
  }

  V.openRepCounter = function (opts) {
    opts = opts || {};
    var move = opts.move || V.repMoves[0];
    var target = move.target || 12;
    var L = V.lang ? V.lang() : "ka";
    var t = function (k) { return V.t(k); };
    var lname = (move.name && move.name[L]) || move.name.en;
    var ltip = move.tip ? (move.tip[L] || move.tip.en) : "";

    var phone = document.querySelector(".phone") || document.body;
    var el = document.createElement("div");
    el.className = "rep-overlay on";
    el.innerHTML =
      '<div class="rep-cam">' +
        '<video class="rep-video" playsinline muted></video>' +
        '<canvas class="rep-canvas"></canvas>' +
        '<div class="rep-top">' +
          '<button class="rep-x" data-x>' + (V.icon ? V.icon("x") : "✕") + '</button>' +
          '<div class="rep-title">' + V.esc(lname) + '</div>' +
        '</div>' +
        '<div class="rep-status" data-status>' + t("rcStarting") + '</div>' +
        '<div class="rep-count"><b data-reps>0</b><span>/ ' + target + '</span></div>' +
        '<div class="rep-bar"><span data-bar style="width:0%"></span></div>' +
        '<div class="rep-actions">' +
          '<button class="btn btn-ghost rep-minus" data-minus>−</button>' +
          '<button class="btn rep-plus" data-plus>+1</button>' +
          '<button class="btn btn-primary rep-done" data-done>' + t("rcDone") + '</button>' +
        '</div>' +
        '<div class="rep-tip" data-tip>' + V.esc(ltip) + '</div>' +
      '</div>';
    phone.appendChild(el);

    var video = el.querySelector(".rep-video");
    var canvas = el.querySelector(".rep-canvas");
    var ctx = canvas.getContext("2d");
    var elReps = el.querySelector("[data-reps]");
    var elBar = el.querySelector("[data-bar]");
    var elStatus = el.querySelector("[data-status]");
    var elTip = el.querySelector("[data-tip]");

    var reps = 0, stage = "up", finished = false;
    var stream = null, pose = null, rafId = null, running = true;

    function setReps(n) {
      reps = Math.max(0, n);
      elReps.textContent = reps;
      elBar.style.width = Math.min(100, Math.round(reps / target * 100)) + "%";
      if (reps >= target && !finished) {
        finished = true;
        el.querySelector(".rep-count").classList.add("hit");
        elStatus.textContent = t("rcGoalHit");
        if (navigator.vibrate) navigator.vibrate([40, 60, 40]);
      }
    }

    function onResults(res) {
      if (!running) return;
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      var lm = res.poseLandmarks;
      if (!lm) { elStatus.textContent = t("rcNoBody"); return; }
      // draw a light skeleton of the tracked joints
      ctx.strokeStyle = "rgba(43,169,76,.9)"; ctx.lineWidth = 4;
      [move.joints.L, move.joints.R].forEach(function (j) {
        ctx.beginPath();
        for (var i = 0; i < j.length; i++) {
          var p = lm[j[i]]; if (!p) continue;
          var x = (1 - p.x) * w, y = p.y * h; // mirror x
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      });
      var ang = moveAngle(lm, move);
      if (ang == null) { elStatus.textContent = t("rcAdjust"); return; }
      // rep state machine
      if (ang <= move.down && stage === "up") { stage = "down"; }
      if (ang >= move.up && stage === "down") { stage = "up"; if (!finished) setReps(reps + 1); }
      elStatus.textContent = (stage === "down" ? "▼ " : "▲ ") + t("rcTracking");
    }

    function fitCanvas() {
      canvas.width = el.querySelector(".rep-cam").clientWidth;
      canvas.height = el.querySelector(".rep-cam").clientHeight;
    }

    function manualMode(msg) {
      elStatus.textContent = msg || t("rcManual");
      elTip.textContent = t("rcManualTip");
      el.classList.add("manual");
    }

    function pump() {
      if (!running) return;
      if (pose && video.readyState >= 2) {
        pose.send({ image: video }).then(function () {
          if (running) rafId = requestAnimationFrame(pump);
        }).catch(function () { if (running) rafId = requestAnimationFrame(pump); });
      } else if (running) {
        rafId = requestAnimationFrame(pump);
      }
    }

    function startCamera() {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        manualMode(t("rcNoCam")); return;
      }
      navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 480, height: 640 }, audio: false })
        .then(function (s) {
          stream = s; video.srcObject = s;
          video.onloadedmetadata = function () { video.play(); fitCanvas(); };
          return loadPose();
        })
        .then(function (ok) {
          if (!ok || !window.Pose) { manualMode(t("rcModelFail")); return; }
          pose = new window.Pose({ locateFile: function (f) { return "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + f; } });
          pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
          pose.onResults(onResults);
          elStatus.textContent = t("rcTracking");
          pump();
        })
        .catch(function () { manualMode(t("rcDenied")); });
    }

    function close(save) {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
      if (pose && pose.close) { try { pose.close(); } catch (e) {} }
      el.remove();
      if (save && opts.onDone) opts.onDone(reps);
    }

    el.querySelector("[data-x]").addEventListener("click", function () { close(false); });
    el.querySelector("[data-plus]").addEventListener("click", function () { setReps(reps + 1); });
    el.querySelector("[data-minus]").addEventListener("click", function () { setReps(reps - 1); finished = false; el.querySelector(".rep-count").classList.remove("hit"); });
    el.querySelector("[data-done]").addEventListener("click", function () { close(true); });
    window.addEventListener("resize", fitCanvas);

    startCamera();
    return el;
  };
})();
