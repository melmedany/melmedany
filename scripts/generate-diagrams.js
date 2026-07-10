const path = require('path');
const fs = require('fs');

async function loadD2() {
    const { D2 } = await import('@terrastruct/d2');
    return new D2();
}

const spaData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/spa.json'), 'utf-8')
);

const outputDir = path.join(__dirname, '../build/assets/diagrams');
fs.mkdirSync(outputDir, {recursive: true});

const lightOverrides = {
    N1: "#171717",   // text
    N2: "#4a4a4a",   // italics
    N3: "#808080",
    N4: "#e0e0e0",   // diamond — slightly darker for visibility
    N5: "#d4d4d4",   // parallelogram, queue, hexagon
    N6: "#ffffff",   // PAGE background (outer canvas)
    N7: "#f0f0f0",   // rectangle/circle fill — NOT same as N6

    // Base colors (connections, borders)
    B1: "#059669",   // solid connections — slightly darker for contrast
    B2: "#10b981",   // dashed connections
    B3: "#34d399",   // person, 4x parent shapes
    B4: "#6ee7b7",   // 3x parent
    B5: "#a7f3d0",   // 2x parent
    B6: "#d1fae5",   // parent

    // Supporting Color A — parent stored data, package, cylinder
    AA4: "#f5f5f5",  // parent containers fill (subtle grey)
    AA5: "#e5e5e5",  // stored data, package, cylinder

    // Supporting Color B — parent page, step, document
    AB4: "#fafafa",  // parent page fill
    AB5: "#f0f0f0",  // page, step, document
};

const darkOverrides = {
    // Neutrals
    N1: "#e0e0e0",   // text
    N2: "#b0b0b0",   // italics
    N3: "#808080",
    N4: "#3a3a3a",   // diamond
    N5: "#2a2a2a",   // parallelogram, queue, hexagon
    N6: "#0a0a0a",   // PAGE background (outer canvas) — darker than N7
    N7: "#2a2a2a",   // rectangle/circle fill — distinct from N6

    // Base colors
    B1: "#10b981",   // solid connections
    B2: "#34d399",   // dashed connections — lighter for visibility on dark
    B3: "#6ee7b7",   // person, 4x parent
    B4: "#34d399",   // 3x parent
    B5: "#10b981",   // 2x parent
    B6: "#059669",   // parent

    // Supporting Color A
    AA4: "#252525",  // parent containers fill (subtle lift from N7)
    AA5: "#1f1f1f",  // stored data, package, cylinder

    // Supporting Color B
    AB4: "#2a2a2a",  // parent page fill
    AB5: "#2a2a2a",  // page, step, document
};

const buildVarsBlock = function (overrides) {
    const entries = Object.entries(overrides)
        .map(([k, v]) => `      ${k}: "${v}"`)
        .join('\n');
    return `vars: {\n  d2-config: {\n    theme-overrides: {\n${entries}\n    }\n  }\n}\n\n`;
}

const titleToDiagram = function (title) {
    return title.replace(/\s+/g, '-').toLowerCase();
};

(async () => {
    const d2 = await loadD2();
    let generated = 0;
    let failed = 0;

    for (const cs of (spaData.basics.caseStudies || [])) {
        if (!cs.diagram) continue;

        const outputPath = path.join(outputDir, titleToDiagram(cs.title));
        fs.mkdirSync(outputPath, {recursive: true});

        const baseD2 = cs.diagram;

        for (const [theme, overrides, themeId] of [
            ['light', lightOverrides, 0],
            ['dark', darkOverrides, 200],
        ]) {
            const d2Source = buildVarsBlock(overrides) + baseD2;

            try {
                const result = await d2.compile(d2Source, {
                    layout: 'elk',
                    sketch: false,
                });

                const svg = await d2.render(result.diagram, {
                    ...result.renderOptions,
                    themeID: themeId,
                    pad: 20,
                    noXMLTag: false,
                });

                // Save SVG markup as .html file
                fs.writeFileSync(path.join(outputPath, `${theme}.html`), svg);

                generated++;
            } catch (err) {
                console.error(`✗ ${cs.title} failed:`, err.message);
                failed++;
            }
        }
    }
    console.log(`\nDiagrams: ${generated} succeeded, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
})();