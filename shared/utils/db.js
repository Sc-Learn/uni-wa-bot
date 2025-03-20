import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import fs from 'fs';
import path from 'path';

// Create database directory if it doesn't exist
const dbDir = path.join(process.cwd(), 'shared/database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Created database directory');
}

// Inisialisasi database dengan path absolut
const kelasDB = new JSONFile(path.join(dbDir, 'kelas.json'));
const jadwalDB = new JSONFile(path.join(dbDir, 'jadwal.json'));
const tugasDB = new JSONFile(path.join(dbDir, 'tugas.json'));
const materiDB = new JSONFile(path.join(dbDir, 'materi.json'));
const aktivitasDB = new JSONFile(path.join(dbDir, 'aktivitas.json'));
const sessionDB = new JSONFile(path.join(dbDir, 'session.json'));

// Initialize default data for each database
const defaultData = {
  kelas: {},
  jadwal: {},
  tugas: {},
  materi: {},
  aktivitas: {},
  session: {},
};

// Buat instance LowDB untuk setiap database dengan default data
export const kelas = new Low(kelasDB, defaultData.kelas);
export const jadwal = new Low(jadwalDB, defaultData.jadwal);
export const tugas = new Low(tugasDB, defaultData.tugas);
export const materi = new Low(materiDB, defaultData.materi);
export const aktivitas = new Low(aktivitasDB, defaultData.aktivitas);
export const session = new Low(sessionDB, defaultData.session);

// Fungsi untuk inisialisasi database
const initializeDB = async () => {
  try {
    // Baca data dari file (jika ada) atau gunakan default data
    await Promise.all([
      kelas.read().catch(() => console.log('Creating new kelas database')),
      jadwal.read().catch(() => console.log('Creating new jadwal database')),
      tugas.read().catch(() => console.log('Creating new tugas database')),
      materi.read().catch(() => console.log('Creating new materi database')),
      aktivitas.read().catch(() => console.log('Creating new aktivitas database')),
      session.read().catch(() => console.log('Creating new session database')),
    ]);

    // Ensure data exists
    kelas.data = kelas.data || {};
    jadwal.data = jadwal.data || {};
    tugas.data = tugas.data || {};
    materi.data = materi.data || {};
    aktivitas.data = aktivitas.data || {};
    session.data = session.data || {};

    // Write data to files
    await Promise.all([
      kelas.write(),
      jadwal.write(),
      tugas.write(),
      materi.write(),
      aktivitas.write(),
      session.write(),
    ]);

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// Run initialization
initializeDB();
