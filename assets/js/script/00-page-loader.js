// ─── Page loader ─────────────────────────────────────────────────────────────
// The old full-screen frosted loader has been replaced by the #nav-arc SVG
// transition (see 60-spa-navigation.js). Nothing to dismiss on initial load —
// #nav-arc is invisible by default (stroke-dashoffset: 113.1) and only draws
// during SPA navigations when the `arc-drawing` class is added by navigateTo().
