/* Physics Solved — molar mass calculator.
 * <div data-ps-app="molar-mass"></div>
 * Parses a chemical formula (nested parentheses/brackets and dot-hydrates like
 * CuSO4·5H2O) and reports the molar mass with a per-element breakdown.
 * Reuses atomic masses from data/periodic-table.json.
 */
(function () {
  "use strict";
  var PS = window.PS;
  var SUBS = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9" };

  PS.register("molar-mass", async function (el) {
    var data = await PS.fetchJSON("periodic-table.json");
    var mass = {}, name = {};
    (data.elements || []).forEach(function (e) { mass[e.symbol] = e.mass; name[e.symbol] = e.name; });
    el.innerHTML = "";

    var input = PS.h("input.ps-mm-input.ps-mono", { type: "text",
      placeholder: "e.g. Fe2(SO4)3 or CuSO4·5H2O", "aria-label": "Chemical formula" });
    var out = PS.h("div.ps-mm-out", { role: "region", "aria-live": "polite" });

    var examples = PS.h("div.ps-mm-examples", {}, ["H2O", "Fe2(SO4)3", "CuSO4·5H2O", "C6H12O6", "Ca(OH)2", "KMnO4"]
      .map(function (f) {
        var b = PS.h("button.ps-chip.ps-mm-ex", { type: "button" }, f);
        b.addEventListener("click", function () { input.value = f; compute(); });
        return b;
      }));

    input.addEventListener("input", compute);
    el.appendChild(PS.h("div.ps-mm-controls", {}, [
      PS.h("label.ps-mm-label", { for: "" }, "Chemical formula"), input, examples
    ]));
    el.appendChild(out);
    PS.reveal(out);

    function compute() {
      var raw = input.value.trim();
      out.innerHTML = "";
      if (!raw) { out.appendChild(PS.h("p.ps-muted", {}, "Enter a formula to compute its molar mass.")); return; }
      var counts;
      try { counts = parse(raw); }
      catch (err) { out.appendChild(PS.h("p.ps-state--error", {}, err.message)); return; }

      var syms = Object.keys(counts);
      var unknown = syms.filter(function (s) { return mass[s] == null; });
      if (unknown.length) {
        out.appendChild(PS.h("p.ps-state--error", {}, "Unknown element symbol(s): " + unknown.join(", ")));
        return;
      }
      var total = 0;
      syms.forEach(function (s) { total += mass[s] * counts[s]; });

      out.appendChild(PS.h("div.ps-mm-total", {}, [
        PS.h("span.ps-mm-total-label", {}, "Molar mass"),
        PS.h("span.ps-mm-total-val.ps-mono", {}, total.toFixed(3) + " g/mol")
      ]));

      var table = PS.h("table.ps-mm-table", {}, [
        PS.h("thead", {}, PS.h("tr", {}, ["Element", "Count", "Atomic mass", "Subtotal", "% mass"].map(function (h) {
          return PS.h("th", { scope: "col" }, h);
        }))),
        PS.h("tbody", {}, syms.sort().map(function (s) {
          var sub = mass[s] * counts[s];
          return PS.h("tr", {}, [
            PS.h("td", {}, [PS.h("span.ps-mono", {}, s), " ", PS.h("span.ps-muted", {}, name[s] || "")]),
            PS.h("td.ps-mono", {}, String(counts[s])),
            PS.h("td.ps-mono", {}, mass[s].toFixed(3)),
            PS.h("td.ps-mono", {}, sub.toFixed(3)),
            PS.h("td.ps-mono", {}, (100 * sub / total).toFixed(2) + "%")
          ]);
        }))
      ]);
      out.appendChild(PS.h("div.ps-mm-tablewrap", {}, table));
    }
  });

  // Returns { symbol: count }. Throws on malformed input.
  function parse(formula) {
    var f = String(formula).replace(/[₀-₉]/g, function (c) { return SUBS[c]; }).replace(/\s+/g, "");
    // Split hydrates on middle-dot / bullet / asterisk / period.
    var segs = f.split(/[·•.*]/).filter(Boolean);
    var total = {};
    segs.forEach(function (seg) {
      var m = seg.match(/^(\d+)(.+)$/);
      var coeff = 1, body = seg;
      if (m && /[A-Za-z(\[]/.test(m[2][0])) { coeff = parseInt(m[1], 10); body = m[2]; }
      var counts = parseGroup(body);
      Object.keys(counts).forEach(function (s) { total[s] = (total[s] || 0) + counts[s] * coeff; });
    });
    if (!Object.keys(total).length) throw new Error("Could not parse the formula.");
    return total;
  }

  function parseGroup(str) {
    var stack = [{}];
    var i = 0, n = str.length;
    while (i < n) {
      var ch = str[i];
      if (ch === "(" || ch === "[") { stack.push({}); i++; }
      else if (ch === ")" || ch === "]") {
        i++;
        var num = readNum(str, i); i = num.i;
        var top = stack.pop();
        if (!stack.length) throw new Error("Unbalanced parentheses.");
        var parent = stack[stack.length - 1];
        Object.keys(top).forEach(function (s) { parent[s] = (parent[s] || 0) + top[s] * num.v; });
      } else if (/[A-Z]/.test(ch)) {
        var sym = ch; i++;
        while (i < n && /[a-z]/.test(str[i])) { sym += str[i]; i++; }
        var c = readNum(str, i); i = c.i;
        var m = stack[stack.length - 1];
        m[sym] = (m[sym] || 0) + c.v;
      } else {
        throw new Error("Unexpected character “" + ch + "” in formula.");
      }
    }
    if (stack.length !== 1) throw new Error("Unbalanced parentheses.");
    return stack[0];
  }

  function readNum(str, i) {
    var s = "";
    while (i < str.length && /\d/.test(str[i])) { s += str[i]; i++; }
    return { v: s ? parseInt(s, 10) : 1, i: i };
  }
})();
