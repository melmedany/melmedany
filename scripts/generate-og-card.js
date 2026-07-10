const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const nunjucks = require('nunjucks');

const spaData = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/spa.json'), 'utf-8')
);

const heroImageBase64 = fs.readFileSync(
    path.join(__dirname, '../assets/img/hero.png'), 'base64'
);

const styleCss = fs.readFileSync(
    path.join(__dirname, '../assets/css/style.css'), 'utf-8'
);

(async () => {
    try {
        const cardTemplatePath = path.join(__dirname, '../src/og-card.njk');
        const cardTemplate = fs.readFileSync(cardTemplatePath, 'utf-8');

        const html = nunjucks.renderString(cardTemplate, {
            spa: spaData,
            heroBase64: `data:image/png;base64,${heroImageBase64}`,
            styleCss: styleCss
        });

        const browser = await puppeteer.launch({
            headless: 'new',
             // Fall back smoothly to internal auto-detection if the environment variable is absent
            executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });

        const page = await browser.newPage();

        await page.setViewport({
            width: 1200,
            height: 630,
            deviceScaleFactor: 1
        });

        await page.setContent(html, {waitUntil: 'networkidle0'});

        const outputPath = path.join(__dirname, '../build/assets/img/og-card.png');
        fs.mkdirSync(path.dirname(outputPath), {recursive: true});

        await page.screenshot({
            path: outputPath,
            type: 'png',
            fullPage: false
        });

        console.log(`OG card generated: ${outputPath}`);
        await browser.close();
    } catch (error) {
        console.error('Error generating OG card:', error);
        process.exit(1);
    }
})();