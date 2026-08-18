import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..', '..');
const homePath = path.join(root, '.dist', 'firebase', 'index.html');
const marker = 'id="levelup-home-readability-v1"';

if (!fs.existsSync(homePath)) throw new Error('LEVEL UP home not found.');
let html = fs.readFileSync(homePath, 'utf8');
if (!html.includes(marker)) {
  const style = `
<style id="levelup-home-readability-v1">
  .skill{font-size:9.5px!important}
  .card-value-label{font-size:8.5px!important}
  .card-value-text{font-size:10.5px!important;line-height:1.34!important}
  .play{font-size:9px!important}
  .card[data-popular-rank] .card-top:before,.card.is-search-top .card-top:before{font-size:8px!important}
  @media(max-width:600px){
    .hero-copy{font-size:12px!important}
    .card,.card-link{min-height:238px!important}
    .skill{font-size:9px!important}
    .card h2{font-size:18px!important;line-height:1.08!important}
    .card-value{grid-template-columns:46px minmax(0,1fr)!important;gap:5px!important}
    .card-value-label{font-size:8px!important}
    .card-value-text{font-size:10px!important;line-height:1.3!important}
    .catalog-divider strong{font-size:10px!important}.catalog-divider span{font-size:9px!important}
  }
</style>`;
  if (!html.includes('</head>')) throw new Error('LEVEL UP home head not found.');
  html = html.replace('</head>', `${style}</head>`);
  fs.writeFileSync(homePath, html);
}
console.log('[Firebase] LEVEL UP compact cards readability floor applied.');
