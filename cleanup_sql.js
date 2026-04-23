import fs from 'fs/promises';
import path from 'path';

async function cleanup() {
  const root = 'c:\\MyMasjidApp';
  const archiveDir = path.join(root, 'database', 'legacy_archive');
  
  await fs.mkdir(archiveDir, { recursive: true });

  async function walk(dir) {
    if (dir === archiveDir) return; // skip the archive directory itself
    if (dir.includes('node_modules')) return; // skip node_modules
    
    let files = [];
    try {
      files = await fs.readdir(dir, { withFileTypes: true });
    } catch(e) { return; }

    for (const file of files) {
      const res = path.resolve(dir, file.name);
      if (file.isDirectory()) {
        await walk(res);
      } else if (file.isFile() && file.name.endsWith('.sql')) {
        if (file.name === 'masjid_app_complete_schema.sql') continue; // DO NOT MOVE THIS ONE
        
        // Generate a unique name if there's a clash
        let dest = path.join(archiveDir, file.name);
        try {
          await fs.access(dest);
          dest = path.join(archiveDir, Date.now() + '_' + file.name); // append timestamp to avoid overwrite
        } catch(e) {} // fine, file doesn't exist
        
        await fs.rename(res, dest);
        console.log(`Moved ${res} to ${dest}`);
      }
    }
  }

  await walk(root);
  console.log('✅ Cleanup complete.');
}

cleanup();
