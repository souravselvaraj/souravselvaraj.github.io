/*
 * motion.js: the moving parts of the sky in site.css. Loaded by ambient.js (async, same ?v=).
 *
 * CSS does the slow layers, keyed on html.amb-motion, which this file sets while it runs:
 *   clouds and fog drift sideways (faster in wind), the sun or moon glow breathes, sun rays turn.
 * One fixed <canvas> behind the page does the rest, from the attributes ambient.js sets on <html>:
 *   rain     slanting streaks (data-amb-wx = rain | storm; storm adds a faint lightning flash)
 *   snow     flakes that sway and drift downwind
 *   wind     thin gust lines crossing the sky, and leaves tumbling across downwind
 *            (data-amb-wind = breezy | windy; no leaves in snow)
 *   night    twinkling stars and a rare shooting star (phase night, clear or partly cloudy)
 *
 * Rain, snow, leaves and gusts cover the whole window, over the text too (a deliberate choice: the
 * weather is meant to be seen); they are thin and translucent so the text stays readable. Stars stay
 * in the sky, fading out by 75% of the window height like the sky gradient.
 * Cost: one requestAnimationFrame loop, stopped when the scene has nothing to draw, while the tab is
 * hidden, and under prefers-reduced-motion or after "Pause animation" (ambient.js's credit line; then
 * html.amb-motion is removed and the static CSS sky returns, including its static rain and snow).
 */
(function () {
  "use strict";

  var root = document.documentElement;
  var A = window.ambient || (window.ambient = {});
  if (A.motion || !document.body || !window.requestAnimationFrame) return;
  var canvas = document.createElement("canvas");
  var ctx = canvas.getContext && canvas.getContext("2d");
  if (!ctx) return;
  canvas.className = "amb-motion";
  canvas.setAttribute("aria-hidden", "true");
  document.body.insertBefore(canvas, document.body.firstChild);

  var reduce = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  var W = 0;
  var H = 0;
  var scene = null;
  var raf = 0;
  var last = 0;

  // Seeded generator (mulberry32), so a resize or scene change does not reshuffle the stars.
  function rng(seed) {
    return function () {
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** CSS colour token -> [r, g, b] (registered tokens compute to rgb(); fallbacks may be hex). */
  function token(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (m)
      return [0, 2, 4].map(function (i) {
        return parseInt(m[1].substr(i, 2), 16);
      });
    var n = v.match(/[\d.]+/g);
    return n && n.length >= 3 ? [+n[0], +n[1], +n[2]] : fallback;
  }

  function rgba(c, a) {
    return "rgba(" + Math.round(c[0]) + "," + Math.round(c[1]) + "," + Math.round(c[2]) + "," + a.toFixed(3) + ")";
  }

  /** Sky objects (stars, meteors): full near the top, fading out by fadeEnd of the window height. */
  function skyFade(y, fadeEnd) {
    var t = y / (H * fadeEnd);
    var fade = t <= 0.2 ? 1 : t >= 1 ? 0 : 1 - (t - 0.2) / 0.8;
    return fade * fade;
  }

  function measure() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ------------------------------------------------------------------------------------------ scene

  function build() {
    var phase = root.getAttribute("data-amb-phase") || "day";
    var wx = root.getAttribute("data-amb-wx") || "clear";
    var wind = root.getAttribute("data-amb-wind") || "calm";
    var dark = root.getAttribute("data-theme") === "dark";
    var from = A.state && typeof A.state.windFrom === "number" ? A.state.windFrom : 270;
    // Meteorological direction is where the wind comes FROM; a westerly (180..360) blows left to right.
    var dir = from > 0 && from < 180 ? -1 : 1;
    var w = { calm: 0.12, breezy: 0.45, windy: 0.9 }[wind] || 0.12;
    var area = W * H;
    var s = {
      phase: phase,
      wx: wx,
      dark: dark,
      wind: w,
      dir: dir,
      text: token("--amb-text", dark ? [200, 195, 190] : [50, 50, 45]),
      glow: token("--amb-glow", [255, 250, 230]),
      drops: [],
      flakes: [],
      stars: [],
      gusts: [],
      gustRate: wind === "windy" ? 1.6 : wind === "breezy" ? 0.5 : 0, // new gusts per second
      leaves: [],
      leafRate: wx === "snow" ? 0 : wind === "windy" ? 1.4 : wind === "breezy" ? 0.7 : 0, // new leaves per second
      leafMax: wind === "windy" ? 18 : 10,
      leafColours: leafColours(dark),
      storm: wx === "storm",
      flash: 0,
      nextFlash: 4 + Math.random() * 8,
      meteor: null,
      nextMeteor: 6 + Math.random() * 20,
    };
    var i;
    if (wx === "rain" || wx === "storm") {
      var nd = Math.min(Math.round((area / 3400) * (s.storm ? 1.5 : 1)), 420);
      for (i = 0; i < nd; i++) s.drops.push(drop(s, true));
    }
    if (wx === "snow") {
      var nf = Math.min(Math.round(area / 6500), 220);
      for (i = 0; i < nf; i++) s.flakes.push(flake(s, true));
    }
    if (phase === "night" && (wx === "clear" || wx === "partly")) {
      var g = rng(20261021);
      var ns = Math.min(Math.round((W * H * 0.7) / (wx === "partly" ? 9000 : 4500)), 220);
      for (i = 0; i < ns; i++) {
        s.stars.push({
          x: g() * W,
          y: Math.pow(g(), 1.3) * H * 0.7, // denser near the top
          r: 0.6 + g() * g() * 1.5,
          a: 0.5 + g() * 0.5,
          f: 0.3 + g() * 1.2, // twinkle rate, rad/s
          p: g() * 6.283,
        });
      }
    }
    s.idle = !s.drops.length && !s.flakes.length && !s.stars.length && !s.gustRate && !s.leafRate && !s.storm;
    return s;
  }

  function drop(s, anywhere) {
    var vy = (s.storm ? 1100 : 820) * (0.75 + Math.random() * 0.5);
    var y = anywhere ? Math.random() * H : -30 - Math.random() * 100;
    var vx = s.dir * vy * (0.08 + s.wind * 0.45);
    return {
      x: Math.random() * W + (vx / vy) * (y - H * 0.5), // upwind of where it will be half-way down
      y: y,
      vy: vy,
      vx: vx,
      len: 10 + Math.random() * 12,
      a: 0.16 + Math.random() * 0.14,
    };
  }

  function flake(s, anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : -10 - Math.random() * 60,
      vy: 28 + Math.random() * 42,
      r: 1.2 + Math.random() * 2,
      sway: 10 + Math.random() * 18,
      f: 0.6 + Math.random() * 1.2,
      p: Math.random() * 6.283,
      a: 0.55 + Math.random() * 0.4,
    };
  }

  /** Olive, amber, rust and ochre, a little of the way to the sky colour so they sit in the palette. At night they
      stay nearly as bright as by day: darker leaves vanish against the night sky. */
  function leafColours(dark) {
    var sky = token("--amb-sky", dark ? [25, 34, 61] : [196, 227, 246]);
    return [
      [122, 138, 74],
      [192, 138, 62],
      [166, 90, 58],
      [160, 128, 62],
    ].map(function (b) {
      return b.map(function (v, i) {
        return dark ? v * 0.92 * 0.85 + sky[i] * 0.15 : v * 0.75 + sky[i] * 0.25;
      });
    });
  }

  function leaf(s) {
    return {
      x: s.dir > 0 ? -20 : W + 20,
      y: 10 + Math.random() * H * 0.55,
      vx: s.dir * (110 + Math.random() * 170) * (0.55 + s.wind * 0.7),
      vy: -20 + Math.random() * 40,
      size: 8 + Math.random() * 6,
      rot: Math.random() * 6.283,
      spin: (Math.random() - 0.5) * 5, // rad/s
      flip: 1 + Math.random() * 1.8, // rad/s: the leaf turning over, drawn as a squash
      p: Math.random() * 6.283,
      t: 0,
      c: Math.floor(Math.random() * 4),
    };
  }

  function gust(s) {
    var len = 90 + Math.random() * 170;
    return {
      x: s.dir > 0 ? -len : W + len,
      y: 30 + Math.random() * H * 0.55,
      len: len,
      v: s.dir * (380 + Math.random() * 360) * (0.6 + s.wind * 0.6),
      bend: (Math.random() - 0.5) * 18,
      t: 0,
      life: 1.6 + Math.random() * 1.4,
    };
  }

  // ------------------------------------------------------------------------------------------- draw

  function frame(now) {
    raf = 0;
    if (!scene) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    var s = scene;
    var c = s.text;
    var i;
    var k;
    ctx.clearRect(0, 0, W, H);

    if (s.storm) {
      s.nextFlash -= dt;
      if (s.nextFlash <= 0) {
        s.flash = 1;
        s.nextFlash = 7 + Math.random() * 14;
      }
      if (s.flash > 0) {
        // one soft flash with a weaker second pulse; well under 3 flashes per second
        var fa = s.flash > 0.6 ? (s.flash - 0.6) * 2.5 : s.flash < 0.35 ? s.flash * 1.4 : 0;
        ctx.fillStyle = rgba(s.dark ? [190, 200, 255] : [255, 255, 255], 0.07 * fa);
        ctx.fillRect(0, 0, W, H);
        s.flash = Math.max(0, s.flash - dt * 1.6);
      }
    }

    if (s.stars.length) {
      var t = now / 1000;
      var sc = s.dark ? [255, 248, 235] : [255, 255, 255];
      for (i = 0; i < s.stars.length; i++) {
        var st = s.stars[i];
        k = skyFade(st.y, 0.75);
        if (k < 0.02) continue;
        var tw = 0.6 + 0.4 * Math.sin(t * st.f + st.p);
        if (st.r > 1.4) {
          ctx.fillStyle = rgba(sc, 0.12 * st.a * tw * k); // halo on the brighter stars
          ctx.beginPath();
          ctx.arc(st.x, st.y, st.r * 3, 0, 6.283);
          ctx.fill();
        }
        ctx.fillStyle = rgba(sc, st.a * tw * k);
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 6.283);
        ctx.fill();
      }
      s.nextMeteor -= dt;
      if (!s.meteor && s.nextMeteor <= 0 && s.wx === "clear") {
        s.meteor = { x: Math.random() * W, y: Math.random() * H * 0.25, vx: (Math.random() < 0.5 ? -1 : 1) * 520, vy: 240, t: 0 };
        s.nextMeteor = 25 + Math.random() * 45;
      }
      if (s.meteor) {
        var m = s.meteor;
        m.t += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        var ma = Math.sin(Math.min(m.t / 0.9, 1) * Math.PI) * skyFade(m.y, 0.6);
        var gr = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * 0.16, m.y - m.vy * 0.16);
        gr.addColorStop(0, rgba(sc, 0.8 * ma));
        gr.addColorStop(1, rgba(sc, 0));
        ctx.strokeStyle = gr;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * 0.16, m.y - m.vy * 0.16);
        ctx.stroke();
        if (m.t > 0.9) s.meteor = null;
      }
    }

    if (s.drops.length) {
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (i = 0; i < s.drops.length; i++) {
        var d = s.drops[i];
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.y > H + 30 || (d.vx > 0 && d.x > W + 120) || (d.vx < 0 && d.x < -120)) {
          s.drops[i] = d = drop(s, false);
        }
        var ux = d.vx / d.vy;
        ctx.strokeStyle = rgba(c, d.a * (s.dark ? 1.15 : 1));
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - ux * d.len, d.y - d.len);
        ctx.stroke();
      }
    }

    if (s.flakes.length) {
      var tt = now / 1000;
      var fill = s.dark ? rgba(c, 1) : "#fff";
      var ring = rgba(c, s.dark ? 0 : 0.32); // white flakes need an edge on a pale sky
      for (i = 0; i < s.flakes.length; i++) {
        var f = s.flakes[i];
        f.y += f.vy * dt;
        f.x += (s.dir * s.wind * 70 + Math.cos(tt * f.f + f.p) * f.sway * f.f) * dt;
        if (f.y > H + 10) s.flakes[i] = f = flake(s, false);
        if (f.x > W + 10) f.x -= W + 20;
        if (f.x < -10) f.x += W + 20;
        ctx.globalAlpha = f.a * (s.dark ? 0.55 : 1);
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fill();
        if (!s.dark) {
          ctx.strokeStyle = ring;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    }

    if (s.gustRate) {
      if (Math.random() < s.gustRate * dt) s.gusts.push(gust(s));
      ctx.lineWidth = 1.1;
      ctx.lineCap = "round";
      for (i = s.gusts.length - 1; i >= 0; i--) {
        var g = s.gusts[i];
        g.t += dt;
        g.x += g.v * dt;
        if (g.t > g.life) {
          s.gusts.splice(i, 1);
          continue;
        }
        var env = Math.sin((g.t / g.life) * Math.PI);
        var tail = g.x - s.dir * g.len;
        ctx.strokeStyle = rgba(c, 0.2 * env * (s.dark ? 1.2 : 1));
        ctx.beginPath();
        ctx.moveTo(tail, g.y);
        ctx.quadraticCurveTo((tail + g.x) / 2, g.y + g.bend, g.x, g.y - g.bend * 0.3);
        ctx.stroke();
      }
    }

    if (s.leafRate) {
      if (s.leaves.length < s.leafMax && Math.random() < s.leafRate * dt) s.leaves.push(leaf(s));
      for (i = s.leaves.length - 1; i >= 0; i--) {
        var L = s.leaves[i];
        L.t += dt;
        L.x += L.vx * dt * (1 + 0.35 * Math.sin(L.t * 1.3 + L.p)); // gusty: speeds up and slows down
        L.vy += 7 * dt; // slowly sinking
        L.y += (L.vy + 22 * Math.sin(L.t * 2.1 + L.p)) * dt; // and fluttering
        L.rot += L.spin * dt;
        if ((s.dir > 0 && L.x > W + 30) || (s.dir < 0 && L.x < -30) || L.y > H + 30) {
          s.leaves.splice(i, 1);
          continue;
        }
        var sq = Math.cos(L.t * L.flip + L.p);
        ctx.save();
        ctx.translate(L.x, L.y);
        ctx.rotate(L.rot);
        ctx.scale(1, 0.35 + 0.65 * Math.abs(sq)); // never edge-on: a sliver reads as a scratch
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = rgba(s.leafColours[L.c], 1);
        ctx.beginPath(); // a pointed oval: two curves from tip to tip
        ctx.moveTo(-L.size, 0);
        ctx.quadraticCurveTo(0, -L.size * 0.95, L.size, 0);
        ctx.quadraticCurveTo(0, L.size * 0.95, -L.size, 0);
        ctx.fill();
        ctx.strokeStyle = rgba(
          s.leafColours[L.c].map(function (v) {
            return v * 0.7;
          }),
          1
        );
        ctx.lineWidth = 0.7;
        ctx.beginPath(); // midrib and a short stem
        ctx.moveTo(-L.size * 1.25, 0);
        ctx.lineTo(L.size * 0.8, 0);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }

    schedule();
  }

  function schedule() {
    if (!raf && scene && !scene.idle && !document.hidden) raf = window.requestAnimationFrame(frame);
  }

  function stop() {
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
  }

  /** The visitor pressed "Pause animation" (ambient.js keeps the choice in localStorage). */
  function paused() {
    try {
      return JSON.parse(window.localStorage.getItem("amb.motion.v1")) === "off";
    } catch (e) {
      return false;
    }
  }

  function start() {
    stop();
    if ((reduce && reduce.matches) || paused()) {
      scene = null;
      ctx.clearRect(0, 0, W, H);
      root.classList.remove("amb-motion");
      return;
    }
    measure();
    scene = build();
    root.classList.add("amb-motion");
    ctx.clearRect(0, 0, W, H);
    schedule();
  }

  start();

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(start, 150);
  });
  window.addEventListener("storage", function (e) {
    if (e.key === "amb.motion.v1") start(); // paused or resumed in another tab
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else schedule();
  });
  if (reduce) {
    if (reduce.addEventListener) reduce.addEventListener("change", start);
    else if (reduce.addListener) reduce.addListener(start);
  }
  var sceneTimer = 0;
  new MutationObserver(function () {
    // after the 1.6 s palette fade has moved the tokens this scene's colours are read from
    window.clearTimeout(sceneTimer);
    sceneTimer = window.setTimeout(start, 50);
    window.setTimeout(function () {
      if (scene) scene.text = token("--amb-text", scene.text);
    }, 1700);
  }).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-amb-phase", "data-amb-wx", "data-amb-wind"] });

  A.motion = {
    restart: start,
    scene: function () {
      return scene;
    },
  };
})();
