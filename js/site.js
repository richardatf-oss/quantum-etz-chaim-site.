/* js/site.js — resilient renderer (works even if ids differ) */
(function () {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);

  async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    return res.json();
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[m]));
  }

  function normalizeBook(b) {
    const id = String(b?.id ?? "").trim();
    return {
      id,
      title: String(b?.title ?? id ?? "Untitled"),
      author: String(b?.author ?? ""),
      cover: String(b?.cover ?? ""),
      amazon: String(b?.amazon ?? ""),
      tagline: String(b?.tagline ?? ""),
      description_en: String(b?.description_en ?? ""),
      tags: Array.isArray(b?.tags) ? b.tags.map(String) : [],
    };
  }

  function uniq(arr) {
    return Array.from(new Set(arr));
  }

  function getIdFromQuery() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || "";
  }

  function findBooksMount() {
    // Preferred IDs
    let grid = $("#bookGrid");
    let filter = $("#filterBar");

    // Fallbacks (in case the deployed page differs)
    if (!grid) grid = $("#booksGrid") || $("#grid") || $(".grid") || $('[data-books-grid]');
    if (!filter) filter = $("#filters") || $(".filters") || $('[data-books-filter]');

    return { grid, filter };
  }

  function bookCard(b) {
    const title = escapeHtml(b.title);
    const tagline = escapeHtml(b.tagline);
    const cover = escapeHtml(b.cover);
    const id = encodeURIComponent(b.id);

    const amazonBtn = b.amazon
      ? `<a class="btn secondary" href="${escapeHtml(b.amazon)}" target="_blank" rel="noopener">Amazon</a>`
      : "";

    const tagsHtml = (b.tags && b.tags.length)
      ? `<div class="tags">${b.tags.slice(0, 4).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>`
      : "";

    return `
      <article class="book-card">
        <a class="book-cover" href="/book.html?id=${id}" aria-label="Open ${title}">
          <img class="book-cover-img" src="${cover}" alt="${title} cover" loading="lazy" decoding="async" />
        </a>
        <div class="book-meta">
          <h3 class="book-title">${title}</h3>
          ${tagline ? `<p class="book-tagline">${tagline}</p>` : ""}
          ${tagsHtml}
          <div class="book-actions">
            <a class="btn" href="/book.html?id=${id}">Details</a>
            ${amazonBtn}
          </div>
        </div>
      </article>
    `;
  }

  function renderBooksGrid(gridEl, books, filter) {
    const filtered = (filter && filter !== "all")
      ? books.filter(b => (b.tags || []).includes(filter))
      : books;

    gridEl.innerHTML = filtered.map(bookCard).join("");
  }

  function renderFilterBar(filterEl, books, onPick) {
    const allTags = uniq(
      books.flatMap((b) => (b.tags && b.tags.length ? b.tags : []))
    ).sort((a, b) => a.localeCompare(b));

    if (allTags.length === 0) {
      filterEl.style.display = "none";
      return;
    }

    const makeBtn = (label, value, active) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill" + (active ? " active" : "");
      btn.dataset.filter = value;
      btn.textContent = label;
      return btn;
    };

    filterEl.innerHTML = "";
    filterEl.appendChild(makeBtn("All", "all", true));
    for (const t of allTags) filterEl.appendChild(makeBtn(t, t, false));

    filterEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button.pill");
      if (!btn) return;
      filterEl.querySelectorAll("button.pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      onPick(btn.dataset.filter || "all");
    });
  }

  function renderBookDetail(books) {
    const id = getIdFromQuery();
    const coverEl = $("#bookCover");
    const titleEl = $("#bookTitle");
    const taglineEl = $("#bookTagline");
    const descEl = $("#bookDescription");
    const amazonEl = $("#bookAmazon");
    const otherEl = $("#otherTitles");

    if (!titleEl || !coverEl) return;

    const found = books.find(b => b.id === id) || books[0];
    if (!found) {
      titleEl.textContent = "No books found.";
      return;
    }

    document.title = `${found.title} — Quantum Etz Chaim`;
    titleEl.textContent = found.title;
    if (taglineEl) taglineEl.textContent = found.tagline || "";
    if (descEl) descEl.textContent = found.description_en || "";

    if (found.cover) {
      coverEl.src = found.cover;
      coverEl.alt = `${found.title} cover`;
    }

    if (amazonEl) {
      if (found.amazon) {
        amazonEl.href = found.amazon;
        amazonEl.style.display = "inline-flex";
      } else {
        amazonEl.style.display = "none";
      }
    }

    if (otherEl) {
      const others = books.filter(b => b.id !== found.id).slice(0, 6);
      otherEl.innerHTML = others.map(b => `
        <div class="other-title">
          <a class="other-cover" href="/book.html?id=${encodeURIComponent(b.id)}" aria-label="Open ${escapeHtml(b.title)}">
            <img src="${escapeHtml(b.cover)}" alt="${escapeHtml(b.title)} cover" loading="lazy" decoding="async" />
          </a>
          <div class="other-meta">
            <a class="other-name" href="/book.html?id=${encodeURIComponent(b.id)}">${escapeHtml(b.title)}</a>
            ${b.amazon ? `<a class="mini-link" href="${escapeHtml(b.amazon)}" target="_blank" rel="noopener">Amazon</a>` : ""}
          </div>
        </div>
      `).join("");
    }
  }

  async function init() {
    console.log("[site.js] init", location.pathname);

    // Books mounts (if on books page)
    const { grid, filter } = findBooksMount();
    const isBooksPage = !!grid;
    const isBookPage = !!$("#bookTitle");

    console.log("[site.js] mounts", { isBooksPage, isBookPage, grid: !!grid, filter: !!filter });

    if (!isBooksPage && !isBookPage) return;

    let raw;
    try {
      raw = await fetchJSON("/data/books.json");
    } catch (err) {
      console.error("[site.js] JSON load failed", err);
      if (grid) grid.innerHTML = `<div style="padding:16px;color:rgba(11,18,32,.7)">Could not load /data/books.json</div>`;
      if ($("#bookTitle")) $("#bookTitle").textContent = "Could not load book data.";
      return;
    }

    const books = Array.isArray(raw) ? raw.map(normalizeBook).filter(b => b.id) : [];
    console.log("[site.js] books loaded:", books.length);

    if (isBooksPage) {
      if (filter) {
        renderFilterBar(filter, books, (picked) => renderBooksGrid(grid, books, picked));
      }
      renderBooksGrid(grid, books, "all");
    }

    if (isBookPage) {
      renderBookDetail(books);
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
