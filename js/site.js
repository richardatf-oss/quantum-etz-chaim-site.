(() => {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // Highlight active nav link if you forget to add "active" in HTML
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-link").forEach(a => {
    const href = (a.getAttribute("href") || "").toLowerCase();
    if (href === path) a.classList.add("active");
  });
})();
