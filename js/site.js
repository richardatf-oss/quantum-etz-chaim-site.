// js/site.js
(() => {
  // Footer year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Basic mapping (we’ll finalize your canonical assignments next)
  // For now: each node goes to trees.html (later: to /trees/<slug>.html).
  const nodeLinks = {
    keter: "trees.html",
    chokhmah: "trees.html",
    binah: "trees.html",
    chesed: "trees.html",
    gevurah: "trees.html",
    tiferet: "trees.html",
    netzach: "trees.html",
    hod: "trees.html",
    yesod: "trees.html",
    malkhut: "trees.html",
  };

  const container = document.getElementById("treeMap");
  if (!container) return;

  // Luminous SVG Tree (abstract + diagrammatic; no figures)
  container.innerHTML = `
  <svg viewBox="0 0 760 980" role="img" aria-label="Etz Chaim diagram">
    <defs>
      <radialGradient id="orb" cx="50%" cy="40%" r="65%">
        <stop offset="0%" stop-color="rgba(255,255,255,.95)"/>
        <stop offset="45%" stop-color="rgba(122,167,255,.35)"/>
        <stop offset="100%" stop-color="rgba(255,255,255,.06)"/>
      </radialGradient>

      <linearGradient id="beam" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(156,255,208,.55)"/>
        <stop offset="55%" stop-color="rgba(122,167,255,.35)"/>
        <stop offset="100%" stop-color="rgba(255,179,107,.22)"/>
      </linearGradient>

      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="b"/>
        <feMerge>
          <feMergeNode in="b"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>

      <style>
        .wire{ stroke: rgba(255,255,255,.20); stroke-width:2; fill:none; }
        .wire2{ stroke: rgba(122,167,255,.20); stroke-width:2; fill:none; }
        .orb{ cursor:pointer; }
        .orb circle.main{ fill:url(#orb); stroke: rgba(255,255,255,.22); stroke-width:2; }
        .orb circle.ring{ fill:none; stroke: rgba(122,167,255,.22); stroke-width:2; }
        .orb:hover circle.ring{ stroke: rgba(156,255,208,.35); }
        .label{ font: 600 16px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; fill: rgba(255,255,255,.82); letter-spacing:.2px; }
        .sublabel{ font: 500 13px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; fill: rgba(255,255,255,.55); }
      </style>
    </defs>

    <!-- soft central beam -->
    <path d="M380 85 L380 900" stroke="url(#beam)" stroke-width="10" opacity=".16" filter="url(#glow)"/>

    <!-- connecting wires -->
    <path class="wire" d="M380 120 L240 225 L120 355" />
    <path class="wire" d="M380 120 L520 225 L640 355" />
    <path class="wire2" d="M240 225 L520 225" />
    <path class="wire" d="M120 355 L240 355 L380 455" />
    <path class="wire" d="M640 355 L520 355 L380 455" />
    <path class="wire2" d="M240 355 L520 355" />
    <path class="wire" d="M380 455 L240 585 L120 720" />
    <path class="wire" d="M380 455 L520 585 L640 720" />
    <path class="wire2" d="M240 585 L520 585" />
    <path class="wire" d="M380 455 L380 835" />
    <path class="wire2" d="M120 720 L380 835 L640 720" />

    <!-- ORBS -->
    ${orb("keter",   380, 120, "Keter", "Crown")}
    ${orb("chokhmah",240, 225, "Chokhmah", "Wisdom")}
    ${orb("binah",   520, 225, "Binah", "Understanding")}
    ${orb("chesed",  120, 355, "Chesed", "Mercy")}
    ${orb("gevurah", 640, 355, "Gevurah", "Strength")}
    ${orb("tiferet", 380, 455, "Tiferet", "Beauty")}
    ${orb("netzach", 240, 585, "Netzach", "Endurance")}
    ${orb("hod",     520, 585, "Hod", "Splendor")}
    ${orb("yesod",   380, 835, "Yesod", "Foundation")}
    ${orb("malkhut", 380, 920, "Malkhut", "Kingdom")}
  </svg>
  `;

  // Click handlers
  container.querySelectorAll(".orb").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-id");
      const href = nodeLinks[id] || "trees.html";
      window.location.href = href;
    });
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        el.click();
      }
    });
  });

  function orb(id, x, y, label, sub) {
    return `
      <g class="orb" data-id="${id}" tabindex="0" role="link" aria-label="${label}">
        <circle class="ring" cx="${x}" cy="${y}" r="46" opacity=".55"/>
        <circle class="ring" cx="${x}" cy="${y}" r="34" opacity=".32"/>
        <circle class="main" cx="${x}" cy="${y}" r="28" filter="url(#glow)"/>
        <text class="label" x="${x}" y="${y + 72}" text-anchor="middle">${label}</text>
        <text class="sublabel" x="${x}" y="${y + 92}" text-anchor="middle">${sub}</text>
      </g>
    `;
  }
})();
