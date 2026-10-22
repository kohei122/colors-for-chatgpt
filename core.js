/* Shared, dependency-free rules. No page or network access. */
(function (root) {
  "use strict";
  const palette = ["#2563eb", "#c2410c", "#15803d", "#7e22ce", "#be123c", "#0e7490", "#a16207", "#4338ca"];
  function threadId(value) {
    try {
      const u = new URL(value, "https://chatgpt.com");
      if (u.origin !== "https://chatgpt.com") return null;
      // Only real conversation routes; never group unsaved chats under one key.
      const m = u.pathname.match(/^\/(?:g\/[^/]+\/)?c\/([a-zA-Z0-9-]+)\/?$/);
      return m ? m[1] : null;
    } catch { return null; }
  }
  function defaultColor(id) {
    let hash = 2166136261;
    for (const ch of id || "") hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619);
    return palette[(hash >>> 0) % palette.length];
  }
  function settings(value, id) {
    const v = value && typeof value === "object" ? value : {};
    const bounded = (n, min, max, fallback) => Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
    return {
      color: typeof v.color === "string" && /^#[0-9a-f]{6}$/i.test(v.color) ? v.color.toLowerCase() : defaultColor(id),
      height: bounded(v.height, 40, 88, 56),
      fontSize: bounded(v.fontSize, 18, 36, 26),
      border: bounded(v.border, 0, 12, 6),
      textMode: ["auto", "vivid", "custom"].includes(v.textMode) ? v.textMode : "auto",
      textColor: typeof v.textColor === "string" && /^#[0-9a-f]{6}$/i.test(v.textColor) ? v.textColor.toLowerCase() : "#ffffff",
      alignment: ["left", "center", "right"].includes(v.alignment) ? v.alignment : "left"
    };
  }
  function luminance(hex) {
    const rgb = hex.slice(1).match(/../g).map(x => {
      const s = parseInt(x, 16) / 255;
      return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(a, b) {
    const x = luminance(a), y = luminance(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
  }
  function foreground(hex) {
    const l = luminance(hex);
    return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
  }
  function hsl(hex) {
    const [r,g,b] = hex.slice(1).match(/../g).map(x => parseInt(x,16)/255);
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max-min, l = (max+min)/2;
    const h = !d ? 0 : 60 * (max === r ? ((g-b)/d+6)%6 : max === g ? (b-r)/d+2 : (r-g)/d+4);
    return [h, d ? d/(1-Math.abs(2*l-1)) : 0, l];
  }
  function fromHsl(h,s,l) {
    const a = s*Math.min(l,1-l);
    return '#' + [0,8,4].map(n => {
      const k = (n+h/30)%12;
      return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1)))).toString(16).padStart(2,'0');
    }).join('');
  }
  function vividForeground(bg) {
    const [h,s] = hsl(bg);
    const hues = s < .15 ? [0,30,60,90,120,150,180,210,240,270,300,330] : [180,150,210,120,240,90,270].map(d => (h+d)%360);
    let best = foreground(bg), score = -Infinity;
    for (const hue of hues) for (const sat of [1,.85,.7]) for (let light=6; light<=94; light+=2) {
      const candidate = fromHsl(hue,sat,light/100);
      if (contrast(bg,candidate)<4.5) continue;
      const [ch,cs,cl] = hsl(candidate);
      const chroma = cs*(1-Math.abs(2*cl-1));
      if (chroma < .12) continue;
      const distance = Math.min(Math.abs(ch-h),360-Math.abs(ch-h))/180;
      const value = .65*chroma + .35*distance*Math.min(1,s/.15);
      if (value>score) {score=value;best=candidate;}
    }
    return best;
  }
  function textForeground(cfg) {
    return cfg.textMode === 'custom' ? cfg.textColor : cfg.textMode === 'vivid' ? vividForeground(cfg.color) : foreground(cfg.color);
  }
  function pageTitle(value) {
    const s = String(value || "").replace(/\s*[|–—-]\s*ChatGPT\s*$/i, "").trim();
    return /^(ChatGPT|New chat|新しいチャット)$/i.test(s) ? "" : s;
  }
  const api = {palette, threadId, defaultColor, settings, foreground, contrast, vividForeground, textForeground, pageTitle};
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.ThreadColorsCore = api;
})(globalThis);
