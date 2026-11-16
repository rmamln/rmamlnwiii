const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const escapeHTML = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const scrollToSelector = (selector) => {
  const el = document.querySelector(selector);
  if (el) el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
};

/* =========================================================
   MOBILE NAV
   ========================================================= */
const menuBtn = document.querySelector(".menu-btn");
const navigation = document.querySelector(".navigation");
const navLinks = document.querySelectorAll(".navigation a");

function setNav(open) {
  menuBtn.classList.toggle("active", open);
  navigation.classList.toggle("active", open);
  menuBtn.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("nav-open", open);
}

menuBtn.addEventListener("click", () => setNav(!navigation.classList.contains("active")));
menuBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    setNav(!navigation.classList.contains("active"));
  }
});

navLinks.forEach((item) => item.addEventListener("click", () => setNav(false)));

window.addEventListener("resize", () => {
  if (window.innerWidth > 1040) setNav(false);
});

/* =========================================================
   STICKY HEADER + SCROLL PROGRESS + SCROLLSPY
   ========================================================= */
const header = document.querySelector("header");
const progressBar = document.getElementById("scrollProgress");
const sections = document.querySelectorAll("section[id]");

let scrollTicking = false;
function onScroll() {
  header.classList.toggle("sticky", window.scrollY > 10);
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
  progressBar.style.width = pct + "%";
  scrollTicking = false;
}
window.addEventListener(
  "scroll",
  () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true }
);
onScroll();

const spyObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute("id");
        navLinks.forEach((link) => link.classList.toggle("active", link.dataset.section === id));
      }
    });
  },
  { rootMargin: "-45% 0px -45% 0px" }
);
sections.forEach((s) => spyObserver.observe(s));

/* =========================================================
   SCROLL REVEAL
   ========================================================= */
const revealEls = document.querySelectorAll("[data-reveal]");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add("is-visible");
        revealObserver.unobserve(el);
        // setelah animasi masuk selesai, hapus delay biar hover tetap responsif
        setTimeout(() => el.classList.add("is-done"), 1600);
      }
    });
  },
  { threshold: 0.12 }
);
revealEls.forEach((el) => revealObserver.observe(el));

/* =========================================================
   CARD SPOTLIGHT
   ========================================================= */
const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
const canHover = window.matchMedia("(pointer: fine)").matches && !isTouchDevice;

if (canHover) {
  document.querySelectorAll(".spot").forEach((el) => {
    el.addEventListener(
      "mousemove",
      (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty("--mx", e.clientX - r.left + "px");
        el.style.setProperty("--my", e.clientY - r.top + "px");
      },
      { passive: true }
    );
  });
}

/* =========================================================
   STARFIELD BACKGROUND (bintang berkedip + parallax + bintang jatuh)
   ========================================================= */
(function initStarfield() {
  const canvas = document.getElementById("netCanvas");
  const hero = document.querySelector(".main");
  if (!canvas || !hero) return;
  const ctx = canvas.getContext("2d");

  const COLORS = ["230,238,255", "150,190,255", "110,220,245"];
  let w = 0, h = 0, dpr = 1, stars = [];
  let raf = null, heroVisible = true, lastT = 0;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  let shooter = null;
  let nextShot = 2500;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = hero.offsetWidth;
    h = hero.offsetHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(150, Math.floor((w * h) / 9000));
    stars = Array.from({ length: count }, () => {
      const z = 0.25 + Math.random() * 0.75; // kedalaman: kecil = jauh
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        z,
        r: 0.35 + z * 1.15,
        ph: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 1.6,
        vx: (Math.random() - 0.5) * 0.012 * z,
        vy: -0.006 - Math.random() * 0.02 * z,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      };
    });
    draw(performance.now(), 0);
  }

  function draw(t, dt) {
    ctx.clearRect(0, 0, w, h);

    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    for (const s of stars) {
      if (!reducedMotion) {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x < -5) s.x = w + 5;
        if (s.x > w + 5) s.x = -5;
        if (s.y < -5) s.y = h + 5;
      }
      const px = s.x + mouse.x * 26 * s.z;
      const py = s.y + mouse.y * 18 * s.z;
      const tw = reducedMotion ? 0.8 : 0.5 + 0.5 * Math.sin(t * 0.001 * s.sp + s.ph);
      const a = (0.25 + 0.75 * tw) * (0.35 + 0.65 * s.z);

      ctx.fillStyle = `rgba(${s.c},${a})`;
      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();

      // bintang dekat dikasih halo tipis
      if (s.z > 0.82) {
        ctx.fillStyle = `rgba(${s.c},${a * 0.16})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // bintang jatuh
    if (!reducedMotion) {
      if (!shooter && t > nextShot) {
        const fromRight = Math.random() > 0.5;
        const speed = 0.9 + Math.random() * 0.5;
        const ang = (22 + Math.random() * 16) * (Math.PI / 180);
        shooter = {
          x: fromRight ? w * (0.55 + Math.random() * 0.45) : w * Math.random() * 0.5,
          y: h * Math.random() * 0.35,
          vx: Math.cos(ang) * speed * (fromRight ? -1 : 1),
          vy: Math.sin(ang) * speed,
          life: 0,
        };
      }
      if (shooter) {
        shooter.x += shooter.vx * dt;
        shooter.y += shooter.vy * dt;
        shooter.life += dt;
        const k = Math.max(0, 1 - shooter.life / 900);
        const len = 130;
        const m = Math.hypot(shooter.vx, shooter.vy);
        const tx = shooter.x - (shooter.vx / m) * len;
        const ty = shooter.y - (shooter.vy / m) * len;
        const g = ctx.createLinearGradient(shooter.x, shooter.y, tx, ty);
        g.addColorStop(0, `rgba(235,244,255,${0.9 * k})`);
        g.addColorStop(1, "rgba(120,170,255,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(shooter.x, shooter.y);
        ctx.lineTo(tx, ty);
        ctx.stroke();
        if (k <= 0 || shooter.x < -200 || shooter.x > w + 200 || shooter.y > h + 200) {
          shooter = null;
          nextShot = t + 3500 + Math.random() * 5000;
        }
      }
    }
  }

  function tick(now) {
    const dt = Math.min(now - (lastT || now), 50);
    lastT = now;
    draw(now, dt);
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (reducedMotion || raf || !heroVisible || document.hidden) return;
    lastT = 0;
    raf = requestAnimationFrame(tick);
  }
  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  let lastW = 0;
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      // abaikan resize kecil di mobile (address bar naik-turun)
      if (hero.offsetWidth !== lastW || Math.abs(hero.offsetHeight - h) > 120) {
        lastW = hero.offsetWidth;
        resize();
      }
    }, 150);
  });

  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  hero.addEventListener("pointerleave", () => {
    mouse.tx = mouse.ty = 0;
  });

  // hemat baterai: berhenti kalau hero nggak kelihatan / tab di background
  new IntersectionObserver(
    ([entry]) => {
      heroVisible = entry.isIntersecting;
      heroVisible ? start() : stop();
    },
    { threshold: 0 }
  ).observe(hero);

  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  lastW = hero.offsetWidth;
  resize();
  start();
})();

/* =========================================================
   TOAST
   ========================================================= */
const toastEl = document.getElementById("toast");
let toastTimer;

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

/* =========================================================
   COMMAND PALETTE
   ========================================================= */
(function initCmdk() {
  const overlay = document.getElementById("cmdkOverlay");
  const input = document.getElementById("cmdkInput");
  const resultsEl = document.getElementById("cmdkResults");
  const openBtn = document.getElementById("cmdkBtn");

  const items = [
    { label: "Home", hint: "kembali ke atas", href: "#main", idx: "01" },
    { label: "About", hint: "tentang gw", href: "#about", idx: "02" },
    { label: "Experience", hint: "pengalaman kerja", href: "#Experience", idx: "03" },
    { label: "Skills", hint: "hard & soft skill", href: "#MySkills", idx: "04" },
    { label: "Projects", hint: "hasil kerjaan gw", href: "#Projects", idx: "05" },
    { label: "Social", hint: "instagram, github, linktree", href: "#Mysocialmedia", idx: "06" },
    { label: "Contact", hint: "kirim pesan / konsultasi", href: "#Consult", idx: "07" },
    { label: "RamWare", hint: "buka project ↗", url: "https://ramwareiso.netlify.app/", idx: "↗" },
    { label: "GitHub", hint: "@rmamln ↗", url: "https://github.com/rmamln", idx: "↗" },
    { label: "Instagram", hint: "@rmamln ↗", url: "https://instagram.com/rmamln", idx: "↗" },
    { label: "Linktree", hint: "semua link ↗", url: "https://linktr.ee/ramzoklama", idx: "↗" },
  ];

  let selectedIndex = 0;
  let filtered = items;
  let lastFocus = null;

  const isOpen = () => overlay.classList.contains("active");

  function render() {
    resultsEl.innerHTML = "";
    if (filtered.length === 0) {
      const li = document.createElement("li");
      li.className = "cmdk-empty";
      li.textContent = "nggak ketemu. coba 'about', 'skills', 'projects', 'github', atau 'contact'.";
      resultsEl.appendChild(li);
      return;
    }
    filtered.forEach((item, i) => {
      const li = document.createElement("li");
      li.className = i === selectedIndex ? "selected" : "";
      li.innerHTML = `<span><span class="r-idx">${item.idx}</span>${item.label}</span><span class="muted">${item.hint}</span>`;
      li.addEventListener("click", () => go(item));
      li.addEventListener("mousemove", () => {
        if (selectedIndex !== i) {
          selectedIndex = i;
          resultsEl.querySelectorAll("li").forEach((el, k) => el.classList.toggle("selected", k === i));
        }
      });
      resultsEl.appendChild(li);
    });
    resultsEl.querySelector(".selected")?.scrollIntoView({ block: "nearest" });
  }

  function go(item) {
    close();
    if (item.url) {
      window.open(item.url, "_blank", "noopener");
    } else {
      scrollToSelector(item.href);
    }
  }

  function open() {
    lastFocus = document.activeElement;
    overlay.classList.add("active");
    input.value = "";
    selectedIndex = 0;
    filtered = items;
    render();
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    overlay.classList.remove("active");
    input.blur();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus({ preventScroll: true });
  }

  openBtn.addEventListener("click", open);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  input.addEventListener("input", () => {
    const q = input.value.toLowerCase().trim();
    filtered = items.filter((item) => item.label.toLowerCase().includes(q) || item.hint.toLowerCase().includes(q));
    selectedIndex = 0;
    render();
  });

  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }

    // "/" buka palette (kalau lagi nggak ngetik)
    if (e.key === "/" && !isOpen() && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (!["input", "textarea", "select"].includes(tag)) {
        e.preventDefault();
        open();
        return;
      }
    }

    if (e.key === "Escape" && navigation.classList.contains("active")) setNav(false);

    if (!isOpen()) return;

    if (e.key === "Escape") close();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filtered.length - 1);
      render();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      render();
    }
    if (e.key === "Enter" && filtered[selectedIndex]) {
      e.preventDefault();
      go(filtered[selectedIndex]);
    }
  });
})();

/* =========================================================
   COPY TO CLIPBOARD
   ========================================================= */
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const value = btn.dataset.copy;
    try {
      await navigator.clipboard.writeText(value);
      showToast(`Copied: ${value}`);
    } catch {
      showToast("Gagal copy, coba manual ya");
    }
  });
});

/* =========================================================
   INTERACTIVE TERMINAL
   ========================================================= */
(function initTerminal() {
  const body = document.getElementById("terminalBody");
  const input = document.getElementById("terminalInput");
  const chips = document.getElementById("termChips");
  if (!body || !input) return;

  const hl = (t) => `<span class="term-hl">${t}</span>`;
  const link = (href, text) => `<a href="${href}" target="_blank" rel="noopener" class="term-hl">${text}</a>`;

  function print(html, cls = "") {
    const p = document.createElement("p");
    p.className = "term-line " + cls;
    p.innerHTML = html;
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  const commands = {
    help: () =>
      print(
        "Command tersedia: " +
          ["about", "experience", "skills", "projects", "social", "consult", "neofetch", "ls", "github", "whoami", "date", "clear"].map(hl).join(", ") +
          `<br>Tips: tekan ${hl("↑")} buat command sebelumnya, ${hl("Tab")} buat autocomplete.`
      ),
    about: () => {
      print("Membuka section about...");
      scrollToSelector("#about");
    },
    experience: () => {
      print("Membuka experience.log...");
      scrollToSelector("#Experience");
    },
    skills: () => {
      print("Membuka hard_skills.log & soft_skills.log...");
      scrollToSelector("#MySkills");
    },
    projects: () => {
      print("Membuka projects...");
      scrollToSelector("#Projects");
    },
    social: () => {
      print("Membuka social links...");
      scrollToSelector("#Mysocialmedia");
    },
    consult: () => {
      print("Membuka form kontak...");
      scrollToSelector("#Consult");
    },
    ls: () => print(["about/", "experience/", "skills/", "projects/", "social/", "consult/"].map(hl).join("  ")),
    github: () => print("→ " + link("https://github.com/rmamln", "github.com/rmamln")),
    instagram: () => print("→ " + link("https://instagram.com/rmamln", "instagram.com/rmamln")),
    neofetch: () =>
      print(
        [
          `${hl("rama")}@${hl("dev")}`,
          "-----------",
          `${hl("role")}     IT / Technical Support`,
          `${hl("company")}  PT Tandem (sampai Jul 2026)`,
          `${hl("web")}      html, css, js, php`,
          `${hl("network")}  mikrotik, linux, windows`,
          `${hl("status")}   <span class="ok">online</span>`,
        ].join("\n"),
        "term-pre"
      ),
    whoami: () => print("rama maulana — IT support, web developer &amp; network enthusiast (TKJ)"),
    date: () => print(new Date().toLocaleString("id-ID")),
    sudo: () => print("Permission denied: nice try 😏", "term-err"),
    clear: () => {
      body.innerHTML = "";
    },
  };
  // alias
  commands.work = commands.experience;
  commands.contact = commands.consult;

  const has = (name) => Object.prototype.hasOwnProperty.call(commands, name);

  const history = [];
  let historyIdx = 0;

  function run(raw) {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    const echo = document.createElement("p");
    echo.className = "term-line echo";
    echo.textContent = raw.trim();
    body.appendChild(echo);

    if (has(cmd)) {
      commands[cmd]();
    } else if (cmd.startsWith("sudo ")) {
      commands.sudo();
    } else {
      print(`command not found: ${hl(escapeHTML(raw.trim()))} — ketik ${hl("help")}`, "term-err");
    }
    body.scrollTop = body.scrollHeight;
  }

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const raw = input.value;
      if (!raw.trim()) return;
      history.push(raw.trim());
      historyIdx = history.length;
      run(raw);
      input.value = "";
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (historyIdx > 0) input.value = history[--historyIdx];
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx < history.length - 1) {
        input.value = history[++historyIdx];
      } else {
        historyIdx = history.length;
        input.value = "";
      }
    } else if (e.key === "Tab") {
      const v = input.value.trim().toLowerCase();
      if (!v) return;
      e.preventDefault();
      const match = Object.keys(commands).find((c) => c.startsWith(v));
      if (match) input.value = match;
    }
  });

  chips?.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-cmd]");
    if (btn) run(btn.dataset.cmd);
  });
})();

/* =========================================================
   CONTACT FORM (Netlify Forms, AJAX submit)
   ========================================================= */
(function initConsultForm() {
  const form = document.getElementById("consultForm");
  const status = document.getElementById("formStatus");
  if (!form || !status) return;

  function encode(data) {
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      params.append(key, value);
    }
    return params.toString();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const submitBtn = form.querySelector(".btn-send");
    submitBtn.disabled = true;
    submitBtn.textContent = "mengirim...";
    status.textContent = "";
    status.className = "form-status";

    const formData = new FormData(form);
    formData.set("form-name", form.getAttribute("name"));

    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode(formData),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Server responded with " + res.status);
        }
        status.textContent = "Terkirim! Gw bakal balas ke email lo secepatnya.";
        status.classList.add("success");
        form.reset();
        showToast("Pesan terkirim ✅");
      })
      .catch((err) => {
        console.error("Contact form submit failed:", err);
        status.textContent = "Gagal kirim. Coba lagi atau DM langsung via Instagram/Linktree.";
        status.classList.add("error");
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "kirim_pesan()";
      });
  });
})();

/* =========================================================
   LIVE STATS (GitHub + jumlah project)
   ========================================================= */
(function loadStats() {
  const ghEl = document.getElementById("ghStats");
  const reposEl = document.getElementById("statRepos");
  const followersEl = document.getElementById("statFollowers");
  const projectsEl = document.getElementById("statProjects");

  function countUp(el, to) {
    if (!el) return;
    if (reducedMotion || to === 0) {
      el.textContent = to;
      return;
    }
    const start = performance.now();
    const dur = 800;
    (function frame(now) {
      const t = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  // jumlah project live dihitung langsung dari halaman
  countUp(projectsEl, document.querySelectorAll(".featured, .project-card:not(.is-soon)").length);

  function apply(data) {
    const repos = data.public_repos ?? 0;
    const followers = data.followers ?? 0;
    countUp(reposEl, repos);
    countUp(followersEl, followers);
    if (ghEl) ghEl.textContent = `${repos} repos · ${followers} followers`;
  }

  const KEY = "gh_stats_rmamln";
  try {
    const cached = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (cached && Date.now() - cached.t < 10 * 60 * 1000) {
      apply(cached.d);
      return;
    }
  } catch {
    /* sessionStorage bisa diblokir — abaikan */
  }

  fetch("https://api.github.com/users/rmamln")
    .then((res) => {
      if (!res.ok) throw new Error("not found");
      return res.json();
    })
    .then((data) => {
      apply(data);
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: { public_repos: data.public_repos, followers: data.followers } }));
      } catch {
        /* abaikan */
      }
    })
    .catch(() => {
      ghEl?.remove();
    });
})();

/* =========================================================
   FOOTER PING (latensi asli ke server situs ini)
   ========================================================= */
(function setPing() {
  const el = document.getElementById("pingMs");
  if (!el) return;

  async function measure() {
    if (document.hidden) return;
    try {
      const t0 = performance.now();
      const res = await fetch(location.pathname || "/", { method: "HEAD", cache: "no-store" });
      if (!res.ok) throw new Error("bad status");
      el.textContent = Math.max(1, Math.round(performance.now() - t0));
    } catch {
      el.textContent = "—";
    }
  }

  measure();
  setInterval(measure, 20000);
})();

/* =========================================================
   ID CARD GANTUNG — tali verlet + kartu yang bisa ditarik
   ========================================================= */
(function initLanyard() {
  const box = document.getElementById("lanyard");
  const badge = document.getElementById("badge");
  if (!box || !badge) return;
  const canvas = box.querySelector("canvas");
  const ctx = canvas.getContext("2d");

  const N = 14;            // jumlah titik di tali (makin banyak makin lentur)
  // simulasi jalan di 120 langkah/detik biar halus di layar 60Hz maupun 120Hz+
  const GRAVITY = 0.125;
  const DAMPING = 0.981;
  const ITERATIONS = 14;
  const STEP_MS = 1000 / 120;
  const LABELS = ["RAMA MAULANA", "IT SUPPORT", "WEB DEV"];

  let W = 0, H = 0, dpr = 1, pad = 0, cw = 0, ch = 0;
  let ropeLen = 300, segLen = 30, cardW = 250, cardH = 380;
  let anchor = { x: 0, y: -12 };
  let pts = [];
  let drag = null;
  let angle = 0, angVel = 0, tgtSm = 0;
  let raf = null, last = 0, acc = 0, visible = true;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isStacked = () => window.matchMedia("(max-width: 1040px)").matches;

  function layout() {
    // simpan sudut tali sekarang supaya resize/relayout nggak bikin kartu loncat
    const prevTheta = pts.length ? Math.atan2(pts[N - 1].x - pts[0].x, pts[N - 1].y - pts[0].y) : null;
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    W = box.clientWidth;
    H = box.clientHeight;
    cardW = badge.offsetWidth;
    cardH = badge.offsetHeight;
    ropeLen = clamp(Math.min(H * 0.38, H - cardH - 30), 90, 460);
    segLen = ropeLen / (N - 1);
    anchor = { x: W / 2, y: -14 };

    // canvas cuma sebesar area tali (bukan seluruh hero) tapi lebih lebar biar tali nggak kepotong saat ditarik jauh
    pad = Math.ceil(ropeLen) + 40;
    cw = W + pad * 2;
    ch = Math.ceil(ropeLen) + 90;
    canvas.style.left = -pad + "px";
    canvas.style.top = "0px";
    canvas.style.right = "auto";
    canvas.style.bottom = "auto";
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, pad * dpr, 0);

    // kartu dilepas dari posisi miring seperti bandul, jadi langsung ayun halus pas web dibuka
    const theta = reducedMotion
      ? 0
      : prevTheta !== null
      ? prevTheta
      : Math.asin(Math.min(0.9, (isStacked() ? 70 : 115) / ropeLen));
    pts = Array.from({ length: N }, (_, i) => {
      const d = i * segLen;
      const x = anchor.x + Math.sin(theta) * d;
      const y = anchor.y + Math.cos(theta) * d;
      return { x, y, ox: x, oy: y };
    });
    angle = -theta;
    tgtSm = -theta;
    angVel = 0;

    if (reducedMotion) {
      for (let k = 0; k < 240; k++) step();
      render();
    }
    wake();
  }

  function step() {
    let energy = 0;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      const vx = (p.x - p.ox) * DAMPING;
      const vy = (p.y - p.oy) * DAMPING;
      p.ox = p.x;
      p.oy = p.y;
      p.x += vx;
      p.y += vy + GRAVITY * (i === N - 1 ? 2.6 : 1); // kartu lebih berat dari tali
      energy += Math.abs(vx) + Math.abs(vy);
    }

    // klip mengikuti kursor dengan jarak (offset) tetap sejak kartu dipegang
    if (drag) {
      let tx = drag.px - drag.ox;
      let ty = drag.py - drag.oy;
      // klip nggak boleh naik terlalu dekat ke titik gantung (bikin tali melipat) dan nggak boleh melebihi panjang tali
      let ddx = tx - anchor.x;
      let ddy = Math.max(ty - anchor.y, ropeLen * 0.3);
      const dd = Math.hypot(ddx, ddy);
      if (dd > ropeLen) {
        // proyeksikan ke lingkaran sepanjang tali (arah tarikan tetap dipertahankan)
        ddx *= ropeLen / dd;
        ddy *= ropeLen / dd;
      }
      tx = anchor.x + ddx;
      ty = anchor.y + ddy;
      drag.tx = tx;
      drag.ty = ty;
      // klip menyusul kursor dengan sedikit tertinggal (kartu terasa punya bobot, tali melengkung mengikuti)
      drag.sx += (tx - drag.sx) * 0.2;
      drag.sy += (ty - drag.sy) * 0.2;
    }

    for (let k = 0; k < ITERATIONS + 4; k++) {
      pts[0].x = anchor.x;
      pts[0].y = anchor.y;
      for (let i = 0; i < N - 1; i++) {
        const a = pts[i], b = pts[i + 1];
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx, dy) || 0.0001;
        if (d <= segLen) continue; // tali boleh kendor, cuma melawan tarikan
        const diff = (d - segLen) / d;
        if (i === 0) {
          b.x -= dx * diff;
          b.y -= dy * diff;
        } else {
          a.x += dx * diff * 0.5;
          a.y += dy * diff * 0.5;
          b.x -= dx * diff * 0.5;
          b.y -= dy * diff * 0.5;
        }
      }
      if (drag) {
        pts[N - 1].x = drag.sx;
        pts[N - 1].y = drag.sy;
      }
    }

    // batas gerak: di mobile kartu nggak boleh keluar layar, di desktop boleh agak melebar
    const stacked = isStacked();
    const minX = stacked ? cardW / 2 : -W * 0.8;
    const maxX = stacked ? W - cardW / 2 : W * 0.95;
    for (let i = 1; i < N; i++) {
      const p = pts[i];
      p.x = clamp(p.x, minX, maxX);
      p.y = clamp(p.y, anchor.y, H - (i === N - 1 ? cardH - 6 : 0));
    }

    // kartu ikut arah tali di dekat klip (dirata-rata 2 segmen biar nggak jitter),
    // dibatasi supaya nggak pernah kebalik, dengan pegas supaya ada goyangan
    const tp = pts[N - 1], pv = pts[N - 3];
    const ddy = tp.y - pv.y;
    let raw;
    if (drag) {
      // dipegang: tali tegang, arahnya = garis dari titik gantung ke klip (nggak jitter seperti ujung tali)
      raw = clamp(-Math.atan2(tp.x - anchor.x, Math.max(tp.y - anchor.y, 1)), -1.2, 1.2);
    } else {
      raw = ddy > 2 ? clamp(-Math.atan2(tp.x - pv.x, ddy), -1.2, 1.2) : 0;
    }
    // makin kendor talinya, makin dibiarkan menggantung lurus (arah tali yang kendor itu acak)
    const taut = drag ? 1 : clamp((Math.hypot(tp.x - anchor.x, tp.y - anchor.y) / ropeLen - 0.35) / 0.5, 0, 1);
    tgtSm += (raw * taut - tgtSm) * (drag ? 0.2 : 0.12);
    // saat dipegang: pegas lebih kuat + redaman lebih besar = kartu cepat tenang, nggak goyang
    angVel += (tgtSm - angle) * (drag ? 0.07 : 0.03);
    angVel *= drag ? 0.78 : 0.86;
    angle += angVel;
    if (!(angle > -1.3)) { angle = -1.3; angVel = 0; }
    if (!(angle < 1.3)) { angle = 1.3; angVel = 0; }
    return energy;
  }

  // Tali digambar sebagai satu kurva Bezier mulus: dari jangkar ke klip, masuk searah sumbu kartu.
  // Lengkungan tengahnya ngikutin fisika tali (tapi dibatasi), jadi nggak pernah melipat/muter
  // walau tali lagi kendor.
  function strapCurve() {
    const a = pts[0], tip = pts[N - 1], mid = pts[N >> 1];
    const dx = tip.x - a.x, dy = tip.y - a.y;
    const d = Math.max(Math.hypot(dx, dy), 1);
    // lengkung (bow) tali relatif ke garis lurus jangkar -> klip
    const nx = -dy / d, ny = dx / d;
    let bow = (mid.x - (a.x + tip.x) / 2) * nx + (mid.y - (a.y + tip.y) / 2) * ny;
    const lim = d * 0.22;
    bow = Math.max(-lim, Math.min(lim, bow)) / 0.75;
    const k = Math.min(d * 0.38, 150);
    const upX = Math.sin(angle), upY = -Math.cos(angle);
    // dari jangkar: turun mengikuti arah tali
    const ex = dx / d, ey = dy / d;
    return {
      p0: { x: a.x, y: a.y },
      p1: { x: a.x + ex * k + nx * bow, y: a.y + ey * k + ny * bow },
      p2: { x: tip.x + upX * k + nx * bow, y: tip.y + upY * k + ny * bow },
      p3: { x: tip.x, y: tip.y },
    };
  }

  function strapPath(c) {
    ctx.beginPath();
    ctx.moveTo(c.p0.x, c.p0.y);
    ctx.bezierCurveTo(c.p1.x, c.p1.y, c.p2.x, c.p2.y, c.p3.x, c.p3.y);
  }

  function sampleCurve(c) {
    const out = [];
    const M = 48;
    for (let i = 0; i <= M; i++) {
      const t = i / M, u = 1 - t;
      const w0 = u * u * u, w1 = 3 * u * u * t, w2 = 3 * u * t * t, w3 = t * t * t;
      out.push({
        x: w0 * c.p0.x + w1 * c.p1.x + w2 * c.p2.x + w3 * c.p3.x,
        y: w0 * c.p0.y + w1 * c.p1.y + w2 * c.p2.y + w3 * c.p3.y,
      });
    }
    return out;
  }

  function render() {
    ctx.clearRect(-pad, 0, cw, ch);

    const cp = strapCurve();

    // tali
    ctx.lineJoin = "round";
    ctx.lineCap = "butt";
    strapPath(cp);
    ctx.strokeStyle = "rgba(150,180,255,0.28)";
    ctx.lineWidth = 28;
    ctx.stroke();
    strapPath(cp);
    ctx.strokeStyle = "#0a1226";
    ctx.lineWidth = 26;
    ctx.stroke();
    strapPath(cp);
    ctx.strokeStyle = "rgba(255,59,48,0.55)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 7]);
    ctx.stroke();
    ctx.setLineDash([]);

    // teks di sepanjang tali (mengikuti kurva yang sama)
    const poly = sampleCurve(cp);
    const seg = [];
    let total = 0;
    for (let i = 0; i < poly.length - 1; i++) {
      const dx = poly[i + 1].x - poly[i].x, dy = poly[i + 1].y - poly[i].y;
      const len = Math.hypot(dx, dy);
      seg.push({ i, len, start: total, ang: Math.atan2(dy, dx) });
      total += len;
    }
    ctx.font = '700 9px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "2px";
    let n = 0;
    for (let s = 70; s < total - 40; s += 125, n++) {
      const sg = seg.find((g) => s >= g.start && s <= g.start + g.len) || seg[seg.length - 1];
      const t = (s - sg.start) / (sg.len || 1);
      const x = poly[sg.i].x + (poly[sg.i + 1].x - poly[sg.i].x) * t;
      const y = poly[sg.i].y + (poly[sg.i + 1].y - poly[sg.i].y) * t;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(sg.ang);
      ctx.fillStyle = n % 3 === 0 ? "rgba(230,235,247,0.9)" : n % 3 === 1 ? "rgba(255,176,32,0.8)" : "rgba(61,220,132,0.8)";
      ctx.fillText(LABELS[n % LABELS.length], 0, 0);
      ctx.restore();
    }
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";

    const tip = pts[N - 1];
    badge.style.transform = `translate3d(${tip.x - cardW / 2}px, ${tip.y - 6}px, 0) rotate(${angle}rad)`;
  }

  function frame(now) {
    raf = null;
    if (!visible || document.hidden) {
      last = 0;
      return;
    }
    if (!last) last = now;
    acc += Math.min(now - last, 100);
    last = now;

    let energy = 0, n = 0;
    while (acc >= STEP_MS && n < 10) {
      energy = step();
      acc -= STEP_MS;
      n++;
    }
    render();

    // tidur kalau sudah benar-benar diam (cukup lama), biar hemat baterai.
    // frame pertama belum ada step (dt = 0) dan titik balik ayunan energinya sesaat ~0, jadi nggak boleh langsung tidur.
    if (n > 0) {
      if (energy > 0.03 || Math.abs(angVel) > 0.0002) quiet = 0;
      else quiet++;
    }
    if (drag || quiet < 45) {
      raf = requestAnimationFrame(frame);
    } else {
      last = 0;
      quiet = 0;
    }
  }

  let started = false;
  let quiet = 0;
  function wake() {
    quiet = 0;
    if (!started || reducedMotion || raf || !visible) return;
    raf = requestAnimationFrame(frame);
  }

  /* ---------- interaksi ---------- */
  function pointerToBox(e, r = box.getBoundingClientRect()) {
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  badge.addEventListener("pointerdown", (e) => {
    if (reducedMotion) return;
    e.preventDefault();
    badge.setPointerCapture(e.pointerId);
    const p = pointerToBox(e);
    const tip = pts[N - 1];
    drag = {
      ox: p.x - tip.x, // jarak klip -> titik yang dipegang
      oy: p.y - tip.y,
      px: p.x,
      py: p.y,
      tx: tip.x,
      ty: tip.y,
      sx: tip.x,
      sy: tip.y,
      rect: box.getBoundingClientRect(),
    };
    // begitu dipegang, kartu langsung tenang: buang momentum goyangan
    angVel = 0;
    tgtSm = angle;
    for (const q of pts) {
      q.ox = q.x - (q.x - q.ox) * 0.35;
      q.oy = q.y - (q.y - q.oy) * 0.35;
    }
    badge.classList.add("is-grabbed");
    box.classList.add("is-touched");
    wake();
  });

  badge.addEventListener("pointermove", (e) => {
    if (drag) {
      const p = pointerToBox(e, drag.rect);
      drag.px = p.x;
      drag.py = p.y;
      wake();
    }
  });

  const release = () => {
    if (!drag) return;
    drag = null;
    badge.classList.remove("is-grabbed");
    wake();
  };
  badge.addEventListener("pointerup", release);
  badge.addEventListener("pointercancel", release);
  badge.addEventListener("lostpointercapture", release);

  // aksesibilitas: panah kiri/kanan buat goyangin kartu
  badge.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    pts[N - 1].x += e.key === "ArrowLeft" ? -45 : 45;
    box.classList.add("is-touched");
    wake();
  });

  /* ---------- lifecycle ---------- */
  let resizeTimer;
  let lastSize = "";
  new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const size = `${box.clientWidth}x${Math.round(box.clientHeight / 40)}`;
      if (size !== lastSize) {
        lastSize = size;
        layout();
      }
    }, 120);
  }).observe(box);

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) wake();
    },
    { threshold: 0 }
  ).observe(box);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      last = 0;
      wake();
    }
  });

  lastSize = `${box.clientWidth}x${Math.round(box.clientHeight / 40)}`;
  layout();

  const go = () => {
    if (started) return;
    started = true;
    badge.classList.add("is-ready");
    last = 0;
    wake();
  };
  if (document.readyState === "complete") go();
  else {
    window.addEventListener("load", go, { once: true });
    setTimeout(go, 1500); // cadangan kalau load lama
  }
})();

/* =========================================================
   BACK TO TOP
   ========================================================= */
document.getElementById("toTop")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});