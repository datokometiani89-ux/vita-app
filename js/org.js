/* VITA for Business — population-health dashboard (the B2B2C surface for
   employers / insurers). Standalone app; reuses VITA brand helpers + doctor.css.
   ALL data is aggregate & anonymized (no individual PII) — that's the model. */
(function () {
  var V = window.VITA || {};
  var root = document.getElementById("orgapp");
  var esc = V.esc || function (s) { return String(s == null ? "" : s); };
  function each(s, fn) { root.querySelectorAll(s).forEach(fn); }
  function lang() { return (V.lang && V.lang()) || "ka"; }
  function L(o) { return o[lang()] || o.en; }
  function icon(n) { return (V.icon && V.icon(n)) || ""; }
  function logo(size) { return (V.logoBadge && V.logoBadge(size)) || ""; }

  var GREEN = "#2BA94C", YELLOW = "#e0a92e", CRIMSON = "#e8536b", BLUE = "#4a90d9";

  /* ---------- demo population data (aggregate) ---------- */
  var ORG = { name: "Acme Georgia", nameKa: "Acme საქართველო", employees: 248 };
  var DATA = {
    avgScore: 72, active: 68, savings: 180, compliance: 74,
    risk: { low: 58, medium: 30, high: 12 },
    engagement: [42, 48, 51, 55, 60, 63, 66, 68],
    focus: [
      { name: { ka: "ჭარბი წონა", en: "Overweight" }, pct: 34 },
      { name: { ka: "კარდიო-რისკი", en: "Cardiac risk" }, pct: 27 },
      { name: { ka: "სტრესი / მენტალური", en: "Stress / mental" }, pct: 24 },
      { name: { ka: "ძილის დეფიციტი", en: "Sleep deficit" }, pct: 21 },
      { name: { ka: "მოწევა", en: "Smoking" }, pct: 16 },
    ],
    depts: [
      { name: { ka: "ინჟინერია", en: "Engineering" }, size: 64, score: 70, trend: "up" },
      { name: { ka: "გაყიდვები", en: "Sales" }, size: 52, score: 67, trend: "down" },
      { name: { ka: "ოპერაციები", en: "Operations" }, size: 48, score: 74, trend: "up" },
      { name: { ka: "მხარდაჭერა", en: "Support" }, size: 40, score: 71, trend: "flat" },
      { name: { ka: "ადმინი", en: "Admin" }, size: 44, score: 76, trend: "up" },
    ],
  };

  /* ---------- charts ---------- */
  function bars(data, color) {
    var w = 340, h = 130, pad = 14, n = data.length, max = 100, bw = (w - 2 * pad) / n * 0.62;
    return '<svg viewBox="0 0 ' + w + " " + h + '" class="doc-svg">' +
      data.map(function (v, i) {
        var x = pad + (i + 0.5) * ((w - 2 * pad) / n) - bw / 2, bh = (v / max) * (h - 28), y = h - 20 - bh;
        var lbl = (i === n - 1 || i === 0) ? '<text x="' + (x + bw / 2) + '" y="' + (y - 5) + '" text-anchor="middle" class="doc-bv">' + v + "%</text>" : "";
        return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + bh + '" rx="4" fill="' + color + '" opacity="' + (0.45 + 0.55 * i / n) + '"/>' + lbl +
          '<text x="' + (x + bw / 2) + '" y="' + (h - 5) + '" text-anchor="middle" class="doc-ax">' + (lang() === "ka" ? "კვ" : "W") + (i + 1) + "</text>";
      }).join("") + "</svg>";
  }
  function donut(pct, color) {
    var r = 30, C = 2 * Math.PI * r, len = pct / 100 * C;
    return '<svg viewBox="0 0 76 76" class="doc-donut"><circle cx="38" cy="38" r="' + r + '" fill="none" stroke="var(--field)" stroke-width="9"/>' +
      '<circle cx="38" cy="38" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="9" stroke-linecap="round" stroke-dasharray="' + len + " " + (C - len) + '" transform="rotate(-90 38 38)"/>' +
      '<text x="38" y="43" text-anchor="middle" class="doc-donut__t">' + pct + "%</text></svg>";
  }
  function kpi(label, val, sub, color) { return '<div class="doc-kpi"><b style="color:' + (color || "var(--ink)") + '">' + val + "</b><small>" + label + "</small>" + (sub ? '<i class="doc-kpi__sub">' + sub + "</i>" : "") + "</div>"; }
  function trendIcon(t) { return t === "up" ? '<span style="color:' + GREEN + '">▲</span>' : t === "down" ? '<span style="color:' + CRIMSON + '">▼</span>' : '<span style="color:var(--muted)">—</span>'; }

  function render() {
    var name = lang() === "ka" ? ORG.nameKa : ORG.name;
    root.innerHTML =
      '<header class="doc-top">' +
        '<div class="doc-brand">' + logo(34) + '<div><b>VITA <span>for Business</span></b><small>' + T("popHealth") + "</small></div></div>" +
        '<div class="doc-top__r">' +
          '<div class="org-co">' + icon("shield") + " " + esc(name) + "</div>" +
          '<button class="doc-lang" id="orgLang">' + (lang() === "ka" ? "EN" : "ქა") + "</button>" +
        "</div></header>" +

      '<div class="org-priv">' + icon("info") + " " + T("privacy") + "</div>" +

      '<div class="doc-kpis">' +
        kpi(T("enrolled"), ORG.employees, null, "var(--ink)") +
        kpi(T("avgScore"), DATA.avgScore, "/100", GREEN) +
        kpi(T("active"), DATA.active + "%", T("monthly"), BLUE) +
        kpi(T("savings"), "₾" + DATA.savings + "k", T("annual"), YELLOW) +
      "</div>" +

      // risk distribution
      '<div class="doc-card"><div class="doc-card__h">' + icon("shield") + " <b>" + T("riskDist") + "</b></div>" +
        '<div class="org-riskbar">' +
          '<span style="width:' + DATA.risk.low + "%;background:" + GREEN + '"></span>' +
          '<span style="width:' + DATA.risk.medium + "%;background:" + YELLOW + '"></span>' +
          '<span style="width:' + DATA.risk.high + "%;background:" + CRIMSON + '"></span>' +
        "</div>" +
        '<div class="org-risklegend">' +
          riskLeg(GREEN, T("low"), DATA.risk.low) + riskLeg(YELLOW, T("medium"), DATA.risk.medium) + riskLeg(CRIMSON, T("high"), DATA.risk.high) +
        "</div></div>" +

      // engagement
      '<div class="doc-card"><div class="doc-card__h">' + icon("progress") + " <b>" + T("engagement") + "</b></div>" + bars(DATA.engagement, GREEN) + "</div>" +

      '<div class="doc-2up">' +
        '<div class="doc-card doc-card--c"><div class="doc-card__h">' + icon("check") + " <b>" + T("compliance") + "</b></div>" + donut(DATA.compliance, BLUE) + "</div>" +
        '<div class="doc-card doc-card--c"><div class="doc-card__h">' + icon("user") + " <b>" + T("active") + "</b></div>" + donut(DATA.active, GREEN) + "</div>" +
      "</div>" +

      // top focus areas
      '<div class="doc-card"><div class="doc-card__h">' + icon("trend") + " <b>" + T("focus") + "</b></div>" +
        DATA.focus.map(function (f) {
          return '<div class="org-focus"><span class="org-focus__l">' + esc(L(f.name)) + "</span>" +
            '<span class="org-focus__bar"><i style="width:' + f.pct + '%"></i></span><b>' + f.pct + "%</b></div>";
        }).join("") + "</div>" +

      // departments
      '<div class="doc-card"><div class="doc-card__h">' + icon("grid") + " <b>" + T("depts") + "</b></div>" +
        '<table class="org-tbl"><thead><tr><th>' + T("dept") + "</th><th>" + T("people") + "</th><th>" + T("score") + "</th><th>" + T("trend") + "</th></tr></thead><tbody>" +
        DATA.depts.map(function (d) {
          var col = d.score >= 73 ? GREEN : d.score >= 68 ? YELLOW : CRIMSON;
          return "<tr><td>" + esc(L(d.name)) + "</td><td>" + d.size + '</td><td><b style="color:' + col + '">' + d.score + "</b></td><td>" + trendIcon(d.trend) + "</td></tr>";
        }).join("") + "</tbody></table></div>" +

      '<div class="org-roi">' + icon("sparkle") + " " + T("roiNote") + "</div>";

    var lg = root.querySelector("#orgLang"); if (lg) lg.addEventListener("click", function () { if (V.setLang) V.setLang(lang() === "ka" ? "en" : "ka"); render(); });
  }
  function riskLeg(col, lbl, pct) { return '<span class="org-rl"><i style="background:' + col + '"></i>' + lbl + " <b>" + pct + "%</b></span>"; }

  /* ---------- copy ---------- */
  var STR = {
    popHealth: { ka: "პოპულაციური ჯანმრთელობა", en: "Population health" },
    privacy: { ka: "ყველა მონაცემი აგრეგირებული და ანონიმურია — ინდივიდუალური ინფორმაცია არ ჩანს.", en: "All data is aggregate & anonymized — no individual information is shown." },
    enrolled: { ka: "ჩართული თანამშრომელი", en: "Enrolled employees" },
    avgScore: { ka: "საშ. ჯანმრთ. ქულა", en: "Avg wellness score" },
    active: { ka: "აქტიური", en: "Active" }, monthly: { ka: "თვეში", en: "monthly" },
    savings: { ka: "სავარაუდო ეკონომია", en: "Est. savings" }, annual: { ka: "წელიწადში", en: "annual" },
    riskDist: { ka: "რისკის განაწილება", en: "Risk distribution" },
    low: { ka: "დაბალი", en: "Low" }, medium: { ka: "საშუალო", en: "Medium" }, high: { ka: "მაღალი", en: "High" },
    engagement: { ka: "ჩართულობა (8 კვირა)", en: "Engagement (8 weeks)" },
    compliance: { ka: "სკრინინგის დაცვა", en: "Screening compliance" },
    focus: { ka: "მთავარი ფოკუს-სფეროები", en: "Top focus areas" },
    depts: { ka: "დეპარტამენტები", en: "Departments" }, dept: { ka: "დეპარტამენტი", en: "Department" }, people: { ka: "ხალხი", en: "People" }, score: { ka: "ქულა", en: "Score" }, trend: { ka: "ტრენდი", en: "Trend" },
    roiNote: { ka: "ჯანსაღი თანამშრომელი = ნაკლები ბიულეტენი და სამედიცინო ხარჯი. VITA+ კორპორატიული გეგმა ფარავს გუნდს.", en: "Healthier staff = fewer sick days and lower medical cost. VITA+ corporate plans cover your team." },
  };
  function T(k) { var o = STR[k]; return o ? L(o) : k; }

  render();
})();
