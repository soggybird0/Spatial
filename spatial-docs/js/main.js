document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector(".menu-btn");
  const side = document.querySelector(".side");
  if (menu && side) {
    menu.addEventListener("click", () => side.classList.toggle("open"));
    side.querySelectorAll("a").forEach(a => {
      a.addEventListener("click", () => {
        if (window.innerWidth <= 860) side.classList.remove("open");
      });
    });
  }

  // Scroll-spy
  const links = [...document.querySelectorAll(".side a[href^='#']")];
  const sections = links.map(l => {
    const el = document.getElementById(l.getAttribute("href").slice(1));
    return el ? { el, link: l } : null;
  }).filter(Boolean);

  function spy() {
    const y = window.scrollY + 90;
    let cur = null;
    for (const s of sections) if (s.el.offsetTop <= y) cur = s;
    links.forEach(l => l.classList.remove("on"));
    if (cur) cur.link.classList.add("on");
  }
  if (sections.length) {
    window.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  // Copy on pre
  document.querySelectorAll("pre").forEach(pre => {
    const btn = document.createElement("button");
    btn.textContent = "Copy";
    Object.assign(btn.style, {
      position: "absolute", top: "8px", right: "8px",
      background: "#1a1728", border: "1px solid #2a2640", color: "#9a94b4",
      fontSize: "11px", padding: "3px 8px", borderRadius: "5px", cursor: "pointer",
      fontFamily: "inherit", opacity: "0", transition: "opacity .15s",
    });
    pre.style.position = "relative";
    pre.appendChild(btn);
    pre.addEventListener("mouseenter", () => btn.style.opacity = "1");
    pre.addEventListener("mouseleave", () => btn.style.opacity = "0");
    btn.addEventListener("click", () => {
      const code = pre.querySelector("code")?.innerText || pre.innerText;
      navigator.clipboard.writeText(code.replace(/\n?Copy$/, "").trim()).then(() => {
        btn.textContent = "Copied!";
        setTimeout(() => btn.textContent = "Copy", 1400);
      });
    });
  });

  // Tabs
  document.querySelectorAll(".tabs").forEach(root => {
    const btns = root.querySelectorAll(".tabbar button");
    const panels = root.querySelectorAll(".tab");
    btns.forEach((b, i) => b.addEventListener("click", () => {
      btns.forEach(x => x.classList.remove("on"));
      panels.forEach(x => x.classList.remove("on"));
      b.classList.add("on");
      panels[i]?.classList.add("on");
    }));
  });
});
