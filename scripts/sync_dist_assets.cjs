const fs = require('fs').promises;
const path = require('path');
const { existsSync } = require('fs');

(async ()=>{
  const root = path.resolve(__dirname, '..');
  const dist = path.join(root, 'dist');
  const assetsPublic = path.join(root, 'android', 'app', 'src', 'main', 'assets', 'public');

  if (!existsSync(dist)){
    console.error('NO_DIST'); process.exit(1);
  }

  const now = new Date();
  const ts = now.toISOString().replace(/[-:TZ.]/g,'').slice(0,14);

  if (existsSync(assetsPublic)){
    const backup = assetsPublic + '.backup.' + ts;
    await fs.rename(assetsPublic, backup);
    console.log('BACKUP:'+backup);
  }

  await fs.cp(dist, assetsPublic, { recursive: true });
  console.log('SYNC_DONE:'+assetsPublic);
})().catch(err => { console.error(err); process.exit(2) });
