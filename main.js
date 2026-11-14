// Small, dependency-free interactions: the looping logo video, scroll reveals,
// rolling counters and the nav shadow.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Logo animation: loops continuously; with reduced motion it stays on the
  // finished logo (the poster).
  var video = document.getElementById("heroVideo");
  if (video) {
    if (reduce) {
      video.removeAttribute("loop");
    } else {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
      // Dissolve the finished logo over the last moments of each loop, so it
      // fades back to blank paper instead of vanishing in one frame.
      var FADE = 0.7;
      var tick = function () {
        var d = video.duration;
        if (d) {
          var left = d - video.currentTime;
          video.style.opacity = left < FADE ? Math.max(0, left / FADE).toFixed(3) : "1";
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // Nav border once the page scrolls.
  var nav = document.getElementById("nav");
  var onScroll = function () { nav.classList.toggle("scrolled", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Rolling counters.
  function runCount(el) {
    var to = parseFloat(el.dataset.to);
    var dec = parseInt(el.dataset.dec || "0", 10);
    var sep = el.dataset.sep === "1";
    var fmt = function (v) {
      var s = v.toFixed(dec);
      return sep ? Number(s).toLocaleString("en-ZA").replace(/ /g, ",") : s;
    };
    if (reduce) { el.textContent = fmt(to); return; }
    var start = null, dur = 1600;
    var step = function (t) {
      if (!start) start = t;
      var k = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(to * eased);
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // Scroll reveals + counters, staggered within each group.
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        var sibs = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("reveal"); });
        el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 80 + "ms";
        el.classList.add("in");
        el.querySelectorAll(".count").forEach(runCount);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll(".count").forEach(runCount);
  }

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
