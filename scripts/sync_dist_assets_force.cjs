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
  const temp = assetsPublic + '.new.' + ts;

  // copy dist -> temp
  await fs.cp(dist, temp, { recursive: true });
  console.log('COPIED_TO_TEMP:'+temp);

  // remove existing assetsPublic
  try {
    await fs.rm(assetsPublic, { recursive: true, force: true });
    console.log('REMOVED_OLD_ASSETS');
  } catch(e){ console.error('REMOVE_FAILED', e); }

  // rename temp -> assetsPublic
  await fs.rename(temp, assetsPublic);
  console.log('SWAPPED:'+assetsPublic);

  console.log('SYNC_DONE:'+assetsPublic);
})().catch(err => { console.error(err); process.exit(2) });
