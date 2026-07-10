export class DiagramLoader {
    constructor() {
        this.panzoomInstances = new Map();
        this.cache = new Map();
    }

    getTheme() {
        return document.body.classList.contains('light') ? 'light' : 'dark';
    }

    async loadSvg(title, theme) {
        const key = `${title}/${theme}`;
        if (this.cache.has(key)) return this.cache.get(key);

        const res = await fetch(`/assets/diagrams/${key}.html`);
        if (!res.ok) throw new Error(`Failed to load ${key}`);
        const svg = await res.text();
        this.cache.set(key, svg);
        return svg;
    }

    async load(container) {
        const title = container.dataset.title;
        const theme = this.getTheme();
        const id = container.id || `d-${Math.random().toString(36).slice(2, 9)}`;
        container.id = id;

        container.innerHTML = `
            <div class="diagram-skeleton">
                <div class="diagram-skeleton-line" style="width:60%"></div>
                <div class="diagram-skeleton-line" style="width:80%"></div>
                <div class="diagram-skeleton-line" style="width:40%"></div>
            </div>
        `;

        try {
            container.innerHTML = await this.loadSvg(title, theme);

            const svgEl = container.querySelector('svg');
            if (!svgEl) throw new Error('No SVG found');

            svgEl.style.width = '100%';
            svgEl.style.height = '100%';
            svgEl.style.display = 'block';

            const pz = svgPanZoom(svgEl, {
                zoomEnabled: true,
                controlIconsEnabled: false,
                fit: true,
                center: true,
                minZoom: 0.3,
                maxZoom: 10,
                dblClickZoomEnabled: true,
                mouseWheelZoomEnabled: true,
                preventMouseEventsDefault: true,
            });

            this.panzoomInstances.set(id, pz);
            this.addToolbar(container, pz);

        } catch (err) {
            console.error(`Failed to load diagram "${title}":`, err);
            container.innerHTML = `<div class="diagram-error">Failed to load diagram. <button class="diagram-retry" onclick="window.diagramLoader.load(document.getElementById('${id}'))">Retry</button></div>`;
        }
    }

    addToolbar(container, pz) {
        const toolbar = document.createElement('div');
        toolbar.className = 'diagram-toolbar';
        toolbar.innerHTML = `
            <button class="diagram-btn" data-action="zoom-in" aria-label="Zoom in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <button class="diagram-btn" data-action="reset" aria-label="Reset view">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
            <button class="diagram-btn" data-action="zoom-out" aria-label="Zoom out">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
            <span class="diagram-hint">Scroll · Drag</span>
        `;

        toolbar.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                if (action === 'zoom-in') pz.zoomIn();
                else if (action === 'zoom-out') pz.zoomOut();
                else if (action === 'reset') { pz.resetZoom(); pz.center(); }
            });
        });

        container.appendChild(toolbar);
    }

    reRenderAll() {
        for (const pz of this.panzoomInstances.values()) {
            pz.destroy();
        }
        this.panzoomInstances.clear();

        document.querySelectorAll('.case-diagram-container').forEach(c => {
            this.load(c);
        });
    }
}