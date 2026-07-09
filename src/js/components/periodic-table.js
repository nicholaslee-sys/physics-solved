/* Physics Solved — periodic table.
 * <div data-ps-app="periodic-table"></div>
 * Full 118-element table from data/periodic-table.json. Color by category,
 * click for a detail panel, search by name/symbol, category legend that filters.
 * Keyboard: Tab to cells, Enter to open, arrow keys to move. Mobile: the grid
 * scrolls horizontally with a sticky group-number header.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("periodic-table", async function (el) {
    var data = await PS.fetchJSON("periodic-table.json");
    el.innerHTML = "";
    var elements = data.elements || [];
    var cats = data.categories || [];
    var catLabel = {};
    cats.forEach(function (c) { catLabel[c.id] = c.label; });

    var query = "", activeCat = null;
    var byNumber = {};
    elements.forEach(function (e) { byNumber[e.number] = e; });

    /* Search + legend */
    var search = PS.h("input.ps-pt-search", { type: "search",
      placeholder: "Search element by name or symbol…", "aria-label": "Search elements" });
    search.addEventListener("input", function () { query = search.value.trim().toLowerCase(); apply(); });

    var legend = PS.h("div.ps-pt-legend", { role: "group", "aria-label": "Filter by category" });
    cats.forEach(function (c) {
      var chip = PS.h("button.ps-pt-legchip", { type: "button", "data-cat": c.id, "aria-pressed": "false" }, [
        PS.h("span.ps-pt-swatch", { "data-cat": c.id, "aria-hidden": "true" }), c.label
      ]);
      chip.addEventListener("click", function () {
        activeCat = activeCat === c.id ? null : c.id;
        legend.querySelectorAll(".ps-pt-legchip").forEach(function (x) {
          x.setAttribute("aria-pressed", String(x.getAttribute("data-cat") === activeCat));
        });
        apply();
      });
      legend.appendChild(chip);
    });

    /* Grid */
    var grid = PS.h("div.ps-pt-grid", { role: "grid", "aria-label": "Periodic table" });
    // Group-number header row (row 1)
    for (var g = 1; g <= 18; g++) {
      grid.appendChild(PS.h("div.ps-pt-grouphead", { style: "grid-column:" + g + ";grid-row:1", "aria-hidden": "true" }, String(g)));
    }
    var cells = [];
    elements.forEach(function (e) {
      var col, row;
      if (e.group == null) {
        // f-block: lanthanides row 9, actinides row 10, columns 3..17 by atomic number
        if (e.number >= 57 && e.number <= 71) { row = 9; col = (e.number - 57) + 3; }
        else if (e.number >= 89 && e.number <= 103) { row = 10; col = (e.number - 89) + 3; }
        else { return; }
      } else {
        col = e.group; row = e.period + 1;
      }
      var cell = PS.h("button.ps-pt-el", {
        type: "button", role: "gridcell",
        "data-cat": e.category, "data-num": e.number,
        style: "grid-column:" + col + ";grid-row:" + row,
        "aria-label": e.name + ", atomic number " + e.number
      }, [
        PS.h("span.ps-pt-num", {}, String(e.number)),
        PS.h("span.ps-pt-sym", {}, e.symbol),
        PS.h("span.ps-pt-mass", {}, fmtMass(e.mass))
      ]);
      cell.addEventListener("click", function () { showDetail(e); focusCell(e.number); });
      cell.addEventListener("keydown", function (ev) { onKey(ev, e); });
      cells.push({ e: e, node: cell });
      grid.appendChild(cell);
    });
    // f-block placeholder markers in the main table (group 3, periods 6 & 7)
    grid.appendChild(PS.h("div.ps-pt-el.ps-pt-fmarker", { style: "grid-column:3;grid-row:7", "aria-hidden": "true" }, "57–71"));
    grid.appendChild(PS.h("div.ps-pt-el.ps-pt-fmarker", { style: "grid-column:3;grid-row:8", "aria-hidden": "true" }, "89–103"));

    var scroller = PS.h("div.ps-pt-scroller", {}, grid);
    var detail = PS.h("div.ps-pt-detail", { role: "region", "aria-live": "polite" });
    detail.appendChild(PS.h("p.ps-muted", {}, "Select an element to see its details."));

    el.appendChild(PS.h("div.ps-pt-controls", {}, [search, legend]));
    el.appendChild(scroller);
    el.appendChild(detail);
    PS.reveal(scroller);

    function apply() {
      cells.forEach(function (c) {
        var e = c.e;
        var matchQ = !query || e.name.toLowerCase().indexOf(query) !== -1 || e.symbol.toLowerCase().indexOf(query) === 0 || e.symbol.toLowerCase() === query;
        var matchC = !activeCat || e.category === activeCat;
        c.node.classList.toggle("is-dim", !(matchQ && matchC));
      });
    }

    function focusCell(num) {
      var found = cells.find(function (c) { return c.e.number === num; });
      if (found) found.node.focus();
    }

    function onKey(ev, e) {
      var target = null;
      if (ev.key === "ArrowRight") target = e.number + 1;
      else if (ev.key === "ArrowLeft") target = e.number - 1;
      else if (ev.key === "ArrowUp" && e.group != null) target = numberAt(e.group, e.period - 1);
      else if (ev.key === "ArrowDown" && e.group != null) target = numberAt(e.group, e.period + 1);
      else return;
      if (target && byNumber[target]) { ev.preventDefault(); focusCell(target); showDetail(byNumber[target]); }
    }
    function numberAt(group, period) {
      var m = cells.find(function (c) { return c.e.group === group && c.e.period === period; });
      return m ? m.e.number : null;
    }

    function showDetail(e) {
      detail.innerHTML = "";
      var rows = [
        ["Atomic number", e.number],
        ["Atomic mass", fmtMass(e.mass) + " u"],
        ["Category", catLabel[e.category] || e.category],
        ["Group / Period", (e.group == null ? "f-block" : e.group) + " / " + e.period],
        ["Electronegativity", e.electronegativity == null ? "—" : e.electronegativity],
        ["Common oxidation states", (e.oxidationStates && e.oxidationStates.length) ? e.oxidationStates.map(sign).join(", ") : "—"]
      ];
      var dl = PS.h("dl.ps-pt-dl");
      rows.forEach(function (r) {
        dl.appendChild(PS.h("dt", {}, r[0]));
        dl.appendChild(PS.h("dd.ps-mono", {}, String(r[1])));
      });
      detail.appendChild(PS.h("div.ps-pt-detail-head", { "data-cat": e.category }, [
        PS.h("span.ps-pt-detail-sym", {}, e.symbol),
        PS.h("div", {}, [
          PS.h("h4.ps-pt-detail-name", {}, e.name),
          PS.h("span.ps-pt-detail-cat", {}, catLabel[e.category] || e.category)
        ])
      ]));
      detail.appendChild(dl);
      if (e.todo) detail.appendChild(PS.h("p.ps-pt-todo", {}, "⚠ Properties for this element are predicted/uncertain."));
    }
  });

  function fmtMass(m) {
    if (m == null) return "—";
    return (m >= 100 || m % 1 === 0) ? String(m) : m.toFixed(3);
  }
  function sign(n) { return n > 0 ? "+" + n : String(n); }
})();
