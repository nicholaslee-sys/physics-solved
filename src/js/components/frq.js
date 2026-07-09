/* Physics Solved — FRQ practice.
 * <div data-ps-app="frq" data-subject="physics"></div>
 *   data-subject   single subject id (default "physics"); course pages use this.
 *   data-subjects  comma list (e.g. "physics,chemistry") -> subject switcher tabs.
 *   data-grader-endpoint  optional serverless proxy URL; presence enables AI
 *                  grading (PS.grading.provider). Off by default. No key client-side.
 *
 * Filters, badges, and the FRQ file all come from registry.json (per-subject
 * frqFile). Progress (self-check ratings) persists in localStorage under
 * ps.frq.v1.*. There are NO direct API calls unless a grader endpoint is set.
 */
(function () {
  "use strict";
  var PS = window.PS;
  var PKEY = "ps.frq.v1.";

  function loadProg(qid) {
    try { return JSON.parse(localStorage.getItem(PKEY + qid)) || null; } catch (e) { return null; }
  }
  function saveProg(qid, obj) {
    try { localStorage.setItem(PKEY + qid, JSON.stringify(obj)); } catch (e) {}
  }
  function statusOf(q) {
    var p = loadProg(q.id);
    if (!p || !p.parts) return "none";
    var rated = Object.keys(p.parts);
    if (!rated.length) return "none";
    var parts = q.parts || [];
    var allGot = parts.length > 0 && parts.every(function (_, i) { return p.parts[i] === "got"; });
    return allGot ? "mastered" : "attempted";
  }

  PS.register("frq", async function (el) {
    var reg = await PS.getRegistry();

    var endpoint = el.getAttribute("data-grader-endpoint");
    if (endpoint && PS.grading) PS.grading.provider = { endpoint: endpoint };

    var ids = (el.getAttribute("data-subjects") || el.getAttribute("data-subject") || "physics")
      .split(",").map(function (s) { return s.trim(); }).filter(Boolean);
    var subjects = ids.map(function (id) {
      return (reg.subjects || []).find(function (s) { return s.id === id; });
    }).filter(Boolean);
    if (!subjects.length) {
      el.innerHTML = "";
      el.appendChild(PS.h("div.ps-state.ps-state--error", {}, "No FRQ subjects configured."));
      return;
    }

    el.innerHTML = "";
    var courseById = {};
    var questions = [];
    var filter = "all", diffFilter = 0, selectedId = null, curSubject = null;

    /* ---- Skeleton --------------------------------------------------- */
    var subjectTabs = PS.h("div.ps-frq-subjects", { role: "tablist", "aria-label": "Subject" });
    var pills = PS.h("div.ps-pills", { role: "tablist", "aria-label": "Filter questions by course" });
    var diffPills = PS.h("div.ps-pills.ps-frq-difffilter", { role: "group", "aria-label": "Filter by difficulty" });
    var randomBtn = PS.h("button.ps-btn.ps-btn--ghost", { type: "button" }, "🎲 Random question");
    randomBtn.addEventListener("click", pickRandom);
    var controls = PS.h("div.ps-frq-controls", {}, [pills, PS.h("div.ps-frq-controls-right", {}, [diffPills, randomBtn])]);

    var progress = PS.h("div.ps-frq-progress", { role: "status", "aria-live": "polite" });
    var listWrap = PS.h("div.ps-frq-list", { role: "list", "aria-label": "Questions" });
    var mobileSelect = PS.h("select.ps-frq-select", { "aria-label": "Choose a question" });
    mobileSelect.addEventListener("change", function () { if (mobileSelect.value) selectQuestion(mobileSelect.value); });
    var listCol = PS.h("div.ps-frq-listcol", {}, [mobileSelect, progress, listWrap]);
    var viewer = PS.h("div.ps-frq-viewer", { role: "region", "aria-live": "polite", "aria-label": "Question viewer" });
    var panes = PS.h("div.ps-frq-panes", {}, [listCol, viewer]);

    if (subjects.length > 1) {
      subjects.forEach(function (s) {
        var btn = PS.h("button.ps-frq-subject", { type: "button", role: "tab",
          "aria-selected": "false", style: s.accentTab }, s.label);
        btn.addEventListener("click", function () { loadSubject(s); });
        subjectTabs.appendChild(btn);
      });
      el.appendChild(subjectTabs);
    }
    el.appendChild(controls);
    el.appendChild(panes);
    PS.reveal(panes);

    // Difficulty filter pills
    [{ v: 0, label: "Any level" }, { v: 1, label: "Easy" }, { v: 2, label: "Medium" }, { v: 3, label: "Hard" }]
      .forEach(function (d) {
        var b = PS.h("button.ps-pill", { type: "button", "aria-pressed": d.v === 0 ? "true" : "false", "data-diff": d.v }, d.label);
        b.addEventListener("click", function () {
          diffFilter = d.v;
          diffPills.querySelectorAll(".ps-pill").forEach(function (x) {
            x.setAttribute("aria-pressed", String(+x.getAttribute("data-diff") === diffFilter));
          });
          renderList();
        });
        diffPills.appendChild(b);
      });

    await loadSubject(subjects[0]);

    /* ---- Subject loading -------------------------------------------- */
    async function loadSubject(subject) {
      curSubject = subject;
      subjectTabs.querySelectorAll(".ps-frq-subject").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.textContent === subject.label));
      });
      courseById = {};
      subject.courses.forEach(function (c) { courseById[c.id] = c; });
      var frqFile = subject.frqFile || ("frq/" + subject.id + ".json");
      var data;
      try { data = await PS.fetchJSON(frqFile); }
      catch (e) { questions = []; }
      questions = (data && data.questions) || [];
      filter = "all"; selectedId = null;
      renderCoursePills();
      renderList();
      renderProgress();
      showEmpty();
    }

    function renderCoursePills() {
      pills.innerHTML = "";
      var frqCourses = curSubject.courses.filter(function (c) { return (c.features || []).indexOf("frq") !== -1; });
      var defs = [{ id: "all", label: "All" }].concat(frqCourses.map(function (c) {
        return { id: c.id, label: c.label, accent: c.accent };
      }));
      defs.forEach(function (p) {
        var btn = PS.h("button.ps-pill", { type: "button", role: "tab",
          "aria-selected": p.id === filter ? "true" : "false",
          "data-course": p.id, style: p.accent ? "--ps-accent:" + p.accent : null }, p.label);
        btn.addEventListener("click", function () { setFilter(p.id); });
        pills.appendChild(btn);
      });
    }

    /* ---- List ------------------------------------------------------- */
    function visibleQuestions() {
      return questions.filter(function (q) {
        if (filter !== "all" && q.courseId !== filter) return false;
        if (diffFilter && (q.difficulty || 0) !== diffFilter) return false;
        return true;
      });
    }

    function setFilter(id) {
      filter = id;
      pills.querySelectorAll(".ps-pill").forEach(function (b) {
        b.setAttribute("aria-selected", String(b.getAttribute("data-course") === id));
      });
      renderList();
      if (!visibleQuestions().some(function (q) { return q.id === selectedId; })) showEmpty();
    }

    function diffDots(d) {
      d = Math.max(0, Math.min(3, d || 0));
      var wrap = PS.h("span.ps-frq-diff", { title: "Difficulty " + d + "/3", "aria-label": "Difficulty " + d + " of 3" });
      for (var i = 1; i <= 3; i++) wrap.appendChild(PS.h("span.ps-frq-dot" + (i <= d ? ".is-on" : ""), {}));
      return wrap;
    }

    function statusBadge(status) {
      if (status === "mastered") return PS.h("span.ps-frq-status.is-mastered", { title: "All parts self-rated correct" }, "✓ Mastered");
      if (status === "attempted") return PS.h("span.ps-frq-status.is-attempted", { title: "Previously attempted" }, "Attempted");
      return null;
    }

    function renderList() {
      listWrap.innerHTML = "";
      mobileSelect.innerHTML = "";
      mobileSelect.appendChild(PS.h("option", { value: "" }, "Select a question…"));
      var vis = visibleQuestions();
      if (!vis.length) {
        listWrap.appendChild(PS.h("div.ps-state", {}, "No questions in this filter yet."));
        return;
      }
      vis.forEach(function (q) {
        var course = courseById[q.courseId] || {};
        var status = statusOf(q);
        var item = PS.h("button.ps-frq-item", { type: "button", role: "listitem",
          "data-id": q.id, "aria-current": q.id === selectedId ? "true" : "false" }, [
          PS.h("span.ps-frq-item-top", {}, [
            PS.h("span.ps-badge", { style: "--ps-accent:" + (course.accent || "#2547d0") }, course.label || q.courseId),
            diffDots(q.difficulty),
            statusBadge(status)
          ]),
          PS.h("span.ps-frq-item-unit", {}, q.unit || ""),
          PS.h("span.ps-frq-item-title", {}, q.title || "Untitled")
        ]);
        item.addEventListener("click", function () { selectQuestion(q.id); });
        listWrap.appendChild(item);
        mobileSelect.appendChild(PS.h("option", { value: q.id },
          (course.label ? course.label + " — " : "") + (q.title || "Untitled")));
      });
      if (selectedId) mobileSelect.value = selectedId;
    }

    function renderProgress() {
      var frqCourses = curSubject.courses.filter(function (c) { return (c.features || []).indexOf("frq") !== -1; });
      var bits = [];
      frqCourses.forEach(function (c) {
        var qs = questions.filter(function (q) { return q.courseId === c.id; });
        if (!qs.length) return;
        var att = 0, mas = 0;
        qs.forEach(function (q) { var s = statusOf(q); if (s === "attempted") att++; else if (s === "mastered") { att++; mas++; } });
        bits.push(c.label + ": " + mas + "★ · " + att + "/" + qs.length + " tried");
      });
      progress.textContent = bits.length ? bits.join("   ") : "";
    }

    function pickRandom() {
      var vis = visibleQuestions();
      if (!vis.length) return;
      selectQuestion(vis[Math.floor(Math.random() * vis.length)].id);
    }

    function markActive(id) {
      listWrap.querySelectorAll(".ps-frq-item").forEach(function (b) {
        b.setAttribute("aria-current", String(b.getAttribute("data-id") === id));
      });
      mobileSelect.value = id || "";
    }

    function showEmpty() {
      selectedId = null;
      markActive(null);
      viewer.innerHTML = "";
      viewer.appendChild(PS.h("div.ps-frq-empty", {}, [
        PS.h("div.ps-frq-empty-icon", { "aria-hidden": "true" }, "📝"),
        PS.h("p.ps-frq-empty-title", {}, "Pick a question to get started"),
        PS.h("p.ps-muted", {}, "Select a question from the list — or try a random one.")
      ]));
    }

    function selectQuestion(id) {
      var q = questions.find(function (x) { return x.id === id; });
      if (!q) return;
      selectedId = id;
      markActive(id);
      renderQuestion(q);
    }

    /* ---- Viewer ----------------------------------------------------- */
    function renderQuestion(q) {
      var course = courseById[q.courseId] || {};
      viewer.innerHTML = "";
      viewer.appendChild(PS.h("div.ps-frq-qhead", {}, [
        PS.h("span.ps-badge", { style: "--ps-accent:" + (course.accent || "#2547d0") }, course.label || q.courseId),
        q.unit ? PS.h("span.ps-frq-qunit", {}, q.unit) : null,
        diffDots(q.difficulty),
        PS.h("h3.ps-frq-qtitle", {}, q.title || "Untitled")
      ]));
      if (q.scenario) viewer.appendChild(PS.h("p.ps-frq-scenario", {}, q.scenario));

      var partNodes = [];
      (q.parts || []).forEach(function (part, i) {
        var taId = "ps-frq-" + q.id + "-p" + i;
        var ta = PS.h("textarea.ps-frq-answer", { id: taId, rows: "3", placeholder: "Your answer…" });
        var reveal = PS.h("div.ps-frq-reveal", { hidden: true });
        viewer.appendChild(PS.h("div.ps-frq-part", {}, [
          PS.h("label.ps-frq-part-label", { for: taId }, [
            PS.h("span.ps-frq-part-tag", {}, part.label || "Part " + (i + 1)),
            part.points ? PS.h("span.ps-frq-points", {}, part.points + " pt" + (part.points === 1 ? "" : "s")) : null
          ]),
          part.text ? PS.h("p.ps-frq-part-text", {}, part.text) : null,
          ta, reveal
        ]));
        partNodes.push({ part: part, ta: ta, reveal: reveal, points: part.points || 1 });
      });

      var checkBtn = PS.h("button.ps-btn", { type: "button" }, "Check my work");
      var summary = PS.h("div.ps-frq-summary", { role: "status", "aria-live": "polite", hidden: true });
      viewer.appendChild(PS.h("div.ps-frq-actions", {}, [checkBtn, summary]));

      checkBtn.addEventListener("click", async function () {
        var answers = {};
        partNodes.forEach(function (p, i) { answers[p.part.label || "Part " + (i + 1)] = p.ta.value; });
        checkBtn.disabled = true;
        checkBtn.textContent = "Checking…";
        var result;
        try { result = await PS.grading.grade(q, answers); }
        catch (err) {
          console.error(err);
          checkBtn.disabled = false;
          checkBtn.textContent = "Check my work";
          summary.hidden = false;
          summary.textContent = "Grading service unavailable — showing model answers.";
          renderSelfCheck();
          return;
        }
        checkBtn.textContent = "Answers revealed";
        if (result && result.mode === "graded" && result.parts) renderGraded(result);
        else renderSelfCheck();
      });

      function renderSelfCheck() {
        var saved = loadProg(q.id);
        var state = (saved && saved.parts) ? Object.assign({}, saved.parts) : {};
        partNodes.forEach(function (p, i) {
          p.reveal.hidden = false;
          p.reveal.innerHTML = "";
          if (p.part.modelAnswer) {
            p.reveal.appendChild(PS.h("div.ps-frq-model", {}, [
              PS.h("span.ps-frq-model-tag", {}, "Model answer"),
              PS.h("span.ps-frq-model-text.ps-mono", {}, p.part.modelAnswer)
            ]));
          }
          var seg = PS.h("div.ps-segment.ps-frq-selfassess", { role: "group",
            "aria-label": "How did you do on " + (p.part.label || "this part") + "?" });
          [["got", "Got it"], ["partial", "Partially"], ["missed", "Missed"]].forEach(function (opt) {
            var b = PS.h("button.ps-segment-btn", { type: "button", "data-v": opt[0],
              "aria-pressed": String(state[i] === opt[0]) }, opt[1]);
            b.addEventListener("click", function () {
              state[i] = opt[0];
              seg.querySelectorAll(".ps-segment-btn").forEach(function (x) {
                x.setAttribute("aria-pressed", String(x.getAttribute("data-v") === opt[0]));
              });
              saveProg(q.id, { parts: state, ts: Date.now() });
              updateSummary();
              renderList();
              renderProgress();
            });
            seg.appendChild(b);
          });
          p.reveal.appendChild(seg);
        });

        function updateSummary() {
          var total = 0, earned = 0, answered = 0;
          partNodes.forEach(function (p, i) {
            total += p.points;
            if (state[i]) { answered++; earned += state[i] === "got" ? p.points : state[i] === "partial" ? p.points / 2 : 0; }
          });
          summary.hidden = false;
          summary.textContent = !answered ? "Rate each part to record your progress."
            : "Self-score: " + round(earned) + " / " + total + " pts (" + answered + " of " + partNodes.length + " parts rated)";
        }
        updateSummary();
      }

      function renderGraded(result) {
        partNodes.forEach(function (p, i) {
          var fb = result.parts[i] || {};
          p.reveal.hidden = false;
          p.reveal.innerHTML = "";
          p.reveal.appendChild(PS.h("div.ps-frq-model", {}, [
            PS.h("span.ps-frq-model-tag", {}, "Feedback" +
              (fb.score != null ? " · " + fb.score + "/" + (fb.max != null ? fb.max : p.points) : "")),
            PS.h("span.ps-frq-model-text", {}, fb.feedback || "—")
          ]));
        });
        summary.hidden = false;
        summary.textContent = result.score != null
          ? "Score: " + result.score + " / " + (result.max != null ? result.max : "") + " pts" : "Graded.";
      }
    }
  });

  function round(n) { return Math.round(n * 10) / 10; }
})();
