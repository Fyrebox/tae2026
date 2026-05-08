import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUPS_DIR = path.join(__dirname, '..', 'backups');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

fs.mkdirSync(BACKUPS_DIR, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.join(BACKUPS_DIR, `pgdump-${stamp}.sql`);
const outStream = fs.createWriteStream(outPath);

const args = [
  '--no-owner',
  '--no-privileges',
  '--clean',
  '--if-exists',
  process.env.DATABASE_URL,
];

const proc = spawn('pg_dump', args, { stdio: ['ignore', 'pipe', 'inherit'] });

proc.stdout.pipe(outStream);

proc.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('pg_dump not found on PATH. Install Postgres client tools (e.g. `brew install libpq && brew link --force libpq`).');
  } else {
    console.error('pg_dump failed:', err.message);
  }
  fs.rmSync(outPath, { force: true });
  process.exit(1);
});

proc.on('exit', (code) => {
  if (code !== 0) {
    fs.rmSync(outPath, { force: true });
    console.error(`pg_dump exited with code ${code}`);
    process.exit(code ?? 1);
  }
  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`Wrote ${sizeKb} KB`);
  console.log(`→ ${path.relative(path.join(__dirname, '..'), outPath)}`);
  console.log('Restore with: psql "$DATABASE_URL" < ' + path.relative(path.join(__dirname, '..'), outPath));
});
