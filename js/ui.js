/* VITA shared UI helpers: logo, icons, small components */
window.VITA = window.VITA || {};

(function (V) {
  /* VITA tree mark (per brand guideline) — fan canopy + forked trunk/roots.
     Drawn as bold round strokes; recolourable. 100×100 viewBox. */
  V.treeMark = function (color) {
    return (
      '<g fill="none" stroke="' + color + '" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round">' +
      // trunk + forked roots
      '<path d="M50 50 V70"/><path d="M50 70 L41 80"/><path d="M50 70 L59 80"/>' +
      // canopy: central + three pairs fanning out
      '<path d="M50 50 V25"/>' +
      '<path d="M50 50 L39 29"/><path d="M50 50 L61 29"/>' +
      '<path d="M50 50 L30 36"/><path d="M50 50 L70 36"/>' +
      '<path d="M50 51 L24 47"/><path d="M50 51 L76 47"/>' +
      "</g>"
    );
  };

  /* tree only (transparent bg) — used inside badges and as a coloured mark */
  V.logo = function (size, color) {
    size = size || 56; color = color || "#2BA94C";
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="VITA">' +
      V.treeMark(color) + "</svg>"
    );
  };

  /* full brandmark — green organic blob with the white tree (primary lockup) */
  V.mark = function (size) {
    size = size || 96;
    return (
      '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="VITA">' +
      '<path d="M50 5 C75 5 93 19 95 43 C97 67 87 95 50 95 C15 95 3 67 5 43 C7 19 25 5 50 5 Z" fill="var(--green)"/>' +
      '<g transform="translate(19,18) scale(0.62)">' + V.treeMark("#ffffff") + "</g>" +
      "</svg>"
    );
  };

  /* circular badge (matches the merchandise stickers) — green disc + white tree */
  V.logoBadge = function (size) {
    size = size || 30;
    return (
      '<span class="logo-badge" style="width:' + size + "px;height:" + size + 'px">' +
      V.logo(Math.round(size * 0.66), "#ffffff") +
      "</span>"
    );
  };

  /* Stroke icon set (2px, rounded) */
  var P = function (d, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" ' + (extra || "") + ">" + d + "</svg>";
  };

  V.icons = {
    home: P('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>'),
    plan: P('<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/><path d="M8 14.5h4M8 17.5h6"/>'),
    chat: P('<path d="M21 12a8.5 8.5 0 0 1-12.4 7.5L3 21l1.6-5.2A8.5 8.5 0 1 1 21 12Z"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01"/>'),
    progress: P('<path d="M4 20V10M10 20V4M16 20v-8M21 20H3"/>'),
    plus: P('<path d="M12 5v14M5 12h14"/>'),
    back: P('<path d="M15 5l-7 7 7 7"/>'),
    next: P('<path d="M5 12h13M13 6l6 6-6 6"/>'),
    check: P('<path d="M4.5 12.5 10 18 19.5 7"/>'),
    bell: P('<path d="M6 9.5a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6"/><path d="M10.2 19.5a2 2 0 0 0 3.6 0"/>'),
    drop: P('<path d="M12 3.5s6.5 6.6 6.5 11A6.5 6.5 0 0 1 5.5 14.5C5.5 10.1 12 3.5 12 3.5Z"/>'),
    bolt: P('<path d="M13 2 5 13.5h6L11 22l8-11.5h-6L13 2Z"/>'),
    heart: P('<path d="M12 20.5C6.5 16.5 3 13.2 3 9.3 3 6.9 4.9 5 7.3 5c1.7 0 3.2.8 4.7 2.7C13.5 5.8 15 5 16.7 5 19.1 5 21 6.9 21 9.3c0 3.9-3.5 7.2-9 11.2Z"/><path d="M7 11.5h3l1.2-2.4 1.7 4 1.2-1.6H17"/>'),
    sparkle: P('<path d="M12 4l1.7 4.8L18.5 10.5l-4.8 1.7L12 17l-1.7-4.8L5.5 10.5l4.8-1.7L12 4Z"/><path d="M18.5 16.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/>'),
    tooth: P('<path d="M7.6 4.5c2 0 2.6 1 4.4 1s2.4-1 4.4-1c2.6 0 4.1 2.1 4.1 4.6 0 2-1 3-1.5 5-.6 2.4-.8 6.4-2.6 6.4-1.6 0-1.4-3.5-2.4-5.4-.5-1-1.5-1-2 0-1 1.9-.8 5.4-2.4 5.4-1.8 0-2-4-2.6-6.4-.5-2-1.5-3-1.5-5C3.5 6.6 5 4.5 7.6 4.5Z"/>'),
    brain: P('<path d="M9.5 3.5A2.8 2.8 0 0 0 6.7 6.3 3.2 3.2 0 0 0 4 9.5c0 .9.3 1.6.9 2.2A3.4 3.4 0 0 0 4 14c0 1.5 1 2.8 2.4 3.2a3 3 0 0 0 3 3.3c.8 0 1.5-.3 2.1-.7V4.6a2.9 2.9 0 0 0-2-1.1Z"/><path d="M14.5 3.5a2.8 2.8 0 0 1 2.8 2.8 3.2 3.2 0 0 1 2.7 3.2c0 .9-.3 1.6-.9 2.2.6.6.9 1.4.9 2.3 0 1.5-1 2.8-2.4 3.2a3 3 0 0 1-3 3.3c-.8 0-1.5-.3-2.1-.7V4.6c.5-.7 1.2-1.1 2-1.1Z"/>'),
    walk: P('<circle cx="13" cy="4.5" r="1.8"/><path d="M9.5 21l2-6.5L9 12.5 10 8l4-1 2.5 3.5 3 1"/><path d="M13.5 14.5 16 21M9.8 8.5 6.5 10.5"/>'),
    smoke: P('<path d="M3.5 16.5h13v3h-13zM19 16.5h1.5v3H19z"/><path d="M17 7.5c1.8 0 3 1.2 3 2.8M14.5 4.5c2.8 0 5 2 5.2 4.8"/>'),
    wine: P('<path d="M8 3.5h8s.5 7-4 7-4-7-4-7ZM12 10.5V20"/><path d="M8.5 20.5h7"/>'),
    food: P('<circle cx="12" cy="13" r="7.5"/><path d="M12 5.5V3M8 6.5 7 4.5M16 6.5l1-2"/><path d="M8.5 13a3.5 3.5 0 0 1 3.5-3.5"/>'),
    moon: P('<path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5Z"/>'),
    sun: P('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5 5l1.8 1.8M17.2 17.2 19 19M19 5l-1.8 1.8M6.8 17.2 5 19"/>'),
    pill: P('<rect x="3" y="9.5" width="18" height="6.5" rx="3.25" transform="rotate(-38 12 12.7)"/><path d="M9.2 9.2l5 6"/>'),
    flask: P('<path d="M9.5 3.5h5M10.5 3.5v5L5 18a2.4 2.4 0 0 0 2.1 3.5h9.8A2.4 2.4 0 0 0 19 18L13.5 8.5v-5"/><path d="M8 14.5h8"/>'),
    calendar: P('<rect x="3.5" y="5" width="17" height="16" rx="3"/><path d="M8 3v4M16 3v4M3.5 10h17"/>'),
    camera: P('<rect x="3" y="7" width="18" height="13" rx="3"/><path d="M9 7l1.4-2.4h3.2L15 7"/><circle cx="12" cy="13.3" r="3.4"/>'),
    upload: P('<path d="M12 16V4.5M7.5 9 12 4.5 16.5 9"/><path d="M4.5 16.5V18A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-1.5"/>'),
    file: P('<path d="M13.5 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5V9.5l-6-6Z"/><path d="M13.5 3.5v6h6"/>'),
    mic: P('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>'),
    send: P('<path d="M21 3 10 14M21 3l-7 18-4-7-7-4 18-7Z"/>'),
    shield: P('<path d="M12 3 5 6v5c0 5 3 8.4 7 10 4-1.6 7-5 7-10V6l-7-3Z"/>'),
    scale: P('<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8a8.5 8.5 0 0 1 6 2.4l-2.2 2.2A5.4 5.4 0 0 0 12 11.2a5.4 5.4 0 0 0-3.8 1.4L6 10.4A8.5 8.5 0 0 1 12 8Z"/>'),
    ruler: P('<rect x="2.5" y="9" width="19" height="6" rx="2"/><path d="M7 9v3M11 9v3M15 9v3M19 9v3" transform="translate(-1.5)"/>'),
    eye: P('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3"/>'),
    warn: P('<circle cx="12" cy="12" r="9"/><path d="M12 7.5V13M12 16.2h.01"/>'),
    info: P('<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8h.01"/>'),
    diamond: P('<path d="M12 3l9 9-9 9-9-9 9-9Z"/><path d="M12 8.5V14M12 16.5h.01" transform="scale(0.001)"/>'),
    question: P('<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3A2.6 2.6 0 0 1 12 7.5c1.4 0 2.5 1 2.5 2.3 0 1.7-2.5 2-2.5 3.7M12 16.6h.01"/>'),
    settings: P('<circle cx="12" cy="12" r="3.2"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.06-.4.1-.8.1-1.2Z"/>'),
    user: P('<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>'),
    skin: P('<circle cx="12" cy="12" r="8.5"/><path d="M8 10.5c.8-1.2 2-1.2 2.8 0M13.2 10.5c.8-1.2 2-1.2 2.8 0M8.5 14.5c1 1.4 2.2 2 3.5 2s2.5-.6 3.5-2"/>'),
    hair: P('<path d="M5 21c0-6 1-13 7-13s7 7 7 13"/><path d="M12 8V3.5M8.5 9 6 5.5M15.5 9 18 5.5"/>'),
    location: P('<path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.6"/>'),
    trend: P('<path d="M3.5 17 9 11.5l3.5 3.5L20.5 7"/><path d="M14.5 7h6v6"/>'),
    flame: P('<path d="M12 3s1 3-1.5 5.5C8.5 10.5 7 12 7 15a5 5 0 0 0 10 0c0-2-1-3.5-2-4.5 0 0-.4 1.6-1.6 2.1.4-2.6-.4-7.1-1.4-9.6Z"/>'),
    x: P('<path d="M6 6l12 12M18 6 6 18"/>'),
    edit: P('<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17l-1 4Z"/><path d="M14.5 7.5l3 3"/>'),
    smile: P('<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01"/>'),
    globe: P('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18 13 13 0 0 1 0-18Z"/>'),
    grid: P('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
  };

  V.icon = function (name, cls) {
    return '<span class="icon ' + (cls || "") + '">' + (V.icons[name] || "") + "</span>";
  };

  /* Brand "jelly element" — glossy gummy in a brand colour with an embossed
     medical icon. The 6 brand elements (per the guideline). Used as the
     collectible reward currency and as brand-flavoured category visuals. */
  V.jellyTypes = {
    cross:   { c: "b-green",   icon: "plus",    label: { ka: "მწვანე", en: "Green" } },
    stetho:  { c: "b-blue",    icon: "heart",   label: { ka: "ლურჯი", en: "Blue" } },
    pill:    { c: "b-crimson", icon: "pill",    label: { ka: "წითელი", en: "Red" } },
    capsule: { c: "b-pink",    icon: "sparkle", label: { ka: "მაჯენტა", en: "Magenta" } },
    vitamin: { c: "b-yellow",  icon: "bolt",    label: { ka: "ოქრო", en: "Gold" } },
    syringe: { c: "b-clear",   icon: "flask",   label: { ka: "გამჭვირვალე", en: "Clear" } },
  };
  V.jelly = function (type, size, cls) {
    var j = V.jellyTypes[type] || V.jellyTypes.cross;
    size = size || 44;
    return '<span class="jelly ' + j.c + " " + (cls || "") + '" style="width:' + size + "px;height:" + size + 'px">' +
      '<span class="jelly__ic">' + (V.icons[j.icon] || "") + "</span></span>";
  };

  /* Tinted icon square (like the Figma list icons) */
  V.iconBox = function (name, tone) {
    return '<span class="icon-box ' + (tone || "gray") + '">' + (V.icons[name] || "") + "</span>";
  };

  V.monthName = function (m) {
    var ka = ["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"];
    var en = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return (V.lang && V.lang() === "ka" ? ka : en)[(m - 1) % 12];
  };
  V.dayName = function (key) {
    var ka = { mon: "ორშაბათი", tue: "სამშაბათი", wed: "ოთხშაბათი", thu: "ხუთშაბათი", fri: "პარასკევი", sat: "შაბათი", sun: "კვირა" };
    var en = { mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday" };
    return (V.lang && V.lang() === "ka" ? ka : en)[key] || key;
  };
  V.dayShort = function (key) {
    var ka = { mon: "ორშ", tue: "სამ", wed: "ოთხ", thu: "ხუთ", fri: "პარ", sat: "შაბ", sun: "კვ" };
    var en = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };
    return (V.lang && V.lang() === "ka" ? ka : en)[key] || key;
  };

  V.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // lightweight transient toast inside the phone frame
  V.toast = function (msg) {
    var host = document.querySelector(".phone") || document.body;
    var el = document.createElement("div");
    el.className = "vtoast";
    el.textContent = msg;
    host.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("on"); });
    setTimeout(function () { el.classList.remove("on"); setTimeout(function () { el.remove(); }, 300); }, 2200);
  };
})(window.VITA);
