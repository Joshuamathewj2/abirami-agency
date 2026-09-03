import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const dbUrl = `postgresql://postgres:vD%3FKGhr5mHn_i%2B%25@db.cozhkqjlpqeapiylksnm.supabase.co:5432/postgres`;

const migrations = [
  '20260619035810',
  '20260620120000',
  '20260803131000',
  '20260803201700',
  '20260822120000',
  '20260825204642',
  '20260831201500'
];

console.log('Starting migration repair to mark previous migrations as applied...');

for (const m of migrations) {
  try {
    console.log(`Repairing status for migration ${m}...`);
    const cmd = `npx supabase migration repair --status applied ${m} --db-url "${dbUrl}"`;
    execSync(cmd, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Failed to repair migration ${m}:`, error.message);
  }
}

console.log('Migration repair completed.');
