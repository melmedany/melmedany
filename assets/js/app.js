import { DiagramLoader } from './diagram-loader.js';

class ResumeApp {
    theme = 'dark';

    initTheme() {
        const saved = localStorage.getItem('resume-theme');
        const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        this.theme = saved || preferred;
        this.applyTheme();

        document.getElementById('themeToggle').addEventListener('click', async (event) => {
            const button = event.currentTarget;
            button.disabled = true;

            this.theme = this.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem('resume-theme', this.theme);

            this.applyTheme();

            // Re-render diagrams with new theme
            if (this.diagramLoader) {
                this.diagramLoader.reRenderAll(this.theme);
            }

            button.disabled = false;
        });
    }

    applyTheme() {
        document.body.classList.toggle('light', this.theme === 'light');
        const icon = document.getElementById('themeIcon');
        if (icon) icon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    initDiagrams() {
        const containers = document.querySelectorAll('.case-diagram-container');
        if (!containers.length) return;

        this.diagramLoader = new DiagramLoader();

        // Lazy init: only load D2 WASM when case-studies section is visible
        const caseSection = document.getElementById('case-studies');
        if (!caseSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.renderAllDiagrams().then(_r => observer.disconnect());
                }
            });
        }, {threshold: 0.05, rootMargin: '200px'});

        observer.observe(caseSection);
    }

    async renderAllDiagrams() {
        if (!this.diagramLoader) return;

        document.querySelectorAll('.case-diagram-container').forEach(container => {
            const d2Source = container.dataset.d2;
            const title = container.dataset.title || 'Diagram';
            if (d2Source) {
                this.diagramLoader.load(container, d2Source, {
                    theme: this.theme,
                    title,
                });
            }
        });
    }

    initMobileNav() {
        const toggle = document.getElementById('navToggle');
        const navLinks = document.getElementById('navLinks');
        if (!toggle || !navLinks) return;

        const icon = toggle.querySelector('i');

        const closeMenu = () => {
            navLinks.classList.remove('open');
            toggle.setAttribute('aria-expanded', 'false');
            if (icon) icon.className = 'fas fa-bars';
        };

        const toggleMenu = () => {
            const isOpen = navLinks.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            if (icon) icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
        };

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMenu();
        });

        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && e.target !== toggle) {
                closeMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && navLinks.classList.contains('open')) {
                closeMenu();
            }
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) closeMenu();
        });
    }

    initScrollAnimations() {
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, {threshold: 0.1, rootMargin: '0px 0px -50px 0px'});

        document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
    }

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) target.scrollIntoView({behavior: 'smooth', block: 'start'});
            });
        });
    }

    initSwipers() {
        if (typeof Swiper === 'undefined') return;

        const caseSwiperEl = document.querySelector('.case-swiper');
        if (caseSwiperEl) {
            new Swiper(caseSwiperEl, {
                slidesPerView: 1,
                spaceBetween: 24,
                pagination: {el: '.swiper-pagination', clickable: true},
                navigation: {nextEl: '.case-next', prevEl: '.case-prev'},
                keyboard: {enabled: true},
                a11y: {
                    prevSlideMessage: 'Previous case study',
                    nextSlideMessage: 'Next case study',
                    paginationBulletMessage: 'Go to slide {{index}}'
                }
            });
        }

        const blogSwiperEl = document.querySelector('.blog-swiper');
        if (blogSwiperEl) {
            new Swiper(blogSwiperEl, {
                slidesPerView: 1,
                spaceBetween: 24,
                grabCursor: true,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true
                },
                noSwipingClass: 'swiper-no-swiping',
                navigation: {
                    nextEl: '.blog-next',
                    prevEl: '.blog-prev'
                },
                keyboard: {
                    enabled: true
                },
                breakpoints: {
                    480: {
                        slidesPerView: 2,
                        spaceBetween: 20
                    },
                    768: {
                        slidesPerView: 4,
                        spaceBetween: 24
                    }
                },
                a11y: {
                    prevSlideMessage: 'Previous article',
                    nextSlideMessage: 'Next article',
                    paginationBulletMessage: 'Go to article {{index}}'
                }
            });
        }
    }

    initAnalytics() {
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-6ZDSEQHGEF');
    }

    init() {
        this.initTheme();
        this.initMobileNav();
        this.initScrollAnimations();
        this.initSmoothScroll();
        this.initSwipers();
        this.initDiagrams();
        this.initAnalytics();
    }
}

document.addEventListener('DOMContentLoaded', () => new ResumeApp().init());
