/* Physics Solved — constants library.
 * <div data-ps-app="constants"></div>
 * Searchable physics + chemistry constants from data/constants.json.
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("constants", async function (el) {
    var data = await PS.fetchJSON("constants.json");
    var items = data.constants || [];
    el.innerHTML = "";

    var query = "", activeCat = null;
    var cats = [];
    items.forEach(function (c) { if (cats.indexOf(c.category) === -1) cats.push(c.category); });

    var search = PS.h("input.ps-const-search", { type: "search",
      placeholder: "Search constants by name or symbol…", "aria-label": "Search constants" });
    search.addEventListener("input", function () { query = search.value.trim().toLowerCase(); render(); });

    var filter = PS.h("div.ps-pills.ps-const-filter", { role: "group", "aria-label": "Filter by category" });
    [{ id: null, label: "All" }].concat(cats.map(function (c) { return { id: c, label: cap(c) }; })).forEach(function (c) {
      var b = PS.h("button.ps-pill", { type: "button", "aria-pressed": String(c.id === activeCat) }, c.label);
      b.addEventListener("click", function () {
        activeCat = c.id;
        filter.querySelectorAll(".ps-pill").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        render();
      });
      filter.appendChild(b);
    });

    var list = PS.h("div.ps-const-list", { role: "list" });
    el.appendChild(PS.h("div.ps-const-controls", {}, [search, filter]));
    el.appendChild(list);
    PS.reveal(list);
    render();

    function render() {
      list.innerHTML = "";
      var shown = items.filter(function (c) {
        var q = !query || (c.name + " " + c.symbol).toLowerCase().indexOf(query) !== -1;
        var cat = !activeCat || c.category === activeCat;
        return q && cat;
      });
      if (!shown.length) { list.appendChild(PS.h("div.ps-state", {}, "No constants match your search.")); return; }
      shown.forEach(function (c) {
        list.appendChild(PS.h("div.ps-const-item", { role: "listitem" }, [
          PS.h("span.ps-const-sym.ps-mono", {}, c.symbol),
          PS.h("div.ps-const-body", {}, [
            PS.h("span.ps-const-name", {}, c.name),
            PS.h("span.ps-const-val.ps-mono", {}, c.value + " " + c.units)
          ]),
          PS.h("span.ps-const-tag" + (c.exact ? ".is-exact" : ""), { title: c.exact ? "Exact by SI definition" : "Measured / rounded value" }, c.exact ? "exact" : "measured")
        ]));
      });
    }
  });

  function cap(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }
})();
