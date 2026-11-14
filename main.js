// Small, dependency-free interactions: logo reveal video, scroll reveals,
// rolling counters and the nav shadow.
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Logo reveal: plays once, stops on the finished logo, offers a replay.
  var card = document.querySelector(".reveal-card");
  var video = document.getElementById("heroVideo");
  var replay = document.getElementById("replayBtn");
  if (video && card) {
    var markDone = function () { card.classList.add("done"); };
    video.addEventListener("ended", markDone);
    if (reduce) {
      markDone(); // the poster is the finished logo
    } else {
      var p = video.play();
      if (p && p.catch) p.catch(markDone);
    }
    replay.addEventListener("click", function () {
      card.classList.remove("done");
      video.currentTime = 0;
      video.play();
    });
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
