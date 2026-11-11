// WordLord Studio: a side panel to restyle and edit the portfolio, then export.
// Settings and text edits are kept in this browser (localStorage). Nothing leaves the machine.
(() => {
  const KEY = "wl-studio:" + location.pathname.split("/").pop();
  const root = document.documentElement;
  const FONTS = {
    title: ["Instrument Serif", "Fraunces", "Bricolage Grotesque", "Geist"],
    body: ["Geist", "Instrument Sans", "Hanken Grotesk"],
  };
  const defaults = {
    brand: getComputedStyle(root).getPropertyValue("--cobalt").trim() || "#1E3FD8",
    paper: "#f6f1e8", ink: "#16161a", title: "Instrument Serif", body: "Geist",
    h2: 40, bodySize: 12.5, phone: true, section: true, browser: true, grain: true, hidden: [], text: {}, img: {},
  };
  let s;
  try { s = { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { s = { ...defaults }; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

  const pages = [...document.querySelectorAll(".page")];
  pages.forEach((p, i) => (p.dataset.n = i));
  const edits = [...document.querySelectorAll("[contenteditable]")];
  edits.forEach((el, i) => (el.dataset.k = i));
  const imgs = [...document.querySelectorAll(".page img:not(.logo)")];
  imgs.forEach((im, i) => (im.dataset.k = i));

  function apply() {
    root.style.setProperty("--cobalt", s.brand);
    root.style.setProperty("--paper", s.paper);
    root.style.setProperty("--ink", s.ink);
    root.style.setProperty("--title-font", `'${s.title}', serif`);
    root.style.setProperty("--body-font", `'${s.body}', system-ui, sans-serif`);
    root.style.setProperty("--h2", s.h2 + "px");
    root.style.setProperty("--body-size", s.bodySize + "px");
    document.body.classList.toggle("no-phone", !s.phone);
    document.body.classList.toggle("no-section", !s.section);
    document.body.classList.toggle("no-browser", !s.browser);
    document.body.classList.toggle("no-grain", !s.grain);
    pages.forEach((p) => p.classList.toggle("is-hidden", s.hidden.includes(+p.dataset.n)));
  }
  edits.forEach((el) => {
    if (s.text[el.dataset.k] != null) el.innerHTML = s.text[el.dataset.k];
    el.addEventListener("input", () => { s.text[el.dataset.k] = el.innerHTML; save(); });
  });
  imgs.forEach((im) => { if (s.img[im.dataset.k]) im.src = s.img[im.dataset.k]; });

  // Click any screenshot to replace it with a file from disk (kept as a data URL in this browser).
  const picker = Object.assign(document.createElement("input"), { type: "file", accept: "image/*", hidden: true });
  document.body.append(picker);
  let target = null;
  imgs.forEach((im) => im.addEventListener("click", (e) => { if (!document.body.classList.contains("studio-open")) return; e.preventDefault(); target = im; picker.click(); }));
  picker.addEventListener("change", () => {
    const f = picker.files[0]; if (!f || !target) return;
    const r = new FileReader();
    r.onload = () => { target.src = r.result; s.img[target.dataset.k] = r.result; save(); picker.value = ""; };
    r.readAsDataURL(f);
  });

  const opt = (list, cur) => list.map((f) => `<option${f === cur ? " selected" : ""}>${f}</option>`).join("");
  const pageName = (p) => (p.querySelector("h2,h1")?.textContent || "Page").trim().slice(0, 28);
  const panel = document.createElement("aside");
  panel.className = "studio noprint";
  panel.innerHTML = `
  <button class="st-toggle" type="button" aria-expanded="false">Studio</button>
  <div class="st-body">
    <header><b>WordLord Studio</b><span>Changes stay in this browser</span></header>
    <section><h3>Colour</h3>
      <label>Brand <input type="color" data-s="brand" value="${s.brand}"></label>
      <label>Paper <input type="color" data-s="paper" value="${s.paper}"></label>
      <label>Ink <input type="color" data-s="ink" value="${s.ink}"></label></section>
    <section><h3>Type</h3>
      <label>Titles <select data-s="title">${opt(FONTS.title, s.title)}</select></label>
      <label>Text <select data-s="body">${opt(FONTS.body, s.body)}</select></label>
      <label>Title size <input type="range" min="26" max="60" data-s="h2" value="${s.h2}"><output>${s.h2}</output></label>
      <label>Text size <input type="range" min="10" max="16" step=".5" data-s="bodySize" value="${s.bodySize}"><output>${s.bodySize}</output></label></section>
    <section><h3>Layout</h3>
      <label class="chk"><input type="checkbox" data-s="phone" ${s.phone ? "checked" : ""}> Phone preview</label>
      <label class="chk"><input type="checkbox" data-s="section" ${s.section ? "checked" : ""}> Second screenshot</label>
      <label class="chk"><input type="checkbox" data-s="browser" ${s.browser ? "checked" : ""}> Browser bar</label>
      <label class="chk"><input type="checkbox" data-s="grain" ${s.grain ? "checked" : ""}> Grain texture</label></section>
    <section><h3>Pages <small>untick to leave out of the PDF</small></h3>
      <div class="st-pages">${pages.map((p) => `<label class="chk"><input type="checkbox" data-page="${p.dataset.n}" ${s.hidden.includes(+p.dataset.n) ? "" : "checked"}> ${String(+p.dataset.n + 1).padStart(2, "0")} ${pageName(p)}</label>`).join("")}</div></section>
    <p class="st-tip">Click a title or line to edit it. With this panel open, click a screenshot to replace it.</p>
    <footer><button type="button" class="st-reset">Reset</button><button type="button" class="st-export">Export PDF</button></footer>
  </div>`;
  document.body.append(panel);

  panel.querySelector(".st-toggle").addEventListener("click", (e) => {
    const open = document.body.classList.toggle("studio-open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });
  panel.querySelectorAll("[data-s]").forEach((el) => el.addEventListener("input", () => {
    const k = el.dataset.s;
    s[k] = el.type === "checkbox" ? el.checked : el.type === "range" ? +el.value : el.value;
    const out = el.parentElement.querySelector("output"); if (out) out.textContent = el.value;
    apply(); save();
  }));
  panel.querySelectorAll("[data-page]").forEach((el) => el.addEventListener("change", () => {
    const n = +el.dataset.page;
    s.hidden = el.checked ? s.hidden.filter((x) => x !== n) : [...s.hidden, n];
    apply(); save();
  }));
  panel.querySelector(".st-export").addEventListener("click", () => print());
  panel.querySelector(".st-reset").addEventListener("click", () => {
    if (!confirm("Reset all styling, text edits and replaced images in this browser?")) return;
    try { localStorage.removeItem(KEY); } catch {}
    location.reload();
  });
  apply();
})();
