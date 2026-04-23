/* =========================================================
 * CAPSULE // WHITE METAL EDITION — site behavior
 * =========================================================
 *
 * Contents:
 *  1. Page loader (deterministic progress, then reveal content)
 *  2. HUD clock (live time readout)
 *  3. Nav menu toggle (fullscreen menu, a11y + ESC handling)
 *  4. Smooth in-page scroll (respects fixed header)
 *  5. Scroll progress bar
 *  6. Show/hide "back to top" button
 *  7. IntersectionObserver — reveal elements on scroll
 *  8. GSAP scroll-scrubbed hero video (pin controlled, no "broken sectors")
 *  9. Parallax on visual-break background image
 * 10. Animated stat counters
 * 11. Lightbox for gallery and packaging images
 * 12. Newsletter form handler (no backend — local validation only)
 * 13. Dynamic copyright year
 * ========================================================= */

(function () {
    'use strict';

    const qs  = (sel, root = document) => root.querySelector(sel);
    const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        initLoader();
        initHudClock();
        initMenu();
        initSmoothScroll();
        initScrollProgress();
        initBackToTop();
        initReveal();
        initHeroVideoScroll();
        initParallax();
        initCounters();
        initLightbox();
        initCtaForm();
        initFooterYear();
    }

    /* ------------------------------------------------------
     * 1. LOADER
     * ------------------------------------------------------ */
    function initLoader() {
        const loader = qs('#pageLoader');
        const bar    = qs('.loader-bar');
        const label  = qs('#loaderPercent');
        if (!loader) return;

        let progress = 0;
        const duration = 1800; // total ms
        const start = performance.now();

        function tick(now) {
            const t = Math.min((now - start) / duration, 1);
            progress = Math.round(t * 100);
            if (bar)   bar.style.setProperty('--progress', progress + '%');
            if (label) label.textContent = progress + '%';
            if (t < 1) {
                requestAnimationFrame(tick);
            } else {
                loader.classList.add('is-hidden');
                setTimeout(() => loader.remove(), 700);
            }
        }
        requestAnimationFrame(tick);
    }

    /* ------------------------------------------------------
     * 2. HUD CLOCK
     * ------------------------------------------------------ */
    function initHudClock() {
        const el = qs('#hudClock');
        if (!el) return;
        function update() {
            const d = new Date();
            const pad = n => n.toString().padStart(2, '0');
            el.textContent =
                `UPLINK ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
        }
        update();
        setInterval(update, 1000);
    }

    /* ------------------------------------------------------
     * 3. NAV MENU TOGGLE
     * ------------------------------------------------------ */
    function initMenu() {
        const btn   = qs('#menuToggle');
        const menu  = qs('#mainMenu');
        const label = qs('.hud-menu-label', btn || document);
        if (!btn || !menu) return;

        function setOpen(open) {
            btn.setAttribute('aria-expanded', String(open));
            menu.classList.toggle('is-open', open);
            menu.setAttribute('aria-hidden', String(!open));
            document.body.classList.toggle('menu-open', open);
            if (label) label.textContent = open ? 'CLOSE' : 'MENU';
        }

        btn.addEventListener('click', () => {
            const isOpen = menu.classList.contains('is-open');
            setOpen(!isOpen);
        });

        qsa('a[href^="#"]', menu).forEach(link => {
            link.addEventListener('click', () => setOpen(false));
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) {
                setOpen(false);
            }
        });
    }

    /* ------------------------------------------------------
     * 4. SMOOTH SCROLL
     * ------------------------------------------------------ */
    function initSmoothScroll() {
        qsa('a[data-scroll], a[href^="#"]').forEach(link => {
            link.addEventListener('click', e => {
                const href = link.getAttribute('href') || '';
                if (href.length < 2 || href === '#') return;
                const target = qs(href);
                if (!target) return;
                e.preventDefault();
                const navH = parseInt(
                    getComputedStyle(document.documentElement).getPropertyValue('--nav-height'),
                    10
                ) || 64;
                const y = target.getBoundingClientRect().top + window.pageYOffset - navH;
                window.scrollTo({
                    top: y,
                    behavior: prefersReducedMotion ? 'auto' : 'smooth'
                });
            });
        });
    }

    /* ------------------------------------------------------
     * 5. SCROLL PROGRESS BAR
     * ------------------------------------------------------ */
    function initScrollProgress() {
        const bar = qs('#scrollProgress');
        if (!bar) return;
        let ticking = false;

        function update() {
            const h   = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
            bar.style.width = pct.toFixed(2) + '%';
            ticking = false;
        }
        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(update);
            }
        }, { passive: true });
        update();
    }

    /* ------------------------------------------------------
     * 6. BACK-TO-TOP
     * ------------------------------------------------------ */
    function initBackToTop() {
        const btn = qs('#toTop');
        if (!btn) return;
        window.addEventListener('scroll', () => {
            btn.classList.toggle('is-visible', window.scrollY > 500);
        }, { passive: true });
        btn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    /* ------------------------------------------------------
     * 7. REVEAL ON SCROLL (IntersectionObserver)
     * ------------------------------------------------------ */
    function initReveal() {
        const items = qsa('.reveal');
        if (!items.length || !('IntersectionObserver' in window)) {
            items.forEach(el => el.classList.add('is-visible'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        items.forEach(el => io.observe(el));
    }

    /* ------------------------------------------------------
     * 8. HERO VIDEO SCROLL SCRUB (GSAP)
     * ------------------------------------------------------
     * Fixes the "broken sectors" problem: we pin the hero
     * for a moderate, responsive distance so the scroll
     * experience feels seamless — no huge empty stretches.
     * ------------------------------------------------------ */
    function initHeroVideoScroll() {
        const video = qs('#capsuleVideo');
        if (!video || typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            if (video) {
                video.setAttribute('autoplay', '');
                video.setAttribute('loop', '');
                video.play().catch(() => {});
            }
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const isMobile = window.matchMedia('(max-width: 768px)').matches;

        // Mobile: let the video just autoplay on loop, no pin.
        if (isMobile || prefersReducedMotion) {
            video.setAttribute('autoplay', '');
            video.setAttribute('loop', '');
            video.play().catch(() => {});
            return;
        }

        function startScrollTween() {
            if (video.dataset.scrollInitialized === 'true') return;
            video.dataset.scrollInitialized = 'true';

            const duration = Number.isFinite(video.duration) && video.duration > 0
                ? video.duration
                : 8;

            gsap.fromTo(video,
                { currentTime: 0 },
                {
                    currentTime: duration,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: '.hero-section',
                        start: 'top top',
                        end: '+=120%', // responsive: pin for 1.2 viewport heights
                        pin: true,
                        scrub: 0.8,
                        anticipatePin: 1,
                        invalidateOnRefresh: true
                    }
                }
            );

            ScrollTrigger.refresh();
        }

        if (video.readyState >= 1) {
            startScrollTween();
        } else {
            video.addEventListener('loadedmetadata', startScrollTween, { once: true });
            // Safety: if loadedmetadata never fires, start anyway after 3s
            setTimeout(startScrollTween, 3000);
        }
    }

    /* ------------------------------------------------------
     * 9. PARALLAX for [data-parallax] images
     * ------------------------------------------------------ */
    function initParallax() {
        const items = qsa('[data-parallax]');
        if (!items.length || prefersReducedMotion) return;

        function update() {
            items.forEach(el => {
                const rect = el.parentElement.getBoundingClientRect();
                const center = rect.top + rect.height / 2;
                const viewportCenter = window.innerHeight / 2;
                const delta = center - viewportCenter;
                const factor = parseFloat(el.dataset.parallax) || 0.25;
                const offset = -delta * factor;
                el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
            });
        }

        let ticking = false;
        window.addEventListener('scroll', () => {
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(() => {
                    update();
                    ticking = false;
                });
            }
        }, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    /* ------------------------------------------------------
     * 10. STAT COUNTERS
     * ------------------------------------------------------ */
    function initCounters() {
        const nums = qsa('.stat-num');
        if (!nums.length || !('IntersectionObserver' in window)) {
            nums.forEach(applyFinal);
            return;
        }

        function applyFinal(el) {
            const target = parseFloat(el.dataset.target) || 0;
            const suffix = el.dataset.suffix || '';
            el.textContent = target + suffix;
        }

        function animate(el) {
            const target = parseFloat(el.dataset.target) || 0;
            const suffix = el.dataset.suffix || '';
            const duration = 1400;
            const start = performance.now();
            function step(now) {
                const t = Math.min((now - start) / duration, 1);
                const eased = 1 - Math.pow(1 - t, 3);
                el.textContent = Math.round(target * eased) + suffix;
                if (t < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
        }

        const io = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.4 });

        nums.forEach(el => io.observe(el));
    }

    /* ------------------------------------------------------
     * 11. LIGHTBOX (gallery + packaging)
     * ------------------------------------------------------ */
    function initLightbox() {
        const box    = qs('#lightbox');
        const img    = qs('#lightboxImg');
        const cap    = qs('#lightboxCaption');
        const close  = qs('#lightboxClose');
        if (!box || !img || !close) return;

        function open(src, alt) {
            img.src = src;
            img.alt = alt || '';
            cap.textContent = alt || '';
            box.classList.add('is-open');
            box.setAttribute('aria-hidden', 'false');
            document.body.classList.add('lightbox-open');
        }
        function closeBox() {
            box.classList.remove('is-open');
            box.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('lightbox-open');
            img.src = '';
        }

        const selectors = '.gal-item img, .pack-image-wrap img, .ph-image-wrap img';
        qsa(selectors).forEach(node => {
            node.style.cursor = 'zoom-in';
            node.addEventListener('click', () => open(node.src, node.alt));
        });

        close.addEventListener('click', closeBox);
        box.addEventListener('click', e => {
            if (e.target === box) closeBox();
        });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && box.classList.contains('is-open')) closeBox();
        });
    }

    /* ------------------------------------------------------
     * 12. CTA FORM
     * ------------------------------------------------------ */
    function initCtaForm() {
        const form   = qs('#ctaForm');
        const status = qs('#ctaStatus');
        if (!form || !status) return;

        form.addEventListener('submit', e => {
            e.preventDefault();
            const emailInput = qs('input[type="email"]', form);
            const email = emailInput ? emailInput.value.trim() : '';
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(email)) {
                status.textContent = 'INVALID TRANSMISSION // CHECK ADDRESS';
                status.style.color = 'var(--accent-red)';
                return;
            }
            status.textContent = 'UPLINK ACCEPTED. STAND BY.';
            status.style.color = 'var(--text-main)';
            form.reset();
        });
    }

    /* ------------------------------------------------------
     * 13. FOOTER YEAR
     * ------------------------------------------------------ */
    function initFooterYear() {
        const el = qs('#footerYear');
        if (el) el.textContent = String(new Date().getFullYear());
    }

})();
