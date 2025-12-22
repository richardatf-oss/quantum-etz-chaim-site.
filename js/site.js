const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

function setActiveNav() {
  const path = location.pathname.split("/").pop() || "index.html";
  $$(".nav a").forEach(a => {
    const href = a.getAttribute("href");
    a.classList.toggle("active", href === path);
  });
}

async function loadBooks() {
  const el = $("#bookGrid");
  if (!el) return;

  const res = await fetch("/data/books.json", { cache: "no-store" });
  const books = await res.json();

  // build tag filters
  const allTags = Array.from(new Set(books.flatMap(b => b.tags || []))).sort();
  const filterBar = $("#filters");
  if (filterBar) {
    const makePill = (label, value) => {
      const btn = document.createElement("button");
      btn.className = "pill" + (value === "all" ? " active" : "");
      btn.type = "button";
      btn.dataset.filter = value;
      btn.textContent = label;
      return btn;
    };
    filterBar.innerHTML = "";
    filterBar.appendChild(makePill("All", "all"));
    allTags.forEach(t => filterBar.appendChild(makePill(t, t)));

    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest(".pill");
      if (!btn) return;
      $$(".pill", filterBar).forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      renderBooks(books, btn.dataset.filter);
    });
  }

  renderBooks(books, "all");
}

function renderBooks(books, filter) {
  const el = $("#bookGrid");
  const filtered = filter === "all"
    ? books
    : books.filter(b => (b.tags || []).includes(filter));

  el.innerHTML = filtered.map(bookCard).join("");
}

function bookCard(b) {
  const tags = (b.tags || []).slice(0, 3).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  const coverAlt = `${b.title} cover`;

  return `
  <article class="book-card">
    <a class="book-cover" href="/book.html?id=${encodeURIComponent(b.id)}" aria-label="Open ${escapeHtml(b.title)}">
      <img class="book-cover-img" src="${b.cover}" alt="${escapeHtml(coverAlt)}" loading="lazy" decoding="async" />
    </a>
    <div class="book-meta">
      <div class="book-tags">${tags}</div>
      <h3 class="book-title">${escapeHtml(b.title)}</h3>
      ${b.subtitle ? `<p class="book-subtitle">${escapeHtml(b.subtitle)}</p>` : ``}
      <p class="book-blurb">${escapeHtml(b.blurb || "")}</p>
      <div class="book-actions">
        <a class="btn small primary" href="${b.amazon}" target="_blank" rel="noopener">Amazon</a>
        <a class="btn small" href="/book.html?id=${encodeURIComponent(b.id)}">Details</a>
        <span class="book-format muted">${escapeHtml(b.format || "")}</span>
      </div>
    </div>
  </article>`;
}

async function loadBookDetail() {
  const host = $("#bookDetail");
  if (!host) return;

  const id = new URLSearchParams(location.search).get("id");
  if (!id) {
    host.innerHTML = `<div class="card"><h2 class="card-title">Book not found</h2><p class="card-text">Missing id.</p></div>`;
    return;
  }

  const res = await fetch("/data/books.json", { cache: "no-store" });
  const books = await res.json();
  const b = books.find(x => x.id === id);

  if (!b) {
    host.innerHTML = `<div class="card"><h2 class="card-title">Book not found</h2><p class="card-text">Unknown id: ${escapeHtml(id)}</p></div>`;
    return;
  }

  document.title = `${b.title} — Quantum Etz Chaim`;

  host.innerHTML = `
    <div class="detail-grid">
      <div class="detail-cover">
        <img src="${b.cover}" alt="${escapeHtml(b.title)} cover" />
      </div>
      <div class="detail-meta">
        <div class="detail-tags">${(b.tags||[]).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>
        <h1 class="detail-title">${escapeHtml(b.title)}</h1>
        ${b.subtitle ? `<p class="detail-subtitle">${escapeHtml(b.subtitle)}</p>` : ``}
        <p class="detail-blurb">${escapeHtml(b.blurb || "")}</p>
        <div class="detail-actions">
          <a class="btn primary" href="${b.amazon}" target="_blank" rel="noopener">View on Amazon</a>
          <a class="btn" href="/books.html">Back to Books</a>
        </div>
        <p class="muted">Format: ${escapeHtml(b.format || "")}</p>
      </div>
    </div>
  `;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[m]));
}

document.addEventListener("DOMContentLoaded", () => {
  setActiveNav();
  loadBooks();
  loadBookDetail();
});
