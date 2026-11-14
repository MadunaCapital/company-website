// Small, dependency-free interactions: logo reveal video, scroll reveals,
// rolling counters, the pipeline tabs and the nav shadow.
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

  // Pipeline tabs.
  var STAGES = [
    { meta: "Synchronised", title: "Read every market at the same moment", desc: "Independent services read live public prices from every source on a shared clock, so two prices are never compared when one is already out of date.", tags: ["Shared clock", "Public data only", "Cloud-native"] },
    { meta: "Entity resolution", title: "Recognise the same event everywhere", desc: "Every source names teams, players and events differently. The engine matches them with careful fuzzy logic and safety guards, so a mismatch is a missed signal, never a false one.", tags: ["Fuzzy matching", "Safety guards", "Thousands of events"] },
    { meta: "Microseconds", title: "Spot the disagreement instantly", desc: "For each event the engine keeps the best fresh price for every outcome and checks the arithmetic in microseconds after each update.", tags: ["Real time", "Every update", "Plausibility checks"] },
    { meta: "Survival models", title: "Predict how long it will last", desc: "Models trained on our own recorded history estimate each opportunity’s expected lifetime and the risk that it closes before anyone can act.", tags: ["Lifetime", "Risk score", "79% ranking accuracy"] },
    { meta: "Ranked & sized", title: "Turn it into a decision-ready signal", desc: "Confirmed signals are ranked by how likely they are to last and sized to the capital actually available, then handed to a person to decide.", tags: ["Confirmation", "Ranking", "Capital-aware sizing"] }
  ];
  var nodes = document.querySelectorAll(".pipe-node");
  var meta = document.getElementById("pipeMeta");
  var title = document.getElementById("pipeTitle");
  var desc = document.getElementById("pipeDesc");
  var tags = document.getElementById("pipeTags");
  function select(i) {
    nodes.forEach(function (n, j) { n.setAttribute("aria-selected", j === i ? "true" : "false"); });
    var s = STAGES[i];
    meta.textContent = "Stage 0" + (i + 1) + " / 05 · " + s.meta;
    title.textContent = s.title;
    desc.textContent = s.desc;
    tags.innerHTML = "";
    s.tags.forEach(function (t) { var e = document.createElement("span"); e.textContent = t; tags.appendChild(e); });
  }
  nodes.forEach(function (n, i) {
    n.addEventListener("click", function () { select(i); });
    n.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        var k = (i + (e.key === "ArrowRight" ? 1 : nodes.length - 1)) % nodes.length;
        nodes[k].focus(); select(k);
      }
    });
  });

  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
