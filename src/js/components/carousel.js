/* Physics Solved — course carousel.
 * <div data-ps-app="carousel" data-subject="physics"></div>
 * Renders one card per course in the given subject, straight from registry.json.
 * Scroll-snap track, prev/next arrows, edge-fade masks, keyboard arrows.
 */
(function () {
  "use strict";
  var PS = window.PS;

  function card(course) {
    var live = course.status === "live" && course.url;
    var accent = course.accent || "#2547d0";
    var cover = PS.h("div.ps-course-cover", {
      style: "--ps-accent:" + accent,
      "aria-hidden": "true"
    }, PS.h("span.ps-course-cover-mark", {}, initials(course.label)));

    var body = PS.h("div.ps-course-body", {}, [
      course.eyebrow ? PS.h("div.ps-eyebrow", {}, course.eyebrow) : null,
      PS.h("h3.ps-course-title", {}, course.label),
      course.blurb ? PS.h("p.ps-course-blurb", {}, course.blurb) : null,
      course.status === "coming-soon"
        ? PS.h("span.ps-badge.ps-badge--muted", {}, "Coming soon")
        : PS.h("span.ps-course-cta", { "aria-hidden": "true" }, "Open course →")
    ]);

    if (live) {
      return PS.h("a.ps-card.ps-course-card", {
        href: course.url,
        style: "--ps-accent:" + accent,
        "aria-label": course.label + (course.eyebrow ? " — " + course.eyebrow : "")
      }, [cover, body]);
    }
    return PS.h("div.ps-card.ps-course-card.is-coming", {
      style: "--ps-accent:" + accent,
      "aria-disabled": "true"
    }, [cover, body]);
  }

  function initials(label) {
    return String(label || "")
      .replace(/[^A-Za-z0-9 ]/g, "")
      .split(/\s+/)
      .slice(0, 2)
      .map(function (w) { return w[0]; })
      .join("")
      .toUpperCase();
  }

  PS.register("carousel", async function (el) {
    var subjectId = el.getAttribute("data-subject") || "physics";
    var reg = await PS.getRegistry();
    var subject = (reg.subjects || []).find(function (s) { return s.id === subjectId; });
    el.innerHTML = "";
    if (!subject || !subject.courses || !subject.courses.length) {
      el.appendChild(PS.h("div.ps-state", {}, "No courses found for “" + subjectId + "”."));
      return;
    }

    var track = PS.h("div.ps-carousel-track", { role: "list", tabindex: "0",
      "aria-label": subject.label + " courses" });
    subject.courses.forEach(function (c) {
      var wrap = PS.h("div.ps-carousel-item", { role: "listitem" }, card(c));
      track.appendChild(wrap);
    });

    var prev = PS.h("button.ps-carousel-arrow.ps-carousel-arrow--prev", {
      type: "button", "aria-label": "Previous courses" }, arrow("left"));
    var next = PS.h("button.ps-carousel-arrow.ps-carousel-arrow--next", {
      type: "button", "aria-label": "Next courses" }, arrow("right"));

    var viewport = PS.h("div.ps-carousel-viewport", {}, track);
    var carousel = PS.h("div.ps-carousel", {}, [prev, viewport, next]);
    el.appendChild(carousel);

    function step() {
      var item = track.querySelector(".ps-carousel-item");
      return item ? item.getBoundingClientRect().width + 16 : 280;
    }
    function scrollBy(dir) {
      track.scrollBy({ left: dir * step(), behavior: PS.reducedMotion() ? "auto" : "smooth" });
    }
    prev.addEventListener("click", function () { scrollBy(-1); });
    next.addEventListener("click", function () { scrollBy(1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); scrollBy(-1); }
    });

    function update() {
      var maxScroll = track.scrollWidth - track.clientWidth - 1;
      var x = track.scrollLeft;
      prev.disabled = x <= 0;
      next.disabled = x >= maxScroll;
      carousel.classList.toggle("has-fade-start", x > 4);
      carousel.classList.toggle("has-fade-end", x < maxScroll - 4);
    }
    track.addEventListener("scroll", function () {
      window.requestAnimationFrame(update);
    });
    window.addEventListener("resize", update);
    update();
    PS.reveal(carousel);
  });

  function arrow(dir) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "2");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }
})();
