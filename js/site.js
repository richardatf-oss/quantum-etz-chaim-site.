(function () {
  const $ = (sel) => document.querySelector(sel);

  async function loadBooks() {
    const res = await fetch("./data/books.json", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load books.json");
    return await res.json();
  }

  function tagFromCategory(cat) {
    const c = (cat || "").toLowerCase();
    if (["kabbalah", "torah", "quantum", "prayer"].includes(c)) return c;
    return "all";
  }

  function makeTile(book) {
    const a = document.createElement("a");
    a.className = "tile";
    a.href = `./book.html?id=${encodeURIComponent(book.id)}`;

    a.innerHTML = `
      <div class="tile-top">
        <img class="cover" src="${book.cover}" alt="${escapeHtml(book.title)} cover" loading="lazy">
        <div>
          <h3>${escapeHtml(book.title)}</h3>
          <div class="muted">${escapeHtml(book.subtitle || "")}</div>
        </div>
      </div>
      <div class="tagrow">
        ${book.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
      </div>
    `;
    return a;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  async function initIndex() {
    const featured = $("#featured");
    if (!featured) return;

    const books = await loadBooks();
    const pick = books.slice(0, 3);

    featured.innerHTML = "";
    pick.forEach((b) => featured.appendChild(makeTile(b)));
  }

  async function initBooksPage() {
    const grid = $("#booksGrid");
    if (!grid) return;

    const search = $("#bookSearch");
    const filter = $("#bookFilter");

    const books = await loadBooks();

    function render() {
      const q = (search.value || "").trim().toLowerCase();
      const f = filter.value;

      const shown = books.filter((b) => {
        const hay = `${b.title} ${b.subtitle} ${b.description} ${(b.tags || []).join(" ")} ${(b.category || "")}`.toLowerCase();
        const matchQ = q ? hay.includes(q) : true;
        const matchF = f === "all" ? true : tagFromCategory(b.category) === f || (b.tags || []).some(t => t.toLowerCase() === f);
        return matchQ && matchF;
      });

      grid.innerHTML = "";
      shown.forEach((b) => grid.appendChild(makeTile(b)));

      if (shown.length === 0) {
        const empty = document.createElement("div");
        empty.className = "card";
        empty.innerHTML = `<h2>No matches</h2><p class="muted">Try a different search or filter.</p>`;
        grid.appendChild(empty);
      }
    }

    search.addEventListener("input", render);
    filter.addEventListener("change", render);
    render();
  }

  async function initBookDetail() {
    const slot = $("#bookDetail");
    if (!slot) return;

    const id = getQueryParam("id");
    const books = await loadBooks();
    const book = books.find((b) => b.id === id) || books[0];

    document.title = `${book.title} • Quantum Etz Chaim`;

    slot.innerHTML = `
      <img class="detail-cover" src="${book.cover}" alt="${escapeHtml(book.title)} cover">
      <div>
        <h1>${escapeHtml(book.title)}</h1>
        <div class="muted">${escapeHtml(book.subtitle || "")}</div>

        <div style="margin: 12px 0 10px;" class="tagrow">
          ${(book.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        </div>

        <p>${escapeHtml(book.description || "")}</p>

        <div class="actions">
          ${book.amazon ? `<a class="btn" href="${book.amazon}" target="_blank" rel="noopener">View on Amazon</a>` : ""}
          <a class="btn ghost" href="./books.html">Back to Books</a>
        </div>
      </div>
    `;

    const more = $("#moreBooks");
    if (more) {
      const others = books.filter(b => b.id !== book.id).slice(0, 3);
      more.innerHTML = "";
      others.forEach(b => more.appendChild(makeTile(b)));
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initIndex().catch(console.error);
    initBooksPage().catch(console.error);
    initBookDetail().catch(console.error);
  });
})();
