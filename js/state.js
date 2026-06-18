/* VITA state — profile, persistence, derived metrics */
window.VITA = window.VITA || {};

(function (V) {
  var KEY = "vita.state.v1";

  var defaults = {
    onboarded: false,
    profile: {
      sex: "man",
      name: "",
      age: null,
      weight: null,
      height: null,
      waist: null,
      location: "",
      activity: null,   // sitting | light | active | very
      smoking: null,    // no | occ | daily
      alcohol: null,    // never | occ | soc | weekly | daily
      food: null,       // balanced | irregular | diet | veg
      water: null,      // low | mid | good | high
      sleep: null,      // <5 | 5-6 | 6-8 | 8+
      conditions: [],   // pre | chol | hyper | thyroid
      lastCheck: [],    // sugar | chol | bp
      meds: null,       // yes | no
      energy: null,     // vlow | low | mod | high
      mood: null,       // pos | neutral | low | anx
      stress: null,     // calm | mod | high | burn
      sleepQ: null,     // great | ok | poor | ins
      skin: null,       // normal | dry | oily | sens
      hair: null,       // normal | thin | loss
      oral: null,       // twice | once | irr
    },
    goals: [],            // ids of selected goals
    planGenerated: false,
    planStartDay: null,   // ISO date when plan started
    doneTasks: {},        // { "2026-06-12": ["t1","t2"] }
    taskLogs: {},         // { "2026-06-12": { t1: {text, photo, voice} } }
    doneMeds: {},         // { "2026-06-12": ["omega3"] }
    doneWorkouts: {},      // { "mon": true } — weekly workout completion
    screenings: null,      // selected preventive-screening ids (null → default to recommended)
    waterLog: {},          // { "2026-06-18": 1500 }  ml of water per day
    points: 0,             // VITA reward points
    elements: {},          // collected brand elements { green: 3, ... }
    rewardLog: [],         // [{date, pts, reason}]
    cycle: null,           // women's cycle { lastPeriod, cycleLen, periodLen, logs:[] }
    bookings: [],          // [{checkupId, clinicId, date, time, status}]
    calendar: [],         // checkup ids added to calendar
    labResults: [],       // [{id, date, values:{glucose:..}, summary}]
    weightLog: [],        // [{date, kg}]
    chat: [],             // [{role:"user"|"vita", text}]
  };

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaults));
      var s = JSON.parse(raw);
      // shallow-merge to survive schema additions
      var out = JSON.parse(JSON.stringify(defaults));
      Object.keys(s).forEach(function (k) { out[k] = s[k]; });
      out.profile = Object.assign({}, defaults.profile, s.profile || {});
      return out;
    } catch (e) {
      return JSON.parse(JSON.stringify(defaults));
    }
  }

  V.state = load();

  V.save = function () {
    localStorage.setItem(KEY, JSON.stringify(V.state));
  };

  V.reset = function () {
    localStorage.removeItem(KEY);
    V.state = load();
  };

  V.todayISO = function () {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  };

  /* ---------- derived metrics ---------- */

  V.bmi = function () {
    var p = V.state.profile;
    if (!p.weight || !p.height) return null;
    var m = p.height / 100;
    return Math.round((p.weight / (m * m)) * 10) / 10;
  };

  V.bmiStatus = function () {
    var b = V.bmi();
    if (b == null) return null;
    if (b < 18.5) return "low";
    if (b < 25) return "good";
    if (b < 30) return "medium";
    return "high";
  };

  /* Health score 0–100 from risk factors (heuristic, mirrors the doc's example ≈62) */
  V.healthScore = function () {
    var p = V.state.profile;
    var s = 100;
    if (p.conditions.indexOf("pre") >= 0) s -= 12;
    if (p.conditions.indexOf("chol") >= 0) s -= 8;
    if (p.conditions.indexOf("hyper") >= 0) s -= 10;
    if (p.conditions.indexOf("thyroid") >= 0) s -= 5;
    if (p.lastCheck.indexOf("sugar") >= 0 && p.conditions.indexOf("pre") < 0) s -= 8;
    var b = V.bmi();
    if (b != null) { if (b >= 30) s -= 12; else if (b >= 25) s -= 7; else if (b < 18.5) s -= 5; }
    if (p.waist && ((p.sex === "man" && p.waist >= 102) || (p.sex === "woman" && p.waist >= 88))) s -= 6;
    if (p.activity === "sitting") s -= 6; else if (p.activity === "light") s -= 2;
    if (p.smoking === "daily") s -= 10; else if (p.smoking === "occ") s -= 4;
    if (p.alcohol === "daily") s -= 8; else if (p.alcohol === "weekly" || p.alcohol === "soc") s -= 3;
    if (p.food === "irregular") s -= 4;
    if (p.water === "low") s -= 3; else if (p.water === "mid") s -= 1;
    if (p.sleep === "<5") s -= 6; else if (p.sleep === "5-6") s -= 3;
    if (p.energy === "vlow") s -= 5; else if (p.energy === "low") s -= 3;
    if (p.stress === "burn") s -= 6; else if (p.stress === "high") s -= 4;
    if (p.mood === "anx" || p.mood === "low") s -= 3;
    if (p.sleepQ === "ins") s -= 5; else if (p.sleepQ === "poor") s -= 3;
    if (p.skin === "dry" || p.skin === "sens") s -= 2;
    if (p.hair === "thin") s -= 2; else if (p.hair === "loss") s -= 3;
    if (p.oral === "irr") s -= 3; else if (p.oral === "once") s -= 1;
    return Math.max(15, Math.min(98, Math.round(s)));
  };

  /* Areas of concern: [{id, label-key, severity}] sorted by severity */
  V.concerns = function () {
    var p = V.state.profile;
    var out = [];
    var add = function (id, key, sev) { out.push({ id: id, key: key, sev: sev }); };

    var sugarRisk = p.conditions.indexOf("pre") >= 0 || p.lastCheck.indexOf("sugar") >= 0;
    if (sugarRisk) add("sugar", "aSugar", "high");
    if (p.energy === "vlow" || p.energy === "low") add("energy", "aEnergy", "high");
    if (sugarRisk || p.conditions.indexOf("chol") >= 0 || p.conditions.indexOf("hyper") >= 0 || p.smoking === "daily")
      add("heart", "aHeart", sugarRisk && (p.conditions.indexOf("chol") >= 0 || p.conditions.indexOf("hyper") >= 0) ? "high" : "medium");
    if (p.conditions.indexOf("chol") >= 0 || p.lastCheck.indexOf("chol") >= 0) add("chol", "aChol", "medium");
    var b = V.bmi();
    if (b != null && b >= 25) add("weight", "aWeight", b >= 30 ? "high" : "medium");
    if (p.stress === "high" || p.stress === "burn" || p.mood === "anx" || p.sleepQ === "poor" || p.sleepQ === "ins")
      add("mental", "aMental", p.stress === "burn" ? "high" : "medium");
    if (p.skin === "dry" || p.skin === "sens") add("skin", "aSkin", "low");

    var rank = { high: 0, medium: 1, low: 2 };
    out.sort(function (a, b2) { return rank[a.sev] - rank[b2.sev]; });
    return out;
  };

  /* day index of the active plan (1-based) */
  V.planDay = function () {
    if (!V.state.planStartDay) return 1;
    var ms = new Date(V.todayISO()) - new Date(V.state.planStartDay);
    return Math.max(1, Math.floor(ms / 86400000) + 1);
  };
})(window.VITA);
