/* Physics Solved — core mount system.
 * Scans the page for [data-ps-app] elements, resolves the CDN base URL,
 * fetches the JSON each component needs, and renders. Vanilla ES2020, no deps.
 * Components register themselves on window.PS via PS.register(name, fn).
 */
(function () {
  "use strict";

  // Capture the <script> that loaded this bundle NOW (synchronously), while
  // document.currentScript is still valid. Used to derive the data base URL.
  var CURRENT = document.currentScript;

  var PS = (window.PS = window.PS || {});
  PS.components = PS.components || {};

  /* ---- Base URL resolution -------------------------------------------- */
  // Priority: data-ps-base attribute on the script tag -> derived from the
  // script src (strip trailing "dist/<file>") -> "" (same-origin relative).
  function resolveBase() {
    var attr = CURRENT && CURRENT.getAttribute && CURRENT.getAttribute("data-ps-base");
    if (attr) return attr.replace(/\/?$/, "/"); // ensure trailing slash
    var src = (CURRENT && CURRENT.src) || "";
    if (!src) return "";
    // .../physics-solved@v1/dist/physics-solved.min.js -> .../physics-solved@v1/
    var base = src.replace(/dist\/[^\/]*$/, "");
    if (base === src) base = src.replace(/[^\/]*$/, ""); // fallback: script dir
    return base;
  }

  PS.base = resolveBase();
  PS.dataUrl = function (path) {
    return PS.base + "data/" + String(path).replace(/^\/+/, "");
  };

  /* ---- Fetch with in-memory cache ------------------------------------- */
  var cache = Object.create(null);
  PS.fetchJSON = function (path) {
    var url = /^https?:|^\.\.?\//.test(path) ? path : PS.dataUrl(path);
    if (cache[url]) return cache[url];
    cache[url] = fetch(url, { credentials: "omit" }).then(function (r) {
      if (!r.ok) throw new Error("PS: failed to load " + url + " (" + r.status + ")");
      return r.json();
    });
    return cache[url];
  };

  PS.getRegistry = function () {
    return PS.fetchJSON("registry.json");
  };

  /* ---- Small DOM helpers ---------------------------------------------- */
  // h("div.cls#id", {attrs}, [children | "text"])
  PS.h = function (spec, attrs, children) {
    var tag = "div", id = null, cls = [];
    spec.replace(/([.#]?[^.#]+)/g, function (m) {
      if (m[0] === ".") cls.push(m.slice(1));
      else if (m[0] === "#") id = m.slice(1);
      else tag = m;
    });
    var node = document.createElement(tag);
    if (id) node.id = id;
    if (cls.length) node.className = cls.join(" ");
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") node.className += (node.className ? " " : "") + v;
        else if (k === "text") node.textContent = v;
        else if (k === "html") node.innerHTML = v;
        else if (k.slice(0, 2) === "on" && typeof v === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), v);
        } else node.setAttribute(k, v === true ? "" : String(v));
      });
    }
    (Array.isArray(children) ? children : children != null ? [children] : []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  PS.escape = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  PS.reducedMotion = function () {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // First-reveal fade/rise (<=200ms). No-op under prefers-reduced-motion.
  PS.reveal = function (node) {
    if (PS.reducedMotion()) return;
    node.classList.add("ps-reveal");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        node.classList.add("is-in");
      });
    });
  };

  PS.register = function (name, fn) {
    PS.components[name] = fn;
  };

  /* ---- Error + loading placeholders ----------------------------------- */
  function setState(el, cls, msg) {
    el.innerHTML = "";
    el.appendChild(PS.h("div.ps-state." + cls, { role: "status" }, msg));
  }

  /* ---- Mount ---------------------------------------------------------- */
  PS.mount = function (root) {
    root = root || document;
    var nodes = root.querySelectorAll("[data-ps-app]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.__psMounted) return;
      el.__psMounted = true;
      var type = el.getAttribute("data-ps-app");
      var comp = PS.components[type];
      if (!comp) {
        setState(el, "ps-state--error", 'Unknown component "' + type + '".');
        return;
      }
      if (!el.getAttribute("data-ps-quiet")) setState(el, "ps-state--loading", "Loading…");
      try {
        Promise.resolve(comp(el)).catch(function (err) {
          console.error(err);
          setState(el, "ps-state--error", "Could not load this section.");
        });
      } catch (err) {
        console.error(err);
        setState(el, "ps-state--error", "Could not load this section.");
      }
    });
  };

  /* ---- SEO: JSON-LD structured data ---------------------------------- */
  PS.injectJsonLd = function (obj) {
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(obj);
    document.head.appendChild(s);
  };

  PS.injectSeo = async function (root) {
    root = root || document;
    var origin = location.origin && location.origin !== "null" ? location.origin : "";
    // WebSite — emitted on the home page (identified by a carousel mount).
    if (root.querySelector('[data-ps-app="carousel"]')) {
      PS.injectJsonLd({
        "@context": "https://schema.org", "@type": "WebSite",
        name: "Physics Solved", url: origin || undefined,
        description: "Interactive physics and chemistry study tools: equation finders, formula sheets, FRQ practice, a periodic table, and calculators."
      });
    }
    // LearningResource — one per course mount (equation-finder with data-course).
    var courseMounts = root.querySelectorAll('[data-ps-app="equation-finder"][data-course]');
    if (courseMounts.length) {
      try {
        var reg = await PS.getRegistry();
        var byId = {};
        (reg.subjects || []).forEach(function (s) {
          (s.courses || []).forEach(function (c) { byId[c.id] = c; });
        });
        Array.prototype.forEach.call(courseMounts, function (m) {
          var c = byId[m.getAttribute("data-course")];
          if (!c) return;
          PS.injectJsonLd({
            "@context": "https://schema.org", "@type": "LearningResource",
            name: c.label + " — equation finder & study tools",
            educationalLevel: c.eyebrow || "High school",
            about: c.blurb || c.label,
            isAccessibleForFree: true,
            url: c.url ? (origin + c.url) : undefined,
            learningResourceType: ["Reference", "Practice problems"]
          });
        });
      } catch (e) { /* non-fatal */ }
    }
    // Person + CreativeWork list — on the portfolio page.
    if (root.querySelector('[data-ps-app="portfolio"]')) {
      try {
        var pf = await PS.fetchJSON("portfolio.json");
        PS.injectJsonLd({
          "@context": "https://schema.org", "@type": "Person",
          name: pf.owner || "Physics Solved",
          url: origin || undefined,
          description: pf.intro || undefined
        });
        var projects = (pf.projects || []).map(function (p) {
          return { "@type": "CreativeWork", name: p.title, dateCreated: p.year ? String(p.year) : undefined,
            abstract: p.summary, keywords: (p.tags || []).join(", ") || undefined };
        });
        if (projects.length) {
          PS.injectJsonLd({
            "@context": "https://schema.org", "@type": "ItemList",
            itemListElement: projects.map(function (w, i) { return { "@type": "ListItem", position: i + 1, item: w }; })
          });
        }
      } catch (e) { /* non-fatal */ }
    }
  };

  function boot() {
    PS.mount();
    PS.injectSeo();
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    // Defer to a macrotask so the rest of a concatenated bundle registers its
    // components BEFORE we scan the page (core.js runs before them in the file).
    setTimeout(boot, 0);
  }
})();
