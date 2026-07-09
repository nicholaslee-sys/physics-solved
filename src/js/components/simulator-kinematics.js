/* Physics Solved — projectile / kinematics simulator.
 * <div data-ps-app="simulator-kinematics"></div>
 * A dark-panel accent (uses the #101426 ink token, not a separate palette).
 * Launch controls -> canvas trajectory + live data table + equation strip.
 * Honors prefers-reduced-motion (draws the full path instantly).
 */
(function () {
  "use strict";
  var PS = window.PS;

  PS.register("simulator-kinematics", async function (el) {
    el.innerHTML = "";
    var state = { v: 20, angle: 45, h: 0, g: 9.8 };

    var canvas = PS.h("canvas.ps-sim-canvas", { role: "img",
      "aria-label": "Projectile trajectory" });
    var ctx = canvas.getContext("2d");

    var readout = PS.h("div.ps-sim-readout", { "aria-live": "polite" });
    var tableWrap = PS.h("div.ps-sim-tablewrap");
    var eqStrip = PS.h("div.ps-sim-eqstrip.ps-mono");

    var controls = PS.h("div.ps-sim-controls", {}, [
      slider("Launch speed", "v", 1, 60, 1, "m/s"),
      slider("Angle", "angle", 0, 90, 1, "°"),
      slider("Initial height", "h", 0, 50, 1, "m"),
      gravitySelect()
    ]);

    var launchBtn = PS.h("button.ps-btn", { type: "button" }, "▶ Launch");
    var resetBtn = PS.h("button.ps-btn.ps-btn--ghost.ps-btn--on-dark", { type: "button" }, "Reset");
    launchBtn.addEventListener("click", function () { run(); });
    resetBtn.addEventListener("click", function () { compute(); drawStatic(); });
    var buttons = PS.h("div.ps-sim-buttons", {}, [launchBtn, resetBtn]);

    var panel = PS.h("div.ps-sim.ps-sim--dark", {}, [
      PS.h("div.ps-sim-head", {}, [
        PS.h("h2.ps-sim-title", {}, "Kinematics Simulator"),
        PS.h("p.ps-sim-sub", {}, "Projectile launcher — adjust the controls and launch.")
      ]),
      PS.h("div.ps-sim-grid", {}, [
        PS.h("div.ps-sim-left", {}, [canvas, eqStrip]),
        PS.h("div.ps-sim-right", {}, [controls, buttons, readout, tableWrap])
      ])
    ]);
    el.appendChild(panel);
    PS.reveal(panel);

    var traj = [];
    var meta = {};
    var raf = null;

    function slider(label, key, min, max, step, unit) {
      var id = "ps-sim-" + key;
      var out = PS.h("output.ps-sim-val.ps-mono", { for: id }, state[key] + unit);
      var input = PS.h("input.ps-sim-range", {
        id: id, type: "range", min: min, max: max, step: step, value: state[key]
      });
      input.addEventListener("input", function () {
        state[key] = parseFloat(input.value);
        out.textContent = state[key] + unit;
        compute(); drawStatic();
      });
      return PS.h("div.ps-sim-control", {}, [
        PS.h("label.ps-sim-label", { for: id }, [label, out]),
        input
      ]);
    }

    function gravitySelect() {
      var id = "ps-sim-g";
      var sel = PS.h("select.ps-sim-select", { id: id });
      [["Earth", 9.8], ["Moon", 1.6], ["Mars", 3.7], ["Jupiter", 24.8]].forEach(function (o) {
        sel.appendChild(PS.h("option", { value: o[1] }, o[0] + " (" + o[1] + " m/s²)"));
      });
      sel.value = String(state.g);
      sel.addEventListener("change", function () {
        state.g = parseFloat(sel.value); compute(); drawStatic();
      });
      return PS.h("div.ps-sim-control", {}, [
        PS.h("label.ps-sim-label", { for: id }, "Gravity"),
        sel
      ]);
    }

    function compute() {
      var rad = state.angle * Math.PI / 180;
      var vx = state.v * Math.cos(rad);
      var vy0 = state.v * Math.sin(rad);
      var g = state.g, h = state.h;
      var tFlight = (vy0 + Math.sqrt(vy0 * vy0 + 2 * g * h)) / g;
      var range = vx * tFlight;
      var maxH = h + (vy0 * vy0) / (2 * g);
      meta = { vx: vx, vy0: vy0, tFlight: tFlight, range: range, maxH: maxH };

      traj = [];
      var N = 240;
      for (var i = 0; i <= N; i++) {
        var t = tFlight * i / N;
        traj.push({ t: t, x: vx * t, y: Math.max(0, h + vy0 * t - 0.5 * g * t * t),
          vx: vx, vy: vy0 - g * t });
      }

      eqStrip.innerHTML = "";
      [
        "x = v₀cosθ · t",
        "y = y₀ + v₀sinθ · t − ½gt²",
        "R = " + meta.range.toFixed(1) + " m",
        "t = " + meta.tFlight.toFixed(2) + " s",
        "H = " + meta.maxH.toFixed(1) + " m"
      ].forEach(function (s) { eqStrip.appendChild(PS.h("span.ps-sim-eq", {}, s)); });

      readout.textContent = "Range " + meta.range.toFixed(1) + " m · flight time " +
        meta.tFlight.toFixed(2) + " s · peak height " + meta.maxH.toFixed(1) + " m.";

      renderTable();
    }

    function renderTable() {
      tableWrap.innerHTML = "";
      var table = PS.h("table.ps-sim-table", {});
      var thead = PS.h("thead", {}, PS.h("tr", {}, ["t (s)", "x (m)", "y (m)", "vₓ (m/s)", "v_y (m/s)"].map(function (h) {
        return PS.h("th", { scope: "col" }, h);
      })));
      var tbody = PS.h("tbody");
      var rows = 8;
      for (var i = 0; i <= rows; i++) {
        var p = traj[Math.round(traj.length ? (traj.length - 1) * i / rows : 0)] || { t: 0, x: 0, y: 0, vx: 0, vy: 0 };
        tbody.appendChild(PS.h("tr", {}, [
          p.t.toFixed(2), p.x.toFixed(1), p.y.toFixed(1), p.vx.toFixed(1), p.vy.toFixed(1)
        ].map(function (c) { return PS.h("td.ps-mono", {}, c); })));
      }
      table.appendChild(thead); table.appendChild(tbody);
      tableWrap.appendChild(table);
    }

    function fit() {
      var w = canvas.clientWidth || 480;
      var h = Math.max(220, Math.round(w * 0.6));
      var dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w: w, h: h };
    }

    function mapper(size) {
      var pad = 28;
      var maxX = Math.max(meta.range, 1);
      var maxY = Math.max(meta.maxH, state.h, 1) * 1.1;
      var sx = (size.w - pad * 2) / maxX;
      var sy = (size.h - pad * 2) / maxY;
      return {
        X: function (x) { return pad + x * sx; },
        Y: function (y) { return size.h - pad - y * sy; }
      };
    }

    function drawFrame(upto) {
      var size = fit();
      var m = mapper(size);
      ctx.clearRect(0, 0, size.w, size.h);
      // ground
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(20, m.Y(0)); ctx.lineTo(size.w - 12, m.Y(0)); ctx.stroke();
      // full faint path
      strokePath(m, traj.length - 1, "rgba(255,255,255,.15)", 1.5);
      // travelled path
      strokePath(m, upto, "#5f7cf0", 2.5);
      // projectile
      var p = traj[Math.min(upto, traj.length - 1)];
      if (p) {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(m.X(p.x), m.Y(p.y), 5, 0, Math.PI * 2); ctx.fill();
      }
      // apex marker
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText("apex " + meta.maxH.toFixed(1) + " m", m.X(meta.range / 2) - 24, m.Y(meta.maxH) - 8);
    }

    function strokePath(m, upto, color, width) {
      if (!traj.length) return;
      ctx.strokeStyle = color; ctx.lineWidth = width;
      ctx.beginPath();
      for (var i = 0; i <= upto && i < traj.length; i++) {
        var q = traj[i];
        if (i === 0) ctx.moveTo(m.X(q.x), m.Y(q.y));
        else ctx.lineTo(m.X(q.x), m.Y(q.y));
      }
      ctx.stroke();
    }

    function drawStatic() { drawFrame(traj.length - 1); }

    function run() {
      if (raf) cancelAnimationFrame(raf);
      if (PS.reducedMotion()) { drawStatic(); return; }
      var start = null;
      var duration = Math.min(2400, Math.max(700, meta.tFlight * 600));
      function tick(ts) {
        if (start == null) start = ts;
        var k = Math.min(1, (ts - start) / duration);
        drawFrame(Math.round(k * (traj.length - 1)));
        if (k < 1) raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    }

    var resizeTimer;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(drawStatic, 120);
    });

    compute();
    // Canvas needs layout before first draw.
    requestAnimationFrame(drawStatic);
  });
})();
