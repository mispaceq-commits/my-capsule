/* =========================================================
   Червяк VPN — interactivity
   ========================================================= */

(function () {
    'use strict';

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = matchMedia('(hover: none)').matches;

    /* ---------- Slime cursor ---------- */
    (function slimeCursor() {
        if (isTouch) return;
        const ring = document.querySelector('.slime-cursor');
        const dot = document.querySelector('.slime-cursor-dot');
        if (!ring || !dot) return;

        let rx = 0, ry = 0, dx = 0, dy = 0, tx = 0, ty = 0;

        window.addEventListener('mousemove', (e) => {
            tx = e.clientX; ty = e.clientY;
            // position the tight dot immediately
            dx = tx; dy = ty;
            dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
        }, { passive: true });

        function loop() {
            rx += (tx - rx) * 0.18;
            ry += (ty - ry) * 0.18;
            ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
            requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);

        const hotSelectors = 'a, button, .feature-card, .plan, .contact-link, input, textarea';
        document.querySelectorAll(hotSelectors).forEach((el) => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hot'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hot'));
        });
    })();

    /* ---------- Feature-card pointer glow ---------- */
    document.querySelectorAll('.feature-card').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width) * 100 + '%');
            card.style.setProperty('--my', ((e.clientY - r.top) / r.height) * 100 + '%');
        });
    });

    /* ---------- Reveal on scroll ---------- */
    (function revealObserver() {
        const revealTargets = document.querySelectorAll(
            '.hero-copy, .hero-visual, .section-head, .feature-card, .tunnel-steps li, .plan, .contact-copy, .contact-form, .stat, .footer-col, .footer-brand'
        );
        revealTargets.forEach((el, i) => {
            el.classList.add('reveal');
            el.style.transitionDelay = (i % 4) * 80 + 'ms';
        });

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

        revealTargets.forEach((el) => io.observe(el));

        // Safety fallback — if for any reason the observer misses something
        // (fast scrolling, tab switch, back-forward cache), force visibility
        // after 2.5s so content is never permanently hidden.
        setTimeout(() => {
            revealTargets.forEach((el) => el.classList.add('is-visible'));
        }, 2500);
    })();

    /* ---------- Animated speed meter ---------- */
    (function meterFill() {
        const meter = document.querySelector('.meter-fill');
        if (!meter) return;
        const target = meter.dataset.target || 95;
        const io = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    meter.style.width = target + '%';
                    obs.disconnect();
                }
            });
        }, { threshold: 0.4 });
        io.observe(meter);
    })();

    /* ---------- Worm crawling along tunnel path ---------- */
    (function crawlingWorm() {
        if (reduceMotion) return;
        const path = document.getElementById('tunnel-curve');
        const worm = document.querySelector('.crawling-worm');
        const map = document.querySelector('.tunnel-map');
        if (!path || !worm || !map) return;

        const length = path.getTotalLength();

        function update() {
            const rect = map.getBoundingClientRect();
            const vh = window.innerHeight;
            // progress 0..1 as section travels across viewport
            let progress = 1 - (rect.top + rect.height * 0.2) / vh;
            progress = Math.max(0, Math.min(1, progress));

            const pt = path.getPointAtLength(length * progress);
            const pt2 = path.getPointAtLength(Math.min(length, length * progress + 2));
            const angle = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;

            // convert svg coords to CSS — svg is 100% width scaled, use bounding
            const svg = path.ownerSVGElement;
            const svgRect = svg.getBoundingClientRect();
            const vbW = 1200, vbH = 400;
            const scaleX = svgRect.width / vbW;
            const scaleY = svgRect.height / vbH;
            const x = pt.x * scaleX;
            const y = pt.y * scaleY;

            worm.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) rotate(${angle}deg)`;
        }

        update();
        window.addEventListener('scroll', update, { passive: true });
        window.addEventListener('resize', update);
    })();

    /* ---------- Parallax tilt for hero visual ---------- */
    (function tilt() {
        if (isTouch || reduceMotion) return;
        document.querySelectorAll('[data-tilt]').forEach((el) => {
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `perspective(1000px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = '';
            });
        });
    })();

    /* ---------- Smooth-scroll offset for sticky nav ---------- */
    document.querySelectorAll('a[href^="#"]').forEach((a) => {
        a.addEventListener('click', (e) => {
            const id = a.getAttribute('href');
            if (id.length <= 1) return;
            const target = document.querySelector(id);
            if (!target) return;
            e.preventDefault();
            const navH = document.querySelector('.nav')?.offsetHeight || 0;
            const top = target.getBoundingClientRect().top + window.scrollY - navH - 10;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    /* ---------- Mobile burger toggle ---------- */
    (function burger() {
        const btn = document.querySelector('.nav-burger');
        const links = document.querySelector('.nav-links');
        if (!btn || !links) return;
        btn.addEventListener('click', () => {
            const open = links.classList.toggle('is-open');
            btn.classList.toggle('is-open', open);
            if (open) {
                links.style.display = 'flex';
                links.style.position = 'fixed';
                links.style.inset = '70px 16px auto 16px';
                links.style.flexDirection = 'column';
                links.style.padding = '20px';
                links.style.background = 'rgba(20,6,11,.95)';
                links.style.border = '1px solid rgba(255,158,194,.25)';
                links.style.borderRadius = '22px';
                links.style.backdropFilter = 'blur(16px)';
                links.style.zIndex = '99';
            } else {
                links.style.cssText = '';
            }
        });
        links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
            links.classList.remove('is-open');
            links.style.cssText = '';
        }));
    })();

    /* ---------- Contact form: fake submit with slime reaction ---------- */
    (function contactForm() {
        const form = document.querySelector('.contact-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            const note = form.querySelector('.form-note');
            if (!btn) return;
            btn.querySelector('span').textContent = 'Копаем тоннель...';
            btn.disabled = true;
            setTimeout(() => {
                btn.querySelector('span').textContent = 'Готово! Червяк ползёт к тебе 🪱';
                if (note) note.textContent = 'Заявка получена. Ответим в Telegram/на почту.';
                form.reset();
                setTimeout(() => {
                    btn.querySelector('span').textContent = 'Прокопать ход';
                    btn.disabled = false;
                }, 2500);
            }, 1200);
        });
    })();

    /* ---------- Random slime droplets spawned from cursor on click ---------- */
    (function slimeSpawn() {
        if (isTouch) return;
        document.addEventListener('click', (e) => {
            const target = e.target;
            // only on interactive clicks in hero/features area, not form typing
            if (target.closest('input, textarea, select')) return;
            spawnDroplet(e.clientX, e.clientY);
        });

        function spawnDroplet(x, y) {
            const n = 6;
            for (let i = 0; i < n; i++) {
                const d = document.createElement('div');
                d.className = 'splash-droplet';
                document.body.appendChild(d);
                const angle = (Math.PI * 2 * i) / n + Math.random() * 0.4;
                const dist = 30 + Math.random() * 50;
                const dx = Math.cos(angle) * dist;
                const dy = Math.sin(angle) * dist;
                d.style.cssText = `
                    position: fixed;
                    left: ${x}px; top: ${y}px;
                    width: ${6 + Math.random() * 8}px;
                    height: ${6 + Math.random() * 8}px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 35% 30%, #aaf6ff, #00e5ff 60%, #006c82 100%);
                    box-shadow: 0 0 14px #00e5ff;
                    pointer-events: none;
                    z-index: 9998;
                    transform: translate(-50%,-50%);
                    transition: transform 700ms cubic-bezier(.2,.7,.3,1), opacity 700ms ease;
                `;
                requestAnimationFrame(() => {
                    d.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.3)`;
                    d.style.opacity = '0';
                });
                setTimeout(() => d.remove(), 750);
            }
        }
    })();

    /* ---------- Contact popups (TG / IG account picker) ---------- */
    (function popups() {
        const triggers = document.querySelectorAll('[data-popup]');
        const backdrops = document.querySelectorAll('.popup-backdrop');
        if (!triggers.length) return;

        function open(id) {
            const bd = document.getElementById('popup-' + id);
            if (!bd) return;
            bd.hidden = false;
            // next frame so transition kicks in
            requestAnimationFrame(() => bd.classList.add('is-open'));
            document.body.style.overflow = 'hidden';
        }
        function close(bd) {
            bd.classList.remove('is-open');
            document.body.style.overflow = '';
            setTimeout(() => { bd.hidden = true; }, 300);
        }

        triggers.forEach((t) => {
            t.addEventListener('click', (e) => {
                e.preventDefault();
                open(t.dataset.popup);
            });
        });

        backdrops.forEach((bd) => {
            bd.addEventListener('click', (e) => {
                if (e.target === bd || e.target.classList.contains('popup-close')) {
                    close(bd);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            backdrops.forEach((bd) => { if (!bd.hidden) close(bd); });
        });
    })();

    /* ---------- Nav shadow on scroll ---------- */
    (function navShadow() {
        const nav = document.querySelector('.nav');
        if (!nav) return;
        const onScroll = () => {
            if (window.scrollY > 12) {
                nav.style.boxShadow = '0 10px 30px rgba(0,0,0,.35)';
            } else {
                nav.style.boxShadow = 'none';
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    })();

})();
