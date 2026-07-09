/* =====================================================================
   MAIN — GSAP interactions for the Tru Foe HUB (v2)
   preloader · word reveals · portrait reveal + parallax · scroll reveals ·
   counters · marquee · magnetic buttons · album tilt · custom cursor
   ===================================================================== */
(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");
  const hasGSAP = typeof window.gsap !== "undefined";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(pointer: coarse)").matches;

  if (hasGSAP && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  // Pre-hide hero elements (behind the loader) so the intro reveal
  // never flashes before playHero() runs. Words stay whole — no char
  // splitting — so gradient text-clip is never broken.
  if (hasGSAP && !reduce) {
    gsap.set(".hero__title .word", { yPercent: 118 });
    gsap.set(".hero__portrait", { clipPath: "inset(100% 0% 0% 0%)", yPercent: 6 });
  }

  // year
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* -------------------------------------------------- portrait photo fallback
     If assets/img/foe.jpg is missing, collapse the portrait column so the
     hero reads as a pure type poster (the v1 layout). */
  const foePhoto = document.getElementById("foePhoto");
  const hero = document.getElementById("hero");
  if (foePhoto && hero) {
    const dropPortrait = () => hero.classList.add("hero--noportrait");
    if (foePhoto.complete && foePhoto.naturalWidth === 0) dropPortrait();
    foePhoto.addEventListener("error", dropPortrait);
  }

  /* -------------------------------------------------- hero ambience video
     Loads only on desktop + no reduced-motion, and only if the file exists.
     Missing file → the video element stays invisible; zero layout impact. */
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo && !reduce && window.matchMedia("(min-width: 900px)").matches) {
    heroVideo.addEventListener("canplay", () => {
      heroVideo.classList.add("is-playing");
      heroVideo.play().catch(() => {});
    });
    heroVideo.addEventListener("error", () => heroVideo.remove(), { once: true });
    heroVideo.preload = "auto";
    heroVideo.src = heroVideo.dataset.src;
    heroVideo.load();
  }

  /* -------------------------------------------------- custom cursor */
  if (!isTouch && hasGSAP) {
    const cursor = document.querySelector(".cursor");
    if (cursor) {
      document.documentElement.classList.add("has-cursor");
      const xTo = gsap.quickTo(cursor, "x", { duration: 0.35, ease: "power3" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.35, ease: "power3" });
      window.addEventListener("pointermove", (e) => { xTo(e.clientX); yTo(e.clientY); });
      document.querySelectorAll('[data-cursor="hover"]').forEach((el) => {
        el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
      });
      window.addEventListener("pointerdown", () => gsap.to(cursor, { scale: 0.8, duration: 0.2 }));
      window.addEventListener("pointerup", () => gsap.to(cursor, { scale: 1, duration: 0.2 }));
    }
  }

  /* -------------------------------------------------- nav */
  const nav = document.getElementById("nav");
  const onScrollNav = () => nav && nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  const burger = document.getElementById("burger");
  const links = document.querySelector(".nav__links");
  if (burger && links) {
    burger.addEventListener("click", () => links.classList.toggle("is-open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("is-open"))
    );
  }

  /* -------------------------------------------------- hero intro timeline */
  function playHero() {
    if (!hasGSAP || reduce) return;
    const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

    tl.from(".hero__title .word", { yPercent: 118, duration: 1.15, stagger: 0.12 }, 0)
      .to(".hero__portrait", { clipPath: "inset(0% 0% 0% 0%)", yPercent: 0, duration: 1.3, ease: "expo.inOut" }, 0.15)
      .from(".hero__eyebrow", { y: 20, opacity: 0, duration: 0.8 }, 0.2)
      .from(".hero__sub > *", { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.5)
      .from(".hero__tag", { y: 20, opacity: 0, duration: 0.8 }, 0.7)
      .from(".hero__actions .btn", { y: 24, opacity: 0, duration: 0.8, stagger: 0.1 }, 0.8)
      .from(".hero__portrait-cap", { y: 14, opacity: 0, duration: 0.7 }, 1.0)
      .from(".hero__portrait-stamp", { scale: 0, rotation: 60, duration: 0.7, ease: "back.out(2)" }, 1.05)
      .from(".hero__scroll", { opacity: 0, duration: 1 }, 1.2);
  }

  /* -------------------------------------------------- preloader */
  const loader = document.getElementById("loader");
  const bar = document.getElementById("loaderBar");
  const count = document.getElementById("loaderCount");

  function finishLoad() {
    if (!loader) { playHero(); return; }
    if (!hasGSAP) { loader.style.display = "none"; playHero(); return; }
    gsap.to(loader, {
      yPercent: -100, duration: 1.0, ease: "expo.inOut", delay: 0.15,
      onComplete: () => { loader.style.display = "none"; playHero(); if (window.ScrollTrigger) ScrollTrigger.refresh(); },
    });
  }

  if (loader && hasGSAP && !reduce) {
    const prog = { v: 0 };
    gsap.to(prog, {
      v: 100, duration: 1.5, ease: "power2.inOut",
      onUpdate: () => {
        const val = Math.round(prog.v);
        if (bar) bar.style.width = val + "%";
        if (count) count.textContent = val;
      },
      onComplete: finishLoad,
    });
  } else {
    if (bar) bar.style.width = "100%";
    if (count) count.textContent = "100";
    if (hasGSAP && !reduce) {
      window.addEventListener("load", finishLoad);
      setTimeout(finishLoad, 1200); // fallback in case 'load' already fired
    } else {
      // reduced motion / no GSAP: show everything immediately
      if (loader) loader.style.display = "none";
      gsapFallback();
    }
  }

  function gsapFallback() {
    document.querySelectorAll("[data-reveal]").forEach((el) => { el.style.opacity = 1; el.style.transform = "none"; });
    document.querySelectorAll(".hero__portrait").forEach((el) => { el.style.clipPath = "none"; });
  }

  /* -------------------------------------------------- scroll reveals */
  if (hasGSAP && window.ScrollTrigger && !reduce) {
    gsap.utils.toArray("[data-reveal]").forEach((el) => {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    /* booking headline reveal on scroll (whole words, gradient intact) */
    gsap.from(".booking__title .word", {
      yPercent: 118, duration: 1.05, ease: "expo.out", stagger: 0.12,
      scrollTrigger: { trigger: ".booking__title", start: "top 82%" },
    });

    /* portrait drifts slower than the page — editorial parallax */
    if (!document.getElementById("hero").classList.contains("hero--noportrait")) {
      gsap.to(".hero__portrait", {
        yPercent: -10, ease: "none",
        scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 0.6 },
      });
    }
  } else {
    gsapFallback();
  }

  /* -------------------------------------------------- counters */
  document.querySelectorAll(".stat__num").forEach((el) => {
    const word = el.getAttribute("data-word");
    const suffix = el.getAttribute("data-suffix") || "";
    const targetVal = parseFloat(el.getAttribute("data-count")) || 0;

    const set = (v) => {
      el.textContent = word ? word : Math.round(v) + suffix;
    };

    if (!hasGSAP || !window.ScrollTrigger || reduce) { set(targetVal); return; }

    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 90%", once: true,
      onEnter: () => {
        if (word) { set(0); return; }
        gsap.to(obj, { v: targetVal, duration: 1.8, ease: "power2.out", onUpdate: () => set(obj.v) });
      },
    });
    set(0);
  });

  /* -------------------------------------------------- marquee */
  const track = document.getElementById("marquee");
  if (track && hasGSAP && !reduce) {
    gsap.to(track, { xPercent: -50, repeat: -1, duration: 30, ease: "none" });
  }

  /* -------------------------------------------------- album tilt */
  const tiltWrap = document.querySelector("[data-tilt]");
  const frame = document.querySelector(".music__art-frame");
  if (tiltWrap && frame && !isTouch && hasGSAP) {
    const rX = gsap.quickTo(frame, "rotationX", { duration: 0.6, ease: "power3" });
    const rY = gsap.quickTo(frame, "rotationY", { duration: 0.6, ease: "power3" });
    tiltWrap.addEventListener("pointermove", (e) => {
      const r = tiltWrap.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      rY(px * 16); rX(-py * 16);
    });
    tiltWrap.addEventListener("pointerleave", () => { rX(0); rY(0); });
  }

  /* -------------------------------------------------- magnetic buttons */
  if (!isTouch && hasGSAP) {
    document.querySelectorAll("[data-magnetic]").forEach((btn) => {
      const mx = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3" });
      const my = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3" });
      btn.addEventListener("pointermove", (e) => {
        const r = btn.getBoundingClientRect();
        mx((e.clientX - (r.left + r.width / 2)) * 0.35);
        my((e.clientY - (r.top + r.height / 2)) * 0.35);
      });
      btn.addEventListener("pointerleave", () => { mx(0); my(0); });
    });
  }

  /* -------------------------------------------------- broken YT thumb fallback */
  document.querySelectorAll(".battle__thumb img").forEach((img) => {
    img.addEventListener("error", () => {
      img.style.display = "none";
      img.parentElement.style.background =
        "linear-gradient(135deg, #1e1917, #7c2f38)";
    });
  });
})();
