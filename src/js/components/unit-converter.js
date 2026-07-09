/* Physics Solved — unit converter.
 * <div data-ps-app="unit-converter"></div>
 * Quantities and units from data/units.json (factors to SI base). Temperature
 * is offset-aware. Add units/quantities in JSON — no JS changes.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("unit-converter", async function (el) {
    var data = await PS.fetchJSON("units.json");
    var quantities = data.quantities || [];
    el.innerHTML = "";
    if (!quantities.length) { el.appendChild(PS.h("div.ps-state", {}, "No units configured.")); return; }

    var qSel = PS.h("select.ps-uc-select", { "aria-label": "Quantity" });
    quantities.forEach(function (q) { qSel.appendChild(PS.h("option", { value: q.id }, q.label)); });

    var valIn = PS.h("input.ps-uc-value.ps-mono", { type: "number", value: "1", step: "any", "aria-label": "Value to convert" });
    var fromSel = PS.h("select.ps-uc-select", { "aria-label": "From unit" });
    var toSel = PS.h("select.ps-uc-select", { "aria-label": "To unit" });
    var swap = PS.h("button.ps-btn.ps-btn--ghost.ps-uc-swap", { type: "button", "aria-label": "Swap units" }, "⇄");
    var result = PS.h("div.ps-uc-result.ps-mono", { role: "status", "aria-live": "polite" });

    var current;
    function loadQuantity() {
      current = quantities.find(function (q) { return q.id === qSel.value; }) || quantities[0];
      fromSel.innerHTML = ""; toSel.innerHTML = "";
      current.units.forEach(function (u) {
        fromSel.appendChild(PS.h("option", { value: u.id }, u.label));
        toSel.appendChild(PS.h("option", { value: u.id }, u.label));
      });
      if (current.units[1]) toSel.value = current.units[1].id;
      convert();
    }

    function toBase(q, unitId, v) {
      if (q.special === "temperature") {
        if (unitId === "K") return v;
        if (unitId === "C") return v + 273.15;
        if (unitId === "F") return (v - 32) * 5 / 9 + 273.15;
      }
      return v * unitById(q, unitId).factor;
    }
    function fromBase(q, unitId, base) {
      if (q.special === "temperature") {
        if (unitId === "K") return base;
        if (unitId === "C") return base - 273.15;
        if (unitId === "F") return (base - 273.15) * 9 / 5 + 32;
      }
      return base / unitById(q, unitId).factor;
    }
    function unitById(q, id) { return q.units.find(function (u) { return u.id === id; }); }

    function convert() {
      var v = parseFloat(valIn.value);
      if (isNaN(v)) { result.textContent = "Enter a number."; return; }
      var base = toBase(current, fromSel.value, v);
      var res = fromBase(current, toSel.value, base);
      result.textContent = v + " " + labelOf(fromSel) + "  =  " + fmt(res) + " " + labelOf(toSel);
    }
    function labelOf(sel) { return sel.options[sel.selectedIndex].text.replace(/\s*\(.*\)$/, ""); }
    function fmt(x) {
      if (x === 0) return "0";
      var a = Math.abs(x);
      if (a >= 1e6 || a < 1e-4) return x.toExponential(4);
      return String(Math.round(x * 1e6) / 1e6);
    }

    qSel.addEventListener("change", loadQuantity);
    [valIn, fromSel, toSel].forEach(function (n) { n.addEventListener("input", convert); n.addEventListener("change", convert); });
    swap.addEventListener("click", function () {
      var t = fromSel.value; fromSel.value = toSel.value; toSel.value = t; convert();
    });

    el.appendChild(PS.h("div.ps-uc-row", {}, [PS.h("label.ps-uc-label", {}, "Quantity"), qSel]));
    el.appendChild(PS.h("div.ps-uc-convert", {}, [
      PS.h("div.ps-uc-field", {}, [valIn, fromSel]),
      swap,
      PS.h("div.ps-uc-field", {}, [PS.h("div.ps-uc-spacer", { "aria-hidden": "true" }), toSel])
    ]));
    el.appendChild(result);
    PS.reveal(el.firstChild);
    loadQuantity();
  });
})();
