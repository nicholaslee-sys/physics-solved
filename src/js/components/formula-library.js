/* Physics Solved — formula sheet library.
 * <div data-ps-app="formula-library"></div>
 * Tab pills are built from every sheet declared on the physics courses in
 * registry.json (so tabs and courses can never disagree). Sheets load lazily.
 * Tablist semantics + arrow-key navigation. Print opens a clean sheet-only page.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("formula-library", async function (el) {
    var subjectId = el.getAttribute("data-subject") || "physics";
    var reg = await PS.getRegistry();
    var subject = (reg.subjects || []).find(function (s) { return s.id === subjectId; });
    el.innerHTML = "";

    // Flatten sheets across the subject's courses -> tab list.
    var tabs = [];
    (subject ? subject.courses : []).forEach(function (course) {
      (course.sheets || []).forEach(function (sh) {
        tabs.push({ id: sh.id, label: sh.label, file: sh.file, accent: course.accent });
      });
    });
    if (!tabs.length) {
      el.appendChild(PS.h("div.ps-state", {}, "No formula sheets are configured."));
      return;
    }

    var tablist = PS.h("div.ps-tabs", { role: "tablist", "aria-label": "Formula sheets" });
    var panel = PS.h("div.ps-tabpanel", { role: "tabpanel", tabindex: "0", "aria-live": "polite" });
    var buttons = [];

    tabs.forEach(function (tab, i) {
      var btn = PS.h("button.ps-tab", {
        type: "button",
        role: "tab",
        id: "ps-tab-" + tab.id,
        "aria-controls": panel.id || "ps-fl-panel",
        "aria-selected": i === 0 ? "true" : "false",
        tabindex: i === 0 ? "0" : "-1",
        style: "--ps-accent:" + (tab.accent || "#2547d0")
      }, tab.label);
      btn.addEventListener("click", function () { select(i); });
      buttons.push(btn);
      tablist.appendChild(btn);
    });
    panel.id = "ps-fl-panel";
    tablist.addEventListener("keydown", onKeydown);

    el.appendChild(tablist);
    el.appendChild(panel);

    var current = -1;
    var loaded = Object.create(null);
    select(0);

    function onKeydown(e) {
      var i = buttons.indexOf(document.activeElement);
      if (i < 0) return;
      var n = buttons.length, j = i;
      if (e.key === "ArrowRight") j = (i + 1) % n;
      else if (e.key === "ArrowLeft") j = (i - 1 + n) % n;
      else if (e.key === "Home") j = 0;
      else if (e.key === "End") j = n - 1;
      else return;
      e.preventDefault();
      buttons[j].focus();
      select(j);
    }

    function select(i) {
      if (i === current) return;
      current = i;
      buttons.forEach(function (b, k) {
        var on = k === i;
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", buttons[i].id);
      renderSheet(tabs[i]);
    }

    async function renderSheet(tab) {
      panel.innerHTML = "";
      panel.appendChild(PS.h("div.ps-state.ps-state--loading", {}, "Loading sheet…"));
      var data;
      try {
        data = loaded[tab.id] || (loaded[tab.id] = await PS.fetchJSON(tab.file));
      } catch (err) {
        panel.innerHTML = "";
        panel.appendChild(PS.h("div.ps-state.ps-state--error", {}, "Could not load this sheet."));
        return;
      }
      panel.innerHTML = "";
      panel.appendChild(sheetNode(data, tab.accent));
    }
  });

  function sheetNode(data, accent) {
    var sheet = PS.h("div.ps-sheet", { style: "--ps-accent:" + (accent || "#2547d0") });

    var header = PS.h("div.ps-sheet-head", {}, [
      PS.h("div", {}, [
        PS.h("h3.ps-sheet-title", {}, data.title || "Formula Sheet"),
        data.tagline ? PS.h("p.ps-sheet-tagline.ps-muted", {}, data.tagline) : null
      ]),
      printButton(sheet, data.title || "Formula Sheet")
    ]);
    sheet.appendChild(header);

    if (data.constants && data.constants.length) {
      var strip = PS.h("div.ps-constants", { "aria-label": "Constants" });
      data.constants.forEach(function (c) {
        strip.appendChild(PS.h("span.ps-constant", {}, [
          PS.h("span.ps-constant-sym.ps-mono", {}, c.sym),
          PS.h("span.ps-constant-val.ps-mono", {}, c.value)
        ]));
      });
      sheet.appendChild(strip);
    }

    var grid = PS.h("div.ps-sheet-grid");
    (data.categories || []).forEach(function (cat) {
      var card = PS.h("div.ps-card.ps-sheet-card", {}, [
        PS.h("h4.ps-sheet-cat", {}, cat.title)
      ]);
      var rows = PS.h("div.ps-sheet-rows");
      (cat.rows || []).forEach(function (row) {
        rows.appendChild(PS.h("div.ps-sheet-row", {}, [
          PS.h("span.ps-sheet-row-name", {}, row.name),
          PS.h("span.ps-sheet-row-expr.ps-mono", {}, row.expr)
        ]));
      });
      card.appendChild(rows);
      grid.appendChild(card);
    });
    sheet.appendChild(grid);
    return sheet;
  }

  function printButton(sheet, title) {
    var btn = PS.h("button.ps-btn.ps-btn--dark", { type: "button" }, "Print / Save PDF");
    btn.addEventListener("click", function () { printSheet(sheet, title); });
    return btn;
  }

  // Print just the sheet in a clean popup, styled by the CDN stylesheet, so the
  // surrounding Squarespace page is never touched (no body/html rules needed).
  function printSheet(sheet, title) {
    var win = window.open("", "_blank", "width=900,height=1000");
    if (!win) { window.print(); return; } // popup blocked -> best effort
    // Absolute URL so it resolves inside the about:blank popup (base may be relative).
    var css = new URL(PS.base + "dist/physics-solved.min.css", document.baseURI).href;
    win.document.open();
    win.document.write(
      '<!doctype html><html><head><meta charset="utf-8">' +
      '<title>' + PS.escape(title) + '</title>' +
      '<link rel="stylesheet" href="' + PS.escape(css) + '">' +
      '</head><body class="ps-print-body"><div class="ps-root ps-print-doc">' +
      sheet.outerHTML + "</div></body></html>"
    );
    win.document.close();
    var go = function () { win.focus(); win.print(); };
    // Give the stylesheet a moment to load, then print.
    if (win.document.readyState === "complete") setTimeout(go, 250);
    else win.addEventListener("load", function () { setTimeout(go, 150); });
  }
})();
