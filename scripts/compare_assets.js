const fs = require('fs').promises;
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');
const assets1 = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'www');
const assets2 = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');

async function exists(p){ try{ await fs.access(p); return true }catch(e){ return false } }

async function walk(dir, base){
  const res = [];
  if (!await exists(dir)) return res;
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries){
    const full = path.join(dir, e.name);
    if (e.isDirectory()){
      const sub = await walk(full, base);
      res.push(...sub);
    } else if (e.isFile()){
      res.push(path.relative(base, full).replace(/\\\\/g, '/'));
    }
  }
  return res;
}

(async ()=>{
  if (!await exists(dist)){
    console.log('NO_DIST');
    process.exit(0);
  }
  const distFiles = await walk(dist, dist);
  const assetsPath = (await exists(assets1)) ? assets1 : (await exists(assets2) ? assets2 : null);
  const assetFiles = assetsPath ? await walk(assetsPath, assetsPath) : [];

  await fs.writeFile(path.join(root, 'dist_list.txt'), distFiles.join('\n'), 'utf8');
  await fs.writeFile(path.join(root, 'assets_list.txt'), assetFiles.join('\n'), 'utf8');

  const distSet = new Set(distFiles);
  const assetSet = new Set(assetFiles);
  const onlyInDist = distFiles.filter(f => !assetSet.has(f));
  const onlyInAssets = assetFiles.filter(f => !distSet.has(f));

  await fs.writeFile(path.join(root, 'dist_only.txt'), onlyInDist.join('\n'), 'utf8');
  await fs.writeFile(path.join(root, 'assets_only.txt'), onlyInAssets.join('\n'), 'utf8');

  const summary = [];
  summary.push(`Dist count: ${distFiles.length}`);
  summary.push(`Assets path: ${assetsPath || '<none>'}`);
  summary.push(`Assets count: ${assetFiles.length}`);
  summary.push('Only in dist (first 40):');
  summary.push(...onlyInDist.slice(0,40));
  summary.push('Only in assets (first 40):');
  summary.push(...onlyInAssets.slice(0,40));

  await fs.writeFile(path.join(root, 'compare_summary.txt'), summary.join('\n'), 'utf8');
  console.log('COMPARE_DONE');
})().catch(err => { console.error(err); process.exit(2) });
