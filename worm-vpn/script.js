/* ===================================================================
   Червяк VPN — интерактив
   Параллакс червяка, курсор-слизь, лёгкий tilt у тарифов,
   ленивое появление секций и плавный скролл по якорям.
   =================================================================== */

(() => {
    "use strict";

    const prefersReduced =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Плавный скролл по якорям ---------- */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener("click", (e) => {
            const id = a.getAttribute("href");
            if (!id || id === "#") return;
            const el = document.querySelector(id);
            if (!el) return;
            e.preventDefault();
            el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        });
    });

    /* ---------- Параллакс героя ---------- */
    const hero = document.querySelector(".hero__visual");
    const wormMain = document.querySelector(".hero__worm--main");
    const wormMini = document.querySelector(".hero__worm--mini");
    const hole = document.querySelector(".hero__hole");

    if (hero && !prefersReduced) {
        let rafId = null;
        let target = { x: 0, y: 0 };
        let current = { x: 0, y: 0 };

        const onMove = (e) => {
            const rect = hero.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            target.x = (e.clientX - cx) / rect.width;
            target.y = (e.clientY - cy) / rect.height;
            if (!rafId) rafId = requestAnimationFrame(tick);
        };

        const tick = () => {
            current.x += (target.x - current.x) * 0.08;
            current.y += (target.y - current.y) * 0.08;

            if (wormMain) {
                wormMain.style.transform =
                    `translate3d(${current.x * 34}px, ${current.y * 26}px, 0) rotate(${current.x * 4}deg)`;
            }
            if (wormMini) {
                wormMini.style.transform =
                    `translate3d(${-current.x * 22}px, ${-current.y * 18}px, 0) rotate(${-current.x * 6}deg)`;
            }
            if (hole) {
                hole.style.transform =
                    `translate3d(${current.x * 10}px, ${current.y * 8}px, 0) scale(1)`;
            }

            if (Math.abs(target.x - current.x) > 0.001 || Math.abs(target.y - current.y) > 0.001) {
                rafId = requestAnimationFrame(tick);
            } else {
                rafId = null;
            }
        };

        window.addEventListener("mousemove", onMove, { passive: true });

        window.addEventListener(
            "deviceorientation",
            (e) => {
                if (e.gamma == null || e.beta == null) return;
                target.x = Math.max(-1, Math.min(1, e.gamma / 40));
                target.y = Math.max(-1, Math.min(1, (e.beta - 40) / 40));
                if (!rafId) rafId = requestAnimationFrame(tick);
            },
            { passive: true }
        );
    }

    /* ---------- Tilt у карточек тарифов ---------- */
    if (!prefersReduced) {
        document.querySelectorAll(".plan").forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const r = card.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                card.style.transform =
                    `translateY(${card.classList.contains("plan--hot") ? -22 : -8}px) rotateX(${-y * 4}deg) rotateY(${x * 6}deg)`;
            });
            card.addEventListener("mouseleave", () => {
                card.style.transform = "";
            });
        });
    }

    /* ---------- Появление блоков при скролле ---------- */
    const observer =
        "IntersectionObserver" in window
            ? new IntersectionObserver(
                  (entries) => {
                      entries.forEach((en) => {
                          if (en.isIntersecting) {
                              en.target.classList.add("is-in");
                              observer.unobserve(en.target);
                          }
                      });
                  },
                  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
              )
            : null;

    if (observer) {
        document
            .querySelectorAll(".feat, .plan, .q, .social, .section__head, .hero__content, .hero__visual")
            .forEach((el) => {
                el.classList.add("reveal");
                observer.observe(el);
            });
    }

    /* ---------- Слизистый курсор-след ---------- */
    if (!prefersReduced && !matchMedia("(pointer: coarse)").matches) {
        const root = document.body;
        let last = 0;
        const THROTTLE = 35;

        window.addEventListener(
            "mousemove",
            (e) => {
                const now = performance.now();
                if (now - last < THROTTLE) return;
                last = now;
                const dot = document.createElement("span");
                dot.className = "goo-trail";
                const size = 14 + Math.random() * 18;
                dot.style.width = dot.style.height = size + "px";
                dot.style.left = e.clientX + "px";
                dot.style.top = e.clientY + "px";
                root.appendChild(dot);
                setTimeout(() => dot.remove(), 900);
            },
            { passive: true }
        );
    }

    /* ---------- Лёгкое «дыхание» фоновых блобов от скролла ---------- */
    const blobs = document.querySelectorAll(".goo-bg .blob");
    if (blobs.length && !prefersReduced) {
        let ticking = false;
        window.addEventListener(
            "scroll",
            () => {
                if (ticking) return;
                ticking = true;
                requestAnimationFrame(() => {
                    const y = window.scrollY;
                    blobs.forEach((b, i) => {
                        const k = (i + 1) * 0.05;
                        b.style.translate = `0 ${y * k}px`;
                    });
                    ticking = false;
                });
            },
            { passive: true }
        );
    }

    /* ---------- Консольный привет для любопытных червяков ---------- */
    // eslint-disable-next-line no-console
    console.log(
        "%c🪱 Червяк VPN %c— подкапываем стены. %c dev@cherviak-vpn.ru",
        "background:#ff3377;color:#fff;padding:4px 8px;border-radius:6px;font-weight:700;",
        "color:#ffa6c9;font-weight:600;",
        "color:#00e5ff;"
    );
})();
