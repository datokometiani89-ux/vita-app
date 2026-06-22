/* VITA self-test — asserts the pure analysis functions (PPG, scan scoring,
   bio-age, reaction, skin/voice, wearable merge) against known inputs. This is
   the automated half of scan validation; the other half is a real-device check
   against a reference oximeter/cuff (see test.html). No camera/mic needed. */
(function () {
  var V = window.VITA || {};
  var rows = [], pass = 0, fail = 0;
  function approx(a, b, tol) { return a != null && Math.abs(a - b) <= tol; }
  function inRange(x, lo, hi) { return x != null && x >= lo && x <= hi; }
  function check(name, ok, detail) { rows.push({ name: name, ok: !!ok, detail: detail || "" }); if (ok) pass++; else fail++; }

  // --- synthetic generators ---
  function synthResp(rrPerMin, durSec, fps) {
    var n = Math.round(durSec * fps), out = [];
    for (var i = 0; i < n; i++) {
      var s = i / fps;
      // slow respiratory wave + fast cardiac ripple + tiny baseline drift
      out.push(10 + 2 * Math.sin(2 * Math.PI * rrPerMin / 60 * s) + 0.5 * Math.sin(2 * Math.PI * 1.2 * s) + 0.3 * Math.sin(2 * Math.PI * 0.05 * s));
    }
    return out;
  }
  function beatsFromIBIs(ibis) { var t = 1000, bt = [t]; ibis.forEach(function (d) { t += d; bt.push(t); }); return bt; }

  try {
    // ---- ppgRR: respiratory rate recovery ----
    var rr15 = V.ppgRR(synthResp(15, 30, 30), 30);
    check("ppgRR detects ~15 br/min", approx(rr15, 15, 2), "got " + rr15);
    var rr20 = V.ppgRR(synthResp(20, 30, 30), 30);
    check("ppgRR detects ~20 br/min", approx(rr20, 20, 3), "got " + rr20);
    check("ppgRR returns null on a too-short signal", V.ppgRR([1, 2, 3], 2) === null, "guarded");

    // ---- ppgHRV: RMSSD ----
    var hrv = V.ppgHRV(beatsFromIBIs([820, 780, 810, 790, 830, 770, 800, 815]));
    check("ppgHRV returns a plausible RMSSD", inRange(hrv, 5, 200), "got " + hrv);
    check("ppgHRV returns null with too few beats", V.ppgHRV([1000, 1800]) === null, "guarded");

    // ---- ppgSpO2: ratio-of-ratios (never throws; null when weak) ----
    var n = 300, red = [], blue = [];
    for (var i = 0; i < n; i++) { var s = i / 30; red.push(120 + 6 * Math.sin(2 * Math.PI * 1.1 * s)); blue.push(80 + 2 * Math.sin(2 * Math.PI * 1.1 * s)); }
    var spo2 = V.ppgSpO2(red, blue, 10);
    check("ppgSpO2 is null or a plausible % (90–100)", spo2 === null || inRange(spo2, 90, 100), "got " + spo2);
    check("ppgSpO2 returns null on weak signal", V.ppgSpO2([1, 1, 1], [1, 1, 1], 10) === null, "guarded");

    // ---- scanScore: composite monotonicity ----
    var sGood = V.scanScore({ bpm: 62, hrv: 60, rr: 14, spo2: 98 });
    var sPoor = V.scanScore({ bpm: 105, hrv: 15, rr: 22, spo2: 92 });
    check("scanScore: healthy vitals score higher than poor", sGood > sPoor, sGood + " > " + sPoor);
    check("scanScore stays within 25–99", inRange(sGood, 25, 99) && inRange(sPoor, 25, 99), sGood + "/" + sPoor);

    // ---- scanStress: HRV → recovery ----
    var stLow = V.scanStress(70), stHigh = V.scanStress(15);
    check("scanStress: high HRV → higher recovery", stLow && stHigh && stLow.recovery > stHigh.recovery, (stLow && stLow.recovery) + " > " + (stHigh && stHigh.recovery));

    // ---- reactionBand / reactionScore ----
    check("reactionBand 250ms → sharp", V.reactionBand(250).k === "rxSharp");
    check("reactionBand 380ms → ok", V.reactionBand(380).k === "rxOk");
    check("reactionBand 520ms → slow", V.reactionBand(520).k === "rxSlow");
    check("reactionScore decreases with slower ms", V.reactionScore(250) > V.reactionScore(450));

    // ---- skin / voice bands ----
    check("skinFlag escalates with ABCDE count", V.skinFlag(0, 0).tone === "green" && V.skinFlag(4, 0.6).tone === "crimson");
    check("voiceBand: steady → green, shaky → crimson", V.voiceBand(85).tone === "green" && V.voiceBand(20).tone === "crimson");

    // ---- healthAge (needs a profile age) ----
    var savedAge = (V.state.profile || {}).age;
    V.state.profile = V.state.profile || {}; V.state.profile.age = 40;
    var ha = V.healthAge();
    check("healthAge returns {bio,chrono,delta}", ha && inRange(ha.bio, 18, 95) && ha.chrono === 40, ha ? (ha.bio + " vs " + ha.chrono) : "null");
    V.state.profile.age = savedAge;

    // ---- wearable merge (averages, never NaN) ----
    if (V.connectWearable) {
      var savedW = V.state.wearable;
      V.state.wearable = { sources: [] };
      V.connectWearable("apple"); V.connectWearable("garmin");
      var c = V.wearableCombined();
      check("wearableCombined averages 2 sources (no NaN)", c && c.count === 2 && inRange(c.steps, 0, 40000) && !isNaN(c.sleepH), c ? (c.steps + " steps") : "null");
      V.state.wearable = savedW;
    }
  } catch (e) {
    check("EXCEPTION during tests", false, String(e));
  }

  // ---- render ----
  var root = document.getElementById("tests");
  if (root) {
    root.innerHTML =
      '<div class="st-sum ' + (fail === 0 ? "ok" : "bad") + '">' + pass + " / " + (pass + fail) + " passed" + (fail ? " · " + fail + " FAILED" : " ✓") + "</div>" +
      rows.map(function (r) {
        return '<div class="st-row ' + (r.ok ? "ok" : "bad") + '"><span class="st-ic">' + (r.ok ? "✓" : "✕") + "</span><b>" + r.name + "</b>" + (r.detail ? "<small>" + r.detail + "</small>" : "") + "</div>";
      }).join("");
  }
  if (window.console) console.log("[VITA self-test] " + pass + "/" + (pass + fail) + " passed, " + fail + " failed");
})();
