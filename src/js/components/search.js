/* Physics Solved — global search.
 * <div data-ps-app="search"></div>  (mount on the home page)
 * Client-side index of registry courses + every equation and formula-sheet row.
 * Typing e.g. "momentum" surfaces matching equations/rows with links to the
 * owning course page. Index is built once from the same JSON the tools use.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("search", async function (el) {
    el.innerHTML = "";
    var input = PS.h("input.ps-search-input", { type: "search",
      placeholder: "Search equations, sheets, courses… (e.g. “momentum”, “pH”)",
      "aria-label": "Search the site", autocomplete: "off" });
    var results = PS.h("div.ps-search-results", { role: "listbox", "aria-label": "Search results" });
    var status = PS.h("div.ps-search-status.ps-muted", {}, "Building index…");
    el.appendChild(PS.h("div.ps-search-box", {}, [input, status]));
    el.appendChild(results);
    PS.reveal(el.firstChild);

    var index = await buildIndex();
    status.textContent = index.length + " entries indexed.";

    var timer;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(run, 120);
    });

    function run() {
      var q = input.value.trim().toLowerCase();
      results.innerHTML = "";
      if (q.length < 2) { status.textContent = index.length + " entries indexed."; return; }
      var hits = index.filter(function (e) { return e.hay.indexOf(q) !== -1; }).slice(0, 40);
      status.textContent = hits.length ? hits.length + " result" + (hits.length === 1 ? "" : "s") : "No matches.";
      hits.forEach(function (e) {
        var node;
        var inner = PS.h("div.ps-search-hit-body", {}, [
          PS.h("span.ps-search-hit-kind", {}, e.kindLabel),
          PS.h("span.ps-search-hit-main", {}, e.title),
          e.expr ? PS.h("span.ps-search-hit-expr.ps-mono", {}, e.expr) : null,
          PS.h("span.ps-search-hit-src", {}, e.source)
        ]);
        if (e.url) {
          node = PS.h("a.ps-search-hit", { href: e.url, role: "option" }, inner);
        } else {
          node = PS.h("div.ps-search-hit.is-static", { role: "option" }, inner);
        }
        results.appendChild(node);
      });
    }

    async function buildIndex() {
      var reg = await PS.getRegistry();
      var entries = [];
      var jobs = [];
      (reg.subjects || []).forEach(function (subj) {
        (subj.courses || []).forEach(function (course) {
          entries.push(mk("course", "Course", course.label,
            (course.eyebrow || "") + " " + (course.blurb || ""), null, course.url, subj.label + " · course"));
          if ((course.features || []).indexOf("equation-finder") !== -1) {
            jobs.push(PS.fetchJSON("equations/" + course.id + ".json").then(function (eq) {
              (eq.units || []).forEach(function (u) {
                (u.equations || []).forEach(function (e) {
                  entries.push(mk("equation", "Equation", e.name, e.name + " " + e.expr, e.expr, course.url, course.label + " · " + u.title));
                });
              });
            }).catch(function () {}));
          }
          (course.sheets || []).forEach(function (sh) {
            jobs.push(PS.fetchJSON(sh.file).then(function (sheet) {
              (sheet.categories || []).forEach(function (cat) {
                (cat.rows || []).forEach(function (r) {
                  entries.push(mk("sheet", "Sheet row", r.name, r.name + " " + r.expr, r.expr, course.url, sh.label + " · " + cat.title));
                });
              });
            }).catch(function () {}));
          });
        });
      });
      await Promise.all(jobs);
      return entries;
    }

    function mk(kind, kindLabel, title, hayText, expr, url, source) {
      return { kind: kind, kindLabel: kindLabel, title: title, expr: expr, url: url, source: source,
        hay: (hayText + " " + source).toLowerCase() };
    }
  });
})();
