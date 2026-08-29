document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const sidebar = document.querySelector(".sidebar");
  if (toggle && sidebar) {
    toggle.addEventListener("click", () => sidebar.classList.toggle("open"));
    sidebar.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (window.innerWidth <= 900) sidebar.classList.remove("open");
      });
    });
  }

  // Active sidebar link from scroll
  const links = document.querySelectorAll(".sidebar a[href^='#']");
  const sections = [];
  links.forEach(link => {
    const id = link.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) sections.push({ id, el, link });
  });

  function setActive() {
    let current = null;
    const scrollY = window.scrollY + 80;
    for (const s of sections) {
      if (s.el.offsetTop <= scrollY) current = s;
    }
    links.forEach(l => l.classList.remove("active"));
    if (current) current.link.classList.add("active");
  }

  if (sections.length) {
    window.addEventListener("scroll", setActive, { passive: true });
    setActive();
  }

  // Copy buttons on pre
  document.querySelectorAll("pre").forEach(pre => {
    const btn = document.createElement("button");
    btn.textContent = "Copy";
    btn.className = "copy-btn";
    btn.style.cssText = `
      position: absolute; top: 8px; right: 8px;
      background: #221f30; border: 1px solid #2e2a42; color: #9b96b0;
      font-size: 11px; padding: 3px 8px; border-radius: 4px; cursor: pointer;
      font-family: inherit; opacity: 0; transition: opacity 0.15s;
    `;
    pre.style.position = "relative";
    pre.appendChild(btn);
    pre.addEventListener("mouseenter", () => btn.style.opacity = "1");
    pre.addEventListener("mouseleave", () => btn.style.opacity = "0");
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code")?.textContent || pre.textContent;
      navigator.clipboard.writeText(code.replace(/\n?Copy$/, "").trim()).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 1500);
      });
    });
  });

  // Simple tabs
  document.querySelectorAll(".tabs").forEach(tabs => {
    const labels = tabs.querySelectorAll(".tab-labels button");
    const panels = tabs.querySelectorAll(".tab-panel");
    labels.forEach((btn, i) => {
      btn.addEventListener("click", () => {
        labels.forEach(b => b.classList.remove("active"));
        panels.forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        if (panels[i]) panels[i].classList.add("active");
      });
    });
  });
});
