/* VITA UI audit — paste into the preview tab's console (or run via the Claude browser
   javascript_tool). Walks every route and reports:
     • style violations: backgrounds / gradients / coloured borders that break the
       "white surfaces, one accent" rule (state classes are skipped)
     • horizontal overflow: elements wider than the viewport (phone widths)
     • missing large-title header / tab bar on hub-family screens
   Usage:  await vitaUiAudit()            → { violations:[], overflow:[], noHeader:[] }
           await vitaUiAudit({ routes: ["scan","market"] }) */
async function vitaUiAudit(o) {
  o = o || {};
  var routes = o.routes || ("home health care me market profile coach datalab progress wellness plus insurance roi results family meds telemed checkup careplans exercises workouts calendar cycle rewards wearable challenges annual bodymap quests readiness scan fullscan steps water food sleep mood bplog visits reminders customize vitaapp").split(" ");
  var ok = new Set(["rgba(0, 0, 0, 0)", "rgb(255, 255, 255)", "rgb(242, 242, 247)", "rgb(239, 239, 244)", "rgb(229, 229, 234)", "rgb(43, 169, 76)"]);
  var skip = /(^| )(ig-ic|tab|jelly|blob|btn-primary|chip on|toggle|sum-ring|tabbar|statusbar|nav-large__acts|icon-box|pts-chip|me-av|badge|sev|doc-|td-av|fm-av|mk-art|cal-cell|ys-cell|an-prog-ring|rd-ring|scn-bioage__ring|scn-mod|sl-q|pts-badge|actionbar|mk-chip|mk-feat__disc|mk-orow__disc|water-preset on|cal-btn on)/;
  var viol = {}, over = {}, noHeader = [];
  function go(h) { location.hash = h; return new Promise(function (r) { setTimeout(r, 450); }); }
  var vw = innerWidth;
  for (var i = 0; i < routes.length; i++) {
    var r = routes[i]; await go("#/" + r);
    var root = document.querySelector(".screen"); if (!root) { noHeader.push(r + " (no .screen)"); continue; }
    if (!document.querySelector(".nav-large h1") && r !== "home") noHeader.push(r);
    root.querySelectorAll("*").forEach(function (el) {
      if (el.closest("svg")) return;
      var cls = typeof el.className === "string" ? el.className.trim() : "";
      var rect = el.getBoundingClientRect();
      if (rect.width > 0 && (rect.right > vw + 1 || rect.left < -1)) over[r + " ." + (cls.split(" ")[0] || el.tagName)] = Math.round(rect.right - vw);
      if (!cls || skip.test(cls) || rect.width < 40 || rect.height < 24) return;
      var cs = getComputedStyle(el), f = [];
      if (!ok.has(cs.backgroundColor)) f.push("bg:" + cs.backgroundColor);
      if (/gradient/.test(cs.backgroundImage)) f.push("grad");
      var bw = parseFloat(cs.borderTopWidth), bc = cs.borderTopColor;
      if (bw > 0 && !/rgba\(60, 60, 67|rgba\(0, 0, 0, 0\)|rgb\(230, 234, 242\)/.test(bc) && bc !== "rgb(43, 169, 76)") f.push("border:" + bc);
      if (f.length) { var k = r + " ." + cls.split(" ")[0] + " " + f.join(" "); viol[k] = (viol[k] || 0) + 1; }
    });
  }
  return { violations: Object.keys(viol).sort(), overflow: over, noHeader: noHeader };
}
if (typeof window !== "undefined") window.vitaUiAudit = vitaUiAudit;
