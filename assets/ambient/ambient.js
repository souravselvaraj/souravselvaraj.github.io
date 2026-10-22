/*
 * ambient.js (v6): weather x time theme engine and small navigation aids for souravselvaraj.github.io.
 *
 * Loaded with `defer` from footer_text in _config.yml (the gem layouts have no other script hook; the footer
 * is hidden by site.css, but scripts inside it still run). All colours live in assets/ambient/site.css; this
 * file only sets attributes on <html> and inserts a few small pieces of markup.
 *
 * The inline boot that precedes it in footer_text has already, before first paint:
 *   - set html[data-amb-phase] from the sun at a cached or guessed place, and html[data-amb-wx] from the
 *     cached weather class;
 *   - made the theme toggle's "system" setting automatic (dark at night, light from dawn to dusk, whatever the
 *     OS prefers: the page follows the visitor's sky; "Light" and "Dark" on the toggle still override it) by
 *     reassigning theme.js's determineComputedTheme;
 *   - exposed window.ambient = { load, solarElevation, phaseAt, now, state, autoMode, applyThemeQuiet }.
 * This file refines that state:
 *   place   visitor's time zone -> principal city of that zone (zones.min.js, IANA tz; no permission
 *           prompt); unknown zone -> Worcester, MA. Cached in localStorage "amb.place.v1".
 *   phase   solar elevation h at the place: day h >= 6 deg, night h < -6 deg (below civil twilight),
 *           dawn / dusk in between (rising / falling). Re-evaluated every 60 s and on visibility changes.
 *   mode    light/dark ("system" setting = automatic) never crossfades: see update().
 *   weather Open-Meteo current WMO weather code -> class, cached 30 min in localStorage "amb.wx.v1".
 *   wind    the same reading's 10 m wind speed -> html[data-amb-wind] = calm (< 6 km/h) | breezy (< 20) |
 *           windy; absent when unknown. state.windFrom keeps the direction it blows from (degrees).
 *           While a reading is in use, a muted "Weather data by Open-Meteo.com" line ends the main column
 *           (the CC BY 4.0 licence asks for a visible link where the data are used).
 *   motion  motion.js (loaded from here) animates the sky: drifting clouds, sun rays, rain, snow, wind
 *           gusts and blown leaves, stars. It stays off under prefers-reduced-motion.
 *   nav     brand on every page, aria-current, skip link, search label, "<- Projects" and a
 *           previous/next pager on project pages, contact icons under the About photo.
 *
 * Preview parameters (read by the boot and by this file):
 *   ?amb=0                    no theme engine (static palette, stock toggle meaning); nav aids still run
 *   ?amb-phase=dawn|day|dusk|night
 *   ?amb-wx=clear|partly|overcast|rain|snow|fog|storm
 *   ?amb-wind=calm|breezy|windy
 *   ?amb-motion=0             no animation (the static sky stays)
 *   ?amb-time=ISO-8601        set the clock
 *   ?amb-loc=LAT,LON          set the place (degrees, north- and east-positive)
 */
(function () {
  "use strict";

  var script = document.currentScript;
  var root = document.documentElement;
  var q = new URLSearchParams(window.location.search);
  var V = script && script.src ? new URL(script.src).search : ""; // "?v=5": cache-buster reused below
  var ver = (/[?&]v=([^&]+)/.exec(V) || [])[1] || "0";
  var A = window.ambient || {};
  var hasEngine = typeof A.phaseAt === "function" && q.get("amb") !== "0";

  var PHASES = ["dawn", "day", "dusk", "night"];
  var WEATHERS = ["clear", "partly", "overcast", "rain", "snow", "fog", "storm"];
  var WINDS = ["calm", "breezy", "windy"];
  var WORCESTER = { lat: 42.27, lon: -71.81, label: "Worcester" };
  var PLACE_KEY = "amb.place.v1";
  var WX_KEY = "amb.wx.v1";
  var WX_FRESH = 30 * 60e3; // a reading this young stops a new request
  var WX_STALE = 3 * 3600e3; // shown for at most 3 h when a request fails
  var WX_BACKOFF = 10 * 60e3; // after a failure, no new request for 10 min (this page)

  function asset(file) {
    return script && script.src ? new URL(file + V, script.src).href : "/assets/ambient/" + file + V;
  }

  var store = {
    get: function (k) {
      try {
        return JSON.parse(window.localStorage.getItem(k));
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        window.localStorage.setItem(k, JSON.stringify(v));
      } catch (e) {
        /* private mode or blocked storage: run without a cache */
      }
    },
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  /** theme.js's stored setting ("system" | "light" | "dark"), or null if theme.js is missing or storage throws. */
  function themeSetting() {
    try {
      return typeof determineThemeSetting === "function" ? determineThemeSetting() : null;
    } catch (e) {
      return null;
    }
  }

  // ------------------------------------------------------------------------------------- navigation aids

  var path = window.location.pathname.replace(/index\.html$/, "");
  if (path.slice(-1) !== "/" && !/\.[a-z0-9]+$/i.test(path)) path += "/";

  function pageKind() {
    if (path === "/") return "about";
    var m = /^\/(projects|publications|cv|blog|photography|news)\/(.*)$/.exec(path);
    if (!m) return "other";
    if (m[1] === "projects") return m[2] ? "project" : "projects";
    return m[1];
  }

  function header() {
    var bar = document.querySelector("#navbar > .container");
    // The gem omits the brand on About; insert it so the header is the same on every page.
    if (bar && !bar.querySelector(".navbar-brand")) {
      var meta = document.querySelector('meta[name="author"]');
      var h1 = document.querySelector(".post-header .post-title");
      var name = (meta && meta.content) || (h1 ? h1.textContent.replace(/\s+/g, " ").trim() : "Home");
      bar.insertBefore(el("a", { class: "navbar-brand title", href: "/", "aria-current": "page" }, [name]), bar.firstChild);
    }
    // aria-current: "page" on the page itself, "true" for the section (Projects on a project page).
    var active = document.querySelector("#navbar .nav-item.active > .nav-link");
    if (active) {
      var href = new URL(active.getAttribute("href"), window.location.href).pathname;
      active.setAttribute("aria-current", href === path ? "page" : "true");
    }
    // Search: icon only on wide screens, "Search" label in the phone menu, shortcut in the tooltip.
    var search = document.getElementById("search-toggle");
    var label = search && search.querySelector(".nav-link");
    if (label && !label.querySelector(".nav-label")) {
      Array.prototype.slice.call(label.childNodes).forEach(function (n) {
        if (n.nodeType === 3) label.removeChild(n);
      });
      var icon = label.querySelector("i");
      if (icon) icon.setAttribute("aria-hidden", "true");
      label.appendChild(el("span", { class: "nav-label" }, ["Search"]));
      var mac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent || "");
      var text = "Search (" + (mac ? "⌘ K" : "Ctrl K") + ")";
      search.title = text;
      search.setAttribute("aria-label", text);
    }
  }

  function skipLink() {
    var main = document.querySelector('[role="main"]');
    if (!main || document.querySelector(".amb-skip")) return;
    if (!main.id) main.id = "main";
    document.body.insertBefore(el("a", { class: "amb-skip", href: "#" + main.id }, ["Skip to content"]), document.body.firstChild);
  }

  function crumb() {
    var head = document.querySelector(".post > .post-header");
    if (!head || head.querySelector(".amb-crumb")) return;
    var arrow = el("span", { "aria-hidden": "true" }, ["← "]);
    var nav = el("nav", { class: "amb-crumb", "aria-label": "Breadcrumb" }, [el("a", { href: "/projects/" }, [arrow, "Projects"])]);
    head.insertBefore(nav, head.firstChild);
  }

  function renderPager(list) {
    var article = document.querySelector(".post > article");
    if (!article || !Array.isArray(list) || document.querySelector(".amb-pager")) return;
    var here = -1;
    list.forEach(function (p, i) {
      if (p && p.url === path) here = i;
    });
    if (here < 0) return;
    var kids = [];
    var prev = list[here - 1];
    var next = list[here + 1];
    if (prev) kids.push(el("a", { class: "amb-prev", rel: "prev", href: prev.url }, [el("span", {}, ["← Previous"]), el("b", {}, [prev.title])]));
    if (next) kids.push(el("a", { class: "amb-next", rel: "next", href: next.url }, [el("span", {}, ["Next →"]), el("b", {}, [next.title])]));
    kids.push(el("a", { class: "amb-all", href: "/projects/" }, ["All projects"]));
    article.parentNode.insertBefore(el("nav", { class: "amb-pager", "aria-label": "More projects" }, kids), article.nextSibling);
  }

  function pager() {
    var key = "amb.projects.v" + ver;
    var cached = null;
    try {
      cached = JSON.parse(window.sessionStorage.getItem(key));
    } catch (e) {
      cached = null;
    }
    if (cached) return renderPager(cached);
    if (!window.fetch) return;
    window
      .fetch(asset("projects.json"), { credentials: "same-origin" })
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(r.status);
      })
      .then(function (list) {
        try {
          window.sessionStorage.setItem(key, JSON.stringify(list));
        } catch (e) {
          /* no session storage: fetch again next page */
        }
        renderPager(list);
      })
      .catch(function () {
        /* the "<- Projects" link alone */
      });
  }

  /** Marks each edge of a wide table that has more columns behind it; site.css fades the table toward it. */
  function tableCues() {
    var tables = document.querySelectorAll(".post article > table");
    if (!tables.length) return;
    var mark = function () {
      Array.prototype.forEach.call(tables, function (t) {
        var more = t.scrollWidth - t.clientWidth;
        t.classList.toggle("amb-more-l", more > 1 && t.scrollLeft > 1);
        t.classList.toggle("amb-more-r", more > 1 && t.scrollLeft < more - 1);
      });
    };
    Array.prototype.forEach.call(tables, function (t) {
      t.addEventListener("scroll", mark, { passive: true });
    });
    window.addEventListener("resize", mark);
    window.addEventListener("load", mark); // images and fonts can change the widths
    mark();
  }

  function navAids() {
    var kind = pageKind();
    root.setAttribute("data-amb-page", kind);
    skipLink();
    header();
    if (kind === "project") {
      crumb();
      pager();
    }
    tableCues();
    if (kind === "about") {
      var social = document.querySelector(".post .social");
      var profile = document.querySelector(".post .profile");
      if (social && profile && social.parentNode !== profile) profile.appendChild(social);
    }
    if (kind === "cv") {
      var pdf = document.querySelector(".post-title a.float-right");
      if (pdf) {
        pdf.setAttribute("aria-label", "Download CV (PDF)");
        pdf.title = "Download CV (PDF)";
        var i = pdf.querySelector("i");
        if (i) i.setAttribute("aria-hidden", "true");
      }
    }
  }

  // ------------------------------------------------------------------------------------- theme engine

  var state = A.state || { place: null, phase: root.getAttribute("data-amb-phase"), wx: root.getAttribute("data-amb-wx") || "" };
  var forcedPhase = PHASES.indexOf(q.get("amb-phase")) >= 0 ? q.get("amb-phase") : null;
  var forcedWx = WEATHERS.indexOf(q.get("amb-wx")) >= 0 ? q.get("amb-wx") : null;
  var forcedWind = WINDS.indexOf(q.get("amb-wind")) >= 0 ? q.get("amb-wind") : null;
  var forcedLoc = /^(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/.exec(q.get("amb-loc") || "");

  function timeZone() {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch (e) {
      return "";
    }
  }

  /** Calls done(place) once the place is known: synchronously when cached, else after zones.min.js loads. */
  function resolvePlace(done) {
    if (forcedLoc) return done({ lat: +forcedLoc[1], lon: +forcedLoc[2], label: "" });
    var tz = timeZone();
    var cached = store.get(PLACE_KEY);
    if (cached && cached.tz === tz && typeof cached.lat === "number" && typeof cached.lon === "number") return done(cached);
    var tag = document.createElement("script");
    tag.src = asset("zones.min.js");
    tag.async = true;
    tag.onload = function () {
      var Z = window.AMB_ZONES;
      if (!Z || !Z.z) return; // keep the boot's guess for this page; nothing is cached
      var name = Z.z[tz] ? tz : Z.a && Z.a[tz];
      var hit = name && Z.z[name];
      var place = hit
        ? { tz: tz, lat: hit[0], lon: hit[1], label: name.split("/").pop().replace(/_/g, " ") }
        : { tz: tz, lat: WORCESTER.lat, lon: WORCESTER.lon, label: WORCESTER.label };
      store.set(PLACE_KEY, place);
      done(place);
    };
    tag.onerror = function () {
      /* zones table unavailable: the boot's guess stays for this page (not cached), no weather request */
    };
    document.head.appendChild(tag);
  }

  /** WMO weather interpretation code (Open-Meteo current.weather_code) -> weather class, or "" if unknown. */
  function classify(code) {
    if (typeof code !== "number") return "";
    if (code === 0 || code === 1) return "clear";
    if (code === 2) return "partly";
    if (code === 3) return "overcast";
    if (code === 45 || code === 48) return "fog";
    if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return "rain"; // drizzle, rain, freezing, showers
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
    if (code === 95 || code === 96 || code === 99) return "storm";
    return "";
  }

  function setWx(wx) {
    state.wx = wx || "";
    if ((root.getAttribute("data-amb-wx") || "") === state.wx) return; // unchanged: no mutation, no fade
    if (state.wx) root.setAttribute("data-amb-wx", state.wx);
    else root.removeAttribute("data-amb-wx");
  }

  /** Open-Meteo wind_speed_10m (km/h) -> wind class. Beaufort: 0-1 calm (< 6), 2-3 light and gentle breeze, 4+ windy. */
  function windClass(kmh) {
    if (typeof kmh !== "number") return "";
    return kmh < 6 ? "calm" : kmh < 20 ? "breezy" : "windy";
  }

  function setWind(reading) {
    var wind = forcedWind || windClass(reading && reading.kmh);
    state.windFrom = reading && typeof reading.dir === "number" ? reading.dir : null;
    if ((root.getAttribute("data-amb-wind") || "") === wind) return;
    if (wind) root.setAttribute("data-amb-wind", wind);
    else root.removeAttribute("data-amb-wind");
  }

  /** Weather class and wind from one reading (null: unknown). */
  function applyReading(w) {
    setWx(w ? w.wx : "");
    setWind(w);
  }

  // A reading fetched for an ?amb-loc preview stays in memory, so it never replaces the visitor's own cached one.
  var previewWx = null;

  /** The cached reading for this place if it is at most maxAge old, else null. */
  function cachedWx(maxAge) {
    var w = forcedLoc ? previewWx : store.get(WX_KEY);
    var p = state.place;
    if (!w || typeof w.at !== "number" || Date.now() - w.at > maxAge) return null;
    if (p && !p.guess && (Math.abs(w.lat - p.lat) > 0.5 || Math.abs(w.lon - p.lon) > 0.5)) return null;
    return w;
  }

  var inflight = false;
  var lastFail = 0;
  function weather() {
    if (forcedWx) return setWind(cachedWx(WX_STALE)); // a weather preview keeps the last real wind
    var p = state.place;
    if (!p || p.guess) return; // only for a resolved place
    var fresh = cachedWx(WX_FRESH);
    if (fresh && "kmh" in fresh) return applyReading(fresh); // readings cached before v6 have no wind field: refetch
    var conn = navigator.connection;
    if (
      inflight ||
      document.hidden || // deferred until the tab is visible (visibilitychange)
      !window.fetch ||
      navigator.onLine === false ||
      (conn && conn.saveData) ||
      navigator.globalPrivacyControl === true ||
      (script && script.getAttribute("data-weather") === "off") ||
      Date.now() - lastFail < WX_BACKOFF
    ) {
      applyReading(cachedWx(WX_STALE));
      return;
    }
    inflight = true;
    var ctl = window.AbortController ? new AbortController() : null;
    var timer = window.setTimeout(function () {
      if (ctl) ctl.abort();
    }, 5000);
    var url =
      "https://api.open-meteo.com/v1/forecast?latitude=" +
      p.lat.toFixed(2) +
      "&longitude=" +
      p.lon.toFixed(2) +
      "&current=weather_code,wind_speed_10m,wind_direction_10m";
    window
      .fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        return r.ok ? r.json() : Promise.reject(new Error("HTTP " + r.status));
      })
      .then(function (j) {
        var code = j && j.current ? j.current.weather_code : undefined;
        if (typeof code !== "number") throw new Error("no weather_code");
        var wx = classify(code);
        var c = j.current;
        var reading = {
          wx: wx,
          kmh: typeof c.wind_speed_10m === "number" ? c.wind_speed_10m : null, // null (not undefined) survives JSON
          dir: c.wind_direction_10m,
          at: Date.now(),
          lat: p.lat,
          lon: p.lon,
        };
        if (forcedLoc) previewWx = reading;
        else store.set(WX_KEY, reading);
        applyReading(reading);
      })
      .catch(function () {
        lastFail = Date.now();
        applyReading(cachedWx(WX_STALE));
      })
      .then(function () {
        window.clearTimeout(timer);
        inflight = false;
      });
  }

  /** Runs fn with the slow token fade (html.amb-live) off, so whatever fn changes lands in one frame. */
  function quietly(fn) {
    var live = root.classList.contains("amb-live");
    if (live) root.classList.remove("amb-live");
    try {
      fn();
    } finally {
      if (live) {
        // Flush styles while no transition is defined. A transition starts only when a computed value changes
        // while one is defined, so putting the class back afterwards starts none. (Re-adding it after two
        // requestAnimationFrames would not work here: rAF does not run in hidden tabs.)
        void window.getComputedStyle(root).getPropertyValue("--amb-bg");
        root.classList.add("amb-live");
      }
    }
  }

  /**
   * Re-evaluate the phase and the light/dark mode.
   *
   * Phase and weather changes within one mode fade over 1.6 s (site.css). A light <-> dark switch must not:
   * crossfading every token from one mode to the other takes body text through ~1:1 contrast mid-way. So:
   *   - before the page is live (first ~2 frames) the mode is applied at once, as the boot does;
   *   - while the tab is hidden, or when `now` is true (the setting changed in another tab), the switch is a snap;
   *   - while the tab is visible it waits: the page keeps its mode, tinted for the new phase (site.css has
   *     light.night.* and dark.day.* palettes), and switches unseen the next time the tab is hidden (the
   *     visibilitychange handler and the interval call this again) or on the next page load (the boot).
   */
  function update(now) {
    var phase = forcedPhase || (state.place ? A.phaseAt(A.now(), state.place.lat, state.place.lon) : state.phase);
    var live = root.classList.contains("amb-live");
    var snap = live && (document.hidden || now === true);
    var phaseChanges = !!phase && phase !== root.getAttribute("data-amb-phase");
    var modeDiffers = function () {
      try {
        return !!A.applyThemeQuiet && root.getAttribute("data-theme") !== determineComputedTheme();
      } catch (e) {
        return false; /* theme.js missing or storage blocked: the palette still follows data-theme */
      }
    };
    var run = function () {
      if (phaseChanges) {
        state.phase = phase;
        root.setAttribute("data-amb-phase", phase);
      }
      // determineComputedTheme reads data-amb-phase (the boot's autoMode), so this runs after the phase is set.
      if ((!live || snap) && modeDiffers()) {
        try {
          A.applyThemeQuiet();
        } catch (e) {
          /* a theme.js step failed: data-theme may be unchanged; the palette still follows it */
        }
      }
    };
    if (snap && (phaseChanges || modeDiffers())) quietly(run);
    else run();
  }

  // ------------------------------------------------------------------------------------- state display

  var PHASE_TEXT = { dawn: "dawn", day: "daylight", dusk: "dusk", night: "night" };
  var WX_TEXT = {
    clear: "clear sky",
    partly: "passing clouds",
    overcast: "overcast sky",
    rain: "rain",
    snow: "snow",
    fog: "fog",
    storm: "a thunderstorm",
  };

  function label() {
    var t = document.getElementById("light-toggle");
    if (!t) return;
    var s = themeSetting();
    if (!s) return;
    var auto = hasEngine ? "automatic" : "system";
    var next = { system: "light", light: "dark", dark: auto }[s];
    var name = s === "system" ? auto : s;
    var text = "Theme: " + name;
    if (hasEngine) {
      var phase = root.getAttribute("data-amb-phase");
      var wx = root.getAttribute("data-amb-wx");
      var what = (PHASE_TEXT[phase] || "") + (phase && WX_TEXT[wx] ? " and " + WX_TEXT[wx] : "");
      var p = state.place;
      if (what && root.getAttribute("data-amb-wind") === "windy") what += ", windy";
      if (what) text += s === "system" ? ", " + what + (p && p.label ? " near " + p.label : "") : ", tinted for " + what;
    }
    text += ". Click for " + next + ".";
    t.title = text;
    t.setAttribute("aria-label", text);
    t.setAttribute("data-label", name.charAt(0).toUpperCase() + name.slice(1));
  }

  var MOTION_KEY = "amb.motion.v1"; // "off" = the visitor paused the animation (motion.js reads it too)
  var motionOk = hasEngine && q.get("amb-motion") !== "0";
  var reduceMq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;

  /**
   * One muted line ends the main column:
   *   - Open-Meteo's data licence (CC BY 4.0) asks for a visible link next to wherever its data are used. The weather
   *     sets the page colours and appears in the theme toggle's label, so the link shows while a reading is in use.
   *     Every non-preview data-amb-wx comes from Open-Meteo (a fetch now or the boot's cached reading).
   *   - "Pause animation" / "Play animation": the sky moves on its own and indefinitely, so WCAG 2.2.2 asks for a way
   *     to stop it. The choice is kept in localStorage. Hidden when there is no motion to stop (reduced motion).
   */
  function credit() {
    var main = document.querySelector('[role="main"]');
    if (!main) return;
    var node = main.querySelector(".amb-credit");
    var wxShown = hasEngine && !forcedWx && !!root.getAttribute("data-amb-wx");
    var canPause = motionOk && !(reduceMq && reduceMq.matches);
    if (!node) {
      if (!wxShown && !canPause) return;
      var button = el("button", { type: "button" }, []);
      button.addEventListener("click", function () {
        store.set(MOTION_KEY, store.get(MOTION_KEY) === "off" ? "on" : "off");
        if (A.motion) A.motion.restart();
        credit();
      });
      node = el("p", { class: "amb-credit" }, [
        "Colours follow the time of day and the weather. ",
        el("a", { href: "https://open-meteo.com/" }, ["Weather data by Open-Meteo.com"]),
        " ",
        button,
      ]);
      main.appendChild(node);
    }
    node.querySelector("a").hidden = !wxShown;
    var b = node.querySelector("button");
    b.hidden = !canPause;
    b.textContent = store.get(MOTION_KEY) === "off" ? "Play animation" : "Pause animation";
    node.hidden = !wxShown && !canPause;
  }

  var metaTimer = 0;
  function metaThemeColor() {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = el("meta", { name: "theme-color" });
      document.head.appendChild(meta);
    }
    var set = function () {
      var bg = getComputedStyle(root).getPropertyValue("--amb-bg").trim();
      if (bg) meta.setAttribute("content", bg);
    };
    set();
    window.clearTimeout(metaTimer);
    metaTimer = window.setTimeout(set, 1700); // again after the 1.6 s palette fade
  }

  // ---------------------------------------------------------------------------------------------- run

  navAids();

  if (hasEngine) {
    resolvePlace(function (place) {
      state.place = place;
      A.state = state;
      update();
      weather();
      label();
    });
    if (forcedWx) setWx(forcedWx);
    if (forcedWind) setWind(null);
    update();
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add("amb-live"); // from now on, automatic changes fade (site.css)
      });
    });
    // update() also runs while the tab is hidden: a phase or light/dark change then lands at once, unseen.
    // Weather requests wait until the tab is visible.
    window.setInterval(function () {
      update();
      if (!document.hidden) weather();
    }, 60e3);
    document.addEventListener("visibilitychange", function () {
      update(); // on hide: applies a light/dark switch that update() held back while the tab was visible
      if (!document.hidden) weather();
    });
    window.addEventListener("online", weather);
    window.addEventListener("storage", function (e) {
      if (e.key === WX_KEY && !forcedWx) applyReading(cachedWx(WX_STALE));
      if (e.key === MOTION_KEY) credit(); // paused or resumed in another tab (motion.js restarts itself)
      if (e.key === "theme") {
        var s = themeSetting();
        if (s) root.setAttribute("data-theme-setting", s);
        update(true); // an explicit choice made in another tab: switch now, as a snap
      }
    });
  }

  label();
  metaThemeColor();
  credit();
  if (reduceMq) {
    if (reduceMq.addEventListener) reduceMq.addEventListener("change", credit);
    else if (reduceMq.addListener) reduceMq.addListener(credit);
  }
  if (motionOk) {
    var m = document.createElement("script");
    m.src = asset("motion.js");
    m.async = true;
    document.head.appendChild(m);
  }
  new MutationObserver(function () {
    label();
    metaThemeColor();
    credit();
  }).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-theme-setting", "data-amb-phase", "data-amb-wx", "data-amb-wind"] });

  A.place = function () {
    return state.place;
  };
  A.update = update;
  A.weather = weather;
  A.classify = classify;
  window.ambient = A;
})();
