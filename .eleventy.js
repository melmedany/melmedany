module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
      // copy general assets files
      "assets" : "assets",
      // copy Inter font and CSS files
      "node_modules/@fontsource/inter/index.css": "assets/fontsource/inter.css",
      "node_modules/@fontsource/inter/files": "assets/fontsource/files",

      // copy JetBrains mono font and CSS files
      "node_modules/@fontsource/jetbrains-mono/index.css": "assets/fontsource/jetbrains-mono.css",
      "node_modules/@fontsource/jetbrains-mono/files": "assets/fontsource/files",

      // copy fontawesome font and CSS files
      "node_modules/@fortawesome/fontawesome-free/css": "assets/font-awesome",
      "node_modules/@fortawesome/fontawesome-free/webfonts": "assets/webfonts",

      // copy svg-pan-zoom JS file
      "node_modules/svg-pan-zoom/dist/svg-pan-zoom.min.js": "assets/svg-pan-zoom/svg-pan-zoom.min.js",

      // copy Swiper JS and CSS files
      "node_modules/swiper/swiper-bundle.min.css": "assets/swiper/swiper-bundle.min.css",
      "node_modules/swiper/swiper-bundle.min.js": "assets/swiper/swiper-bundle.min.js",
  });
  eleventyConfig.ignores.add("src/og-card.njk");

  eleventyConfig.addFilter("categoryLabel", function(key) {
    const labels = {
      languages:    'Languages',
      system_design:'System Design',
      sre:          'SRE & Reliability',
      architecture: 'Architecture',
      cloud:        'Cloud',
      frameworks:   'Frameworks',
      data:         'Databases',
      devOps:       'DevOps',
      testing:      'Testing',
      messaging:    'Messaging',
      observability:'Observability',
    };
    return labels[key] || key;
  });

 const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
 eleventyConfig.addFilter("fmtDate", function(iso) {
    if (!iso) return '';
    const [y, m] = iso.split('-');
    return m ? `${months[parseInt(m, 10) - 1]} ${y}` : y;
  });

 eleventyConfig.addFilter("durationYrs", function(start, end) {
    if (!start) return '';
    const s  = new Date(start + '-01');
    const e  = end ? new Date(end + '-01') : new Date();
    const mo = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    const yr = Math.max(0, Math.round(mo / 12 * 10) / 10);
    return yr ? `${yr} yr${yr === 1 ? '' : 's'}` : '';
  });

 eleventyConfig.addFilter("titleToDiagram", function(title) {
     return title.replace(/\s+/g, '-').toLowerCase();
  });

  return {
    dir: {
      input:  "src",
      output: "build",
      data:   "../data",
    },
  };
};