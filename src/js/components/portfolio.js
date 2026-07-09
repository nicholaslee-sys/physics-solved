/* Physics Solved — portfolio.
 * <div data-ps-app="portfolio"></div>
 * Hero intro, filter pills (All / Engineering / Coding / Physics Tools), a
 * responsive card grid (featured cards larger) that expands in place — no modal.
 * Data from data/portfolio.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  var TAGS = [
    { id: "all", label: "All" },
    { id: "engineering", label: "Engineering" },
    { id: "coding", label: "Coding" },
    { id: "physics-tools", label: "Physics Tools" }
  ];
  var TAG_LABEL = { engineering: "Engineering", coding: "Coding", "physics-tools": "Physics Tools" };

  PS.register("portfolio", async function (el) {
    var data = await PS.fetchJSON("portfolio.json");
    el.innerHTML = "";
    var projects = data.projects || [];
    var filter = "all";

    if (data.intro) el.appendChild(PS.h("p.ps-portfolio-intro", {}, data.intro));

    var pills = PS.h("div.ps-pills", { role: "tablist", "aria-label": "Filter projects" });
    var pillBtns = {};
    TAGS.forEach(function (t) {
      var btn = PS.h("button.ps-pill", { type: "button", role: "tab",
        "aria-selected": t.id === filter ? "true" : "false" }, t.label);
      btn.addEventListener("click", function () { setFilter(t.id); });
      pillBtns[t.id] = btn;
      pills.appendChild(btn);
    });
    el.appendChild(pills);

    var grid = PS.h("div.ps-portfolio-grid");
    el.appendChild(grid);
    PS.reveal(grid);

    var cards = projects.map(function (p) { return { project: p, node: card(p) }; });
    cards.forEach(function (c) { grid.appendChild(c.node); });
    apply();

    function setFilter(id) {
      filter = id;
      Object.keys(pillBtns).forEach(function (k) {
        pillBtns[k].setAttribute("aria-selected", k === id ? "true" : "false");
      });
      apply();
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var tags = c.project.tags || [];
        var match = filter === "all" || tags.indexOf(filter) !== -1;
        c.node.hidden = !match;
        if (match) shown++;
      });
      var empty = grid.querySelector(".ps-portfolio-empty");
      if (!shown && !empty) grid.appendChild(PS.h("div.ps-portfolio-empty.ps-state", {}, "No projects in this filter."));
      else if (shown && empty) empty.remove();
    }
  });

  function card(p) {
    var featured = !!p.featured;
    var cover = coverNode(p);

    var chips = PS.h("div.ps-chips", {}, (p.tags || []).map(function (t) {
      return PS.h("span.ps-chip", {}, TAG_LABEL[t] || t);
    }));

    var tech = (p.tech && p.tech.length)
      ? PS.h("ul.ps-tech", { "aria-label": "Tech used" }, p.tech.map(function (t) {
          return PS.h("li.ps-tech-item.ps-mono", {}, t);
        }))
      : null;

    var links = (p.links && p.links.length)
      ? PS.h("div.ps-portfolio-links", {}, p.links.map(function (l) {
          return PS.h("a.ps-link", { href: l.url,
            target: /^https?:/.test(l.url || "") ? "_blank" : null,
            rel: /^https?:/.test(l.url || "") ? "noopener" : null }, l.label);
        }))
      : null;

    var descId = "ps-proj-" + (p.id || Math.random().toString(36).slice(2));
    var desc = PS.h("div.ps-portfolio-desc", { id: descId, hidden: true },
      PS.h("p", {}, p.description || ""));

    var toggle = p.description
      ? PS.h("button.ps-portfolio-toggle", { type: "button",
          "aria-expanded": "false", "aria-controls": descId }, "Read more")
      : null;
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", open ? "false" : "true");
        toggle.textContent = open ? "Read more" : "Show less";
        desc.hidden = open;
      });
    }

    return PS.h("article.ps-card.ps-portfolio-card" + (featured ? ".is-featured" : ""), {}, [
      cover,
      PS.h("div.ps-portfolio-body", {}, [
        PS.h("div.ps-portfolio-titlerow", {}, [
          PS.h("h3.ps-portfolio-title", {}, p.title || "Untitled"),
          p.year ? PS.h("span.ps-portfolio-year.ps-mono", {}, String(p.year)) : null
        ]),
        chips,
        p.summary ? PS.h("p.ps-portfolio-summary", {}, p.summary) : null,
        tech,
        links,
        toggle,
        desc
      ])
    ]);
  }

  function coverNode(p) {
    if (p.images && p.images.length) {
      return PS.h("div.ps-portfolio-cover", {}, PS.h("img.ps-portfolio-img", {
        src: p.images[0], alt: p.title || "", loading: "lazy" }));
    }
    var hue = hash(p.title || p.id || "x") % 360;
    return PS.h("div.ps-portfolio-cover.ps-portfolio-cover--gradient", {
      style: "--ps-h:" + hue, "aria-hidden": "true"
    }, PS.h("span.ps-portfolio-cover-mark", {}, (p.title || "•").slice(0, 1).toUpperCase()));
  }

  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
})();
