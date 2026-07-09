/* Physics Solved — equation finder.
 * <div data-ps-app="equation-finder" data-course="ap-physics-1"></div>
 * Accordion of units; check the variables you know and the equations that use
 * them are revealed. Match mode is "any" (>=1 checked) or "all" (every use
 * checked). data-course selects data/equations/<course>.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("equation-finder", async function (el) {
    var course = el.getAttribute("data-course");
    if (!course) {
      el.innerHTML = "";
      el.appendChild(PS.h("div.ps-state.ps-state--error", {},
        'equation-finder needs a data-course attribute (e.g. "ap-physics-1").'));
      return;
    }
    var data = await PS.fetchJSON("equations/" + course + ".json");
    el.innerHTML = "";

    var mode = "any";
    var units = [];

    var head = PS.h("div.ps-ef-head", {}, [
      PS.h("div.ps-ef-head-text", {}, [
        PS.h("h2.ps-h3", {}, "Equation Finder"),
        PS.h("p.ps-muted", {}, "Check the variables you have — matching equations appear.")
      ]),
      matchToggle()
    ]);
    el.appendChild(head);
    if (data.note) el.appendChild(PS.h("p.ps-ef-note", {}, data.note));

    var acc = PS.h("div.ps-accordion", {});
    (data.units || []).forEach(function (unit, i) {
      acc.appendChild(renderUnit(unit, i));
    });
    el.appendChild(acc);
    PS.reveal(acc);

    function matchToggle() {
      var group = PS.h("div.ps-segment", { role: "group", "aria-label": "Match mode" });
      ["any", "all"].forEach(function (m) {
        var btn = PS.h("button.ps-segment-btn", {
          type: "button",
          "aria-pressed": m === mode ? "true" : "false",
          "data-mode": m
        }, m === "any" ? "Match any" : "Match all");
        btn.addEventListener("click", function () {
          mode = m;
          group.querySelectorAll(".ps-segment-btn").forEach(function (b) {
            b.setAttribute("aria-pressed", b.getAttribute("data-mode") === mode ? "true" : "false");
          });
          units.forEach(function (u) { u.apply(); });
        });
        group.appendChild(btn);
      });
      return group;
    }

    function renderUnit(unit, index) {
      var checked = Object.create(null);
      var vars = unit.variables || [];
      var eqs = unit.equations || [];
      var open = index === 0;

      var count = PS.h("span.ps-ef-count", { "aria-live": "polite" }, "");
      var caret = PS.h("span.ps-accordion-caret", { "aria-hidden": "true" });
      var panelId = "ps-ef-" + course + "-" + index;
      var btn = PS.h("button.ps-accordion-head", {
        type: "button",
        "aria-expanded": open ? "true" : "false",
        "aria-controls": panelId
      }, [
        PS.h("span.ps-accordion-title", {}, [
          unit.title,
          PS.h("span.ps-accordion-meta", {}, " · " + vars.length + " variable" + (vars.length === 1 ? "" : "s"))
        ]),
        count,
        caret
      ]);

      var grid = PS.h("div.ps-var-grid", {});
      vars.forEach(function (v) {
        var id = panelId + "-v-" + slug(v.sym);
        var input = PS.h("input", { type: "checkbox", id: id, "data-sym": v.sym });
        input.addEventListener("change", function () {
          if (input.checked) checked[v.sym] = true; else delete checked[v.sym];
          apply();
        });
        var label = PS.h("label.ps-var", { for: id, title: v.name + (v.note ? " — " + v.note : "") }, [
          input,
          PS.h("span.ps-var-sym.ps-mono", {}, v.sym),
          PS.h("span.ps-var-name", {}, v.name)
        ]);
        grid.appendChild(label);
      });

      var list = PS.h("div.ps-eq-list", {});
      var rows = eqs.map(function (eq) {
        var row = PS.h("div.ps-eq", {}, [
          PS.h("span.ps-eq-name", {}, eq.name),
          PS.h("span.ps-eq-expr.ps-mono", {}, eq.expr)
        ]);
        return { node: row, uses: eq.uses || [] };
      });
      rows.forEach(function (r) { list.appendChild(r.node); });

      var panel = PS.h("div.ps-accordion-panel", { id: panelId, hidden: !open }, [
        vars.length ? grid : null,
        list
      ]);

      btn.addEventListener("click", function () {
        var isOpen = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
        panel.hidden = isOpen;
      });

      function apply() {
        var keys = Object.keys(checked);
        var active = keys.length > 0;
        var shown = 0;
        rows.forEach(function (r) {
          var match;
          if (!active) match = true;
          else if (mode === "any") match = r.uses.some(function (u) { return checked[u]; });
          else match = r.uses.length > 0 && r.uses.every(function (u) { return checked[u]; });
          r.node.classList.toggle("is-hidden", !match);
          if (match) shown++;
        });
        count.textContent = active ? shown + " match" + (shown === 1 ? "" : "es") : "";
      }
      apply();
      units.push({ apply: apply });
      return PS.h("div.ps-accordion-item", {}, [btn, panel]);
    }
  });

  function slug(s) {
    return String(s).replace(/[^A-Za-z0-9]/g, function (c) { return "_" + c.charCodeAt(0); });
  }
})();
