const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/pdf.json'), 'utf-8')
);

function fmtDate(iso) {
    if (!iso) return '';
    const [y, m] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
}

function durationYrs(start, end) {
    if (!start) return '';
    const s = new Date(start + '-01');
    const e = end ? new Date(end + '-01') : new Date();
    const mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    const yr = Math.max(0, Math.round(mo / 12 * 10) / 10);
    return yr ? `${yr} yr${yr === 1 ? '' : 's'}` : '';
}

function buildATSHtml(data) {
    const b = data.basics || {};
    const github = (b.profiles || []).find(p => p.network?.toLowerCase() === 'github')?.url || '';
    const linkedin = (b.profiles || []).find(p => p.network?.toLowerCase() === 'linkedin')?.url || '';

    const contact = [
        b.email,
        b.mobile,
        b.location && `${b.location.city}, ${b.location.country}`,
        github && github.replace(/^https?:\/\/(www\.)?/, ''),
        linkedin && linkedin.replace(/^https?:\/\/(www\.)?/, ''),
    ].filter(Boolean).join(' · ');

    const skillLabels = {
        languages: 'Languages', system_design: 'System Design', sre: 'SRE & Reliability',
        architecture: 'Architecture', cloud: 'Cloud', frameworks: 'Frameworks',
        data: 'Databases', devOps: 'DevOps', testing: 'Testing',
        messaging: 'Messaging', observability: 'Observability',
    };

    const skillsHtml = Object.entries(b.skills || {}).map(([k, v]) => {
        const items = v.map(s => typeof s === 'object' ? s.name : s).join(', ');
        return `<dt>${skillLabels[k] || k}</dt><dd>${items}</dd>`;
    }).join('');

    const workHtml = (data.work || []).map(w => {
        const end = w.current || !w.endDate ? 'Present' : fmtDate(w.endDate);
        const dur = durationYrs(w.startDate, w.endDate);
        const bullets = (w.highlights || []).map(h => `<li>${h}</li>`).join('');
        const tech = w.technologies?.length
            ? `<p class="ats-tech"><strong>Technologies:</strong> ${w.technologies.join(', ')}</p>`
            : '';
        return `
      <div class="ats-job">
        <div class="ats-job-header">
          <strong>${w.position} — ${w.company}</strong>
          <span class="ats-dates">${fmtDate(w.startDate)} – ${end}${dur ? ` (${dur})` : ''}</span>
        </div>
        ${w.summary ? `<p class="ats-p">${w.summary}</p>` : ''}
        ${bullets ? `<ul class="ats-bullets">${bullets}</ul>` : ''}
        ${tech}
      </div>`;
    }).join('');

    const eduHtml = (data.education || []).map(e => `
    <div class="ats-education-row">
      <strong>${e.studyType} in ${e.area} — ${e.institution}</strong>
      <span>${fmtDate(e.startDate)} – ${fmtDate(e.endDate)}</span>
    </div>`).join('');

    const certsHtml = (data.certifications || []).map(c =>
        `<li>${c.name}${c.issuer ? ` — ${c.issuer}` : ''}</li>`
    ).join('');

    const langsHtml = (data.languages || []).map(l =>
        `<li>${l.language}: ${l.fluency}</li>`
    ).join('');

    const pubsHtml = (data.publications || []).map(pub => {
        return `<li><a href="${pub.link}" target="_blank">${pub.name} - ${fmtDate(pub.date)}</a></li>`
    }).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 13.5px; line-height: 1.55; color: #1a1a2e; background: #fff;  padding: 24px; }
  #ats-resume { max-width: 760px; margin: 0 auto; padding: 8px 0; }
  .ats-header { border-bottom: 2px solid #059669; margin-bottom: 16px; padding-bottom: 10px; }
  .ats-name { font-size: 26px; font-weight: 800; margin-bottom: 3px; color: #1a1a2e; }
  .ats-role { font-size: 14.5px; color: #4a5568; margin-bottom: 4px; }
  .ats-contact { font-size: 12px; color: #718096; }
  .ats-section { margin-bottom: 18px; }
  .ats-section-title { font-size: 12.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #059669; border-bottom: 1px solid #cbd5e0; padding-bottom: 3px; margin-bottom: 10px; }
  .ats-job { margin-bottom: 14px; page-break-inside: avoid; }
  .ats-job-header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 3px; }
  .ats-job-header strong { color: #1a1a2e; }
  .ats-dates { font-size: 11.5px; color: #718096; white-space: nowrap; }
  .ats-p { color: #4a5568; margin-bottom: 5px; }
  .ats-tech { font-size: 12px; color: #4a5568; margin-top: 4px; }
  .ats-tech strong { color: #1a1a2e; }
  .ats-bullets { padding-left: 18px; margin: 4px 0; }
  .ats-bullets li { list-style: disc; margin-bottom: 3px; color: #4a5568; }
  .ats-bullets a:hover { text-decoration: underline; }
  .ats-skills dt { font-weight: 600; font-size: 13px; margin-top: 6px; color: #1a1a2e; }
  .ats-skills dd { margin: 0 0 4px 16px; font-size: 13px; color: #4a5568; }
  .ats-education-row { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 6px; color: #4a5568; }
  .ats-education-row strong { color: #1a1a2e; }
</style>
</head>
<body>
<div id="ats-resume">
  <header class="ats-header">
    <h1 class="ats-name">${b.name}</h1>
    <p class="ats-role">${b.label}</p>
    <p class="ats-contact">${contact}</p>
  </header>

  ${b.summary ? `
  <section class="ats-section">
    <h2 class="ats-section-title">Professional Summary</h2>
    <p class="ats-p">${b.summary}</p>
  </section>` : ''}

  <section class="ats-section">
    <h2 class="ats-section-title">Work Experience</h2>
    ${workHtml}
  </section>

  ${pubsHtml ? `
  <section class="ats-section">
    <h2 class="ats-section-title">Publications</h2>
    <ul class="ats-bullets">${pubsHtml}</ul>
  </section>` : ''}

  <section class="ats-section">
    <h2 class="ats-section-title">Technical Skills</h2>
    <dl class="ats-skills">${skillsHtml}</dl>
  </section>

  ${eduHtml ? `
  <section class="ats-section">
    <h2 class="ats-section-title">Education</h2>
    ${eduHtml}
  </section>` : ''}

  ${certsHtml ? `
  <section class="ats-section">
    <h2 class="ats-section-title">Certifications</h2>
    <ul class="ats-bullets">${certsHtml}</ul>
  </section>` : ''}

  ${langsHtml ? `
  <section class="ats-section">
    <h2 class="ats-section-title">Languages</h2>
    <ul class="ats-bullets">${langsHtml}</ul>
  </section>` : ''}

</div>
</body>
</html>`;
}

(async () => {
    const html = buildATSHtml(data);
    const browser = await puppeteer.launch({
        headless: 'new',
        // Fall back smoothly to internal auto-detection if the environment variable is absent
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });
    const page = await browser.newPage();

    await page.setContent(html, {waitUntil: 'networkidle0'});

    const pdfPath = path.join(__dirname, '../build/assets/Mohamed_Elmedany_Senior_Software_Engineer.pdf');
    fs.mkdirSync(path.dirname(pdfPath), {recursive: true});

    await page.pdf({
        path: pdfPath,
        format: 'A4',
        margin: {top: '8mm', bottom: '8mm', left: '8mm', right: '8mm'},
        scale: 1,
        printBackground: false,
    });

    console.log(`PDF generated: ${pdfPath}`);
    await browser.close();
})();