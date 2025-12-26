/* js/site.js
   Robust book loader + renderer for:
   - /books.html (grid + tag filters)
   - /book.html?id=... (single book page)
   - optional "other titles" lists if containers exist
*/

(() => {
  "use strict";

  // ---------- helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const escapeHTML = (s) =>
    String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const getParam = (name) => new URLSearchParams(window.location.search).get(name);

  // Force fresh JSON every time (prevents "why isn't it showing?" after deploy)
  const BOOKS_URL = "/data/books.json?v=" + Date.now();

  async function fetchBooks() {
    const res = await fetch(BOOKS_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load books.json (${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("books.json must be an array");
    // Normalize fields so render logic never breaks
    return data.map((b) => ({
      id: b.id ?? "",
      title: b.title ?? "",
      author: b.author ?? "",
      cover: b.cover ?? "",
      amazon: b.amazon ?? "",
      tagline: b.tagline ?? "",
      description_en: b.description_en ?? "",
      tags: Array.isArray(b.tags) ? b.tags : [], // tags optional
      // allow future fields without breaking
      ...b
    }));
  }

  // ---------- Books page (grid) ----------
  function setupBooksPage(books) {
    const grid = $("#bookGrid");
    if (!grid) return; // not on books page

    const filterBar = $("#filterBar");
    const allTags = Array.from(
      new Set(
        books.flatMap((b) => (Array.isArray(b.tags) ? b.tags : []))
          .map((t) => String(t).trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b));

    // If the page has a filter bar, build pills; otherwise just render all.
    if (filterBar) {
      filterBar.innerHTML = "";

      const makePill = (label, value, active = false) => {
        const btn = document.createElement("button");
        btn.className = "pill" + (active ? " active" : "");
        btn.type = "button";
        btn.dataset.filter = value;
        btn.textContent = label;
        return btn;
      };

      filterBar.appendChild(makePill("All", "all", true));
      allTags.forEach((t) => filterBar.appendChild(makePill(t, t)));

      filterBar.addEventListener("click", (e) => {
        const btn = e.target.closest(".pill");
        if (!btn) return;
        $$(".pill", filterBar).forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        renderBooksGrid(books, btn.dataset.filter || "all");
      });

      // If there are no tags at all, hide the filter bar to avoid confusion
      if (allTags.length === 0) {
        filterBar.style.display = "none";
      }
    }

    // Default: render all books (never hide because tags missing)
    renderBooksGrid(books, "all");
  }

  function renderBooksGrid(books, filter) {
    const grid = $("#bookGrid");
    if (!grid) return;

    const f = filter || "all";
    const filtered =
      f === "all"
        ? books
        : books.filter((b) => (Array.isArray(b.tags) ? b.tags : []).includes(f));

    grid.innerHTML = filtered.map(bookCardHTML).join("");
  }

  function bookCardHTML(b) {
    const title = escapeHTML(b.title);
    const tagline = escapeHTML(b.tagline);
    const coverAlt = escapeHTML(`${b.title} cover`);
    const tags = (Array.isArray(b.tags) ? b.tags : [])
      .slice(0, 3)
      .map((t) => `<span class="tag">${escapeHTML(t)}</span>`)
      .join("");

    const amazonBtn = b.amazon
      ? `<a class="btn secondary" href="${escapeHTML(b.amazon)}" target="_blank" rel="noopener">Amazon</a>`
      : "";

    return `
      <article class="book-card">
        <a class="book-cover" href="/book.html?id=${encodeURIComponent(b.id)}" aria-label="Open ${title}">
          <img class="book-cover-img" src="${escapeHTML(b.cover)}" alt="${coverAlt}" loading="lazy" decoding="async" />
        </a>
        <div class="book-meta">
          <h3 class="book-title">${title}</h3>
          ${tagline ? `<p class="book-tagline">${tagline}</p>` : ""}
          ${tags ? `<div class="tags">${tags}</div>` : ""}
          <div class="book-actions">
            <a class="btn" href="/book.html?id=${encodeURIComponent(b.id)}">Details</a>
            ${amazonBtn}
          </div>
        </div>
      </article>
    `;
  }

  // ---------- Single book page (/book.html?id=...) ----------
  function setupBookPage(books) {
    const id = getParam("id");
    const titleEl = $("#bookTitle");
    const coverEl = $("#bookCover");
    const taglineEl = $("#bookTagline");
    const descEl = $("#bookDescription");
    const amazonEl = $("#bookAmazon");
    const otherEl = $("#otherTitles");

    // If none of the book page elements exist, skip entirely
    const looksLikeBookPage =
      titleEl || coverEl || taglineEl || descEl || amazonEl || otherEl;

    if (!looksLikeBookPage) return;

    const book = books.find((b) => b.id === id) || null;

    if (!book) {
      if (titleEl) titleEl.textContent = "Book not found";
      if (descEl) descEl.textContent = "The requested book id was not found in /data/books.json.";
      if (amazonEl) amazonEl.style.display = "none";
      return;
    }

    if (titleEl) titleEl.textContent = book.title || "Untitled";
    if (coverEl && coverEl.tagName === "IMG") {
      coverEl.src = book.cover || "";
      coverEl.alt = `${book.title || "Book"} cover`;
    }
    if (taglineEl) taglineEl.textContent = book.tagline || "";
    if (descEl) descEl.textContent = book.description_en || "";

    if (amazonEl) {
      if (book.amazon) {
        amazonEl.href = book.amazon;
        amazonEl.style.display = "";
      } else {
        amazonEl.style.display = "none";
      }
    }

    // Populate "Other titles" if container exists
    if (otherEl) {
      const others = books.filter((b) => b.id !== book.id);
      otherEl.innerHTML = others.map(otherTitleHTML).join("");
    }
  }

  function otherTitleHTML(b) {
    const title = escapeHTML(b.title);
    const coverAlt = escapeHTML(`${b.title} cover`);
    const amazon = b.amazon
      ? `<a class="mini-link" href="${escapeHTML(b.amazon)}" target="_blank" rel="noopener">Amazon</a>`
      : "";

    return `
      <div class="other-title">
        <a href="/book.html?id=${encodeURIComponent(b.id)}" class="other-cover">
          <img src="${escapeHTML(b.cover)}" alt="${coverAlt}" loading="lazy" decoding="async" />
        </a>
        <div class="other-meta">
          <a class="other-name" href="/book.html?id=${encodeURIComponent(b.id)}">${title}</a>
          ${amazon}
        </div>
      </div>
    `;
  }

  // ---------- init ----------
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const books = await fetchBooks();
      setupBooksPage(books);
      setupBookPage(books);
    } catch (err) {
      console.error(err);
      const grid = $("#bookGrid");
      if (grid) {
        grid.innerHTML = `<p style="opacity:.85">Could not load book data. Check console for details.</p>`;
      }
      const descEl = $("#bookDescription");
      if (descEl) descEl.textContent = "Could not load book data. Check console for details.";
    }
  });
})();
