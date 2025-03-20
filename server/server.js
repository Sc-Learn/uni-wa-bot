import express from 'express';
import path from 'path';
import apiRoutes from './routes/api.js';
import {
  kelas, jadwal, tugas, materi,
} from '../shared/utils/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware untuk parsing JSON dan URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set folder public untuk file statis
app.use(express.static(path.join(process.cwd(), 'server/public')));

// Set view engine untuk EJS
app.set('views', path.join(process.cwd(), 'server/views'));
app.set('view engine', 'ejs');

// Gunakan rute API
app.use('/api', apiRoutes);

// Rute untuk halaman utama
app.get('/', (req, res) => {
  res.render('index');
});

// Rute untuk halaman pemilihan kelas
app.get('/kelas', (req, res) => {
  res.render('kelas', { kelas: kelas.data });
});

// Rute untuk halaman verifikasi OTP
app.get('/otp', (req, res) => {
  const { groupId } = req.query;
  res.render('otp', { groupId });
});

// Rute untuk halaman dashboard kelas
app.get('/dashboard', (req, res) => {
  const { groupId } = req.query;
  const kelasData = kelas.data[groupId];
  const jadwalData = jadwal.data[groupId] || {};
  let tugasData = tugas.data[groupId] || [];
  const materiData = materi.data[groupId] || [];

  const daysOrder = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
  const sortedJadwalData = {};

  daysOrder.forEach((day) => {
    if (jadwalData[day]) {
      sortedJadwalData[day] = jadwalData[day].sort((a, b) => {
        const [startA] = a.jam.split('-');
        const [startB] = b.jam.split('-');
        return startA.localeCompare(startB);
      });
    }
  });

  // Sort tugas by deadline
  tugasData = tugasData.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Add remaining days information
  tugasData = tugasData.map((t) => {
    const deadlineDate = new Date(t.deadline);
    const now = new Date();
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    let remainingDaysInfo = '';

    if (diffDays < 0) {
      remainingDaysInfo = '❌ Sudah lewat deadline!';
    } else if (diffDays === 1) {
      remainingDaysInfo = '⚠️ Tinggal 1 hari lagi!';
    } else if (diffDays <= 3) {
      remainingDaysInfo = `⏳ Tinggal ${diffDays} hari lagi`;
    } else {
      remainingDaysInfo = `📅 Tinggal ${diffDays} hari lagi`;
    }

    return {
      ...t,
      remainingDaysInfo,
    };
  });

  res.render('dashboard', {
    kelas: kelasData,
    jadwal: sortedJadwalData,
    tugas: tugasData,
    materi: materiData,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
