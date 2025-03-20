import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  kelas, jadwal, tugas, materi, session,
} from '../../shared/utils/db.js';
import { sendWhatsappMessage } from '../../wa-bot/index.js';
import { decode, encode } from '../auth/index.js';

const router = express.Router();

// Middleware untuk autentikasi (contoh sederhana)
const authMiddleware = (req, res, next) => {
  const { token } = req.headers;
  if (token) {
    try {
      const { groupId } = decode(token);
      req.groupId = groupId;
      next();
    } catch (err) {
      res.status(403).json({ message: 'Token tidak valid' });
    }
  } else {
    res.status(403).json({ message: 'Token tidak ditemukan' });
  }
};

// Rate limiter untuk request OTP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // maksimal 5 request per windowMs
  message: 'Terlalu banyak permintaan OTP, coba lagi nanti',
});

// Session
router.post('/request-otp', otpLimiter, (req, res) => {
  const { groupId } = req.body;

  if (!groupId) {
    return res.status(400).json({ message: 'groupId diperlukan' });
  }

  const kelasData = kelas.data[groupId];
  if (!kelasData) {
    return res.status(404).json({ message: 'Kelas tidak ditemukan' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000);
  session.data[groupId] = {
    otp,
    otpExpiredAt: Date.now() + 5 * 60 * 1000,
  };
  session.write();
  sendWhatsappMessage(kelasData.admin, `*Kode OTP Anda:* ${otp}\n\nGunakan kode ini untuk verifikasi. Kode hanya berlaku selama *5 menit* dan hanya dapat digunakan satu kali.`);
  res.json({ message: 'Kode OTP telah dikirim' });
});

router.post('/verify-otp', (req, res) => {
  const { groupId, otp } = req.body;

  if (!groupId || !otp) {
    return res.status(400).json({ message: 'groupId dan otp diperlukan' });
  }

  if (session.data[groupId] && session.data[groupId].otp == otp && session.data[groupId].otpExpiredAt > Date.now()) {
    const token = encode({ groupId });
    delete session.data[groupId];
    session.write();

    res.json({ token });
  } else {
    res.status(403).json({ message: 'OTP tidak valid' });
  }
});

// Kelas
router.get('/kelas', (req, res) => {
  res.json(kelas.data);
});

// Jadwal
router.get('/jadwal', (req, res) => {
  res.json(jadwal.data);
});

router.post('/jadwal', authMiddleware, (req, res) => {
  const {
    groupId, hari, jam, mataKuliah, ruang,
  } = req.body;
  if (!jadwal.data[groupId]) {
    jadwal.data[groupId] = {};
  }
  if (!jadwal.data[groupId][hari]) {
    jadwal.data[groupId][hari] = [];
  }
  jadwal.data[groupId][hari].push({ jam, mataKuliah, ruang });
  jadwal.write();
  res.json({ message: 'Jadwal berhasil ditambahkan' });
});

router.put('/jadwal', authMiddleware, (req, res) => {
  const {
    groupId, hari, jam, mataKuliah, ruang,
  } = req.body;
  if (jadwal.data[groupId] && jadwal.data[groupId][hari]) {
    const jadwalItem = jadwal.data[groupId][hari].find((j) => j.jam === jam && j.mataKuliah === mataKuliah);
    if (jadwalItem) {
      jadwalItem.ruang = ruang;
      jadwal.write();
      res.json({ message: 'Jadwal berhasil diubah' });
    } else {
      res.status(404).json({ message: 'Jadwal tidak ditemukan' });
    }
  } else {
    res.status(404).json({ message: 'Jadwal tidak ditemukan' });
  }
});

router.delete('/jadwal', authMiddleware, (req, res) => {
  const {
    groupId, hari, jam, mataKuliah,
  } = req.body;
  if (jadwal.data[groupId] && jadwal.data[groupId][hari]) {
    jadwal.data[groupId][hari] = jadwal.data[groupId][hari].filter((j) => j.jam !== jam || j.mataKuliah !== mataKuliah);
    jadwal.write();
    res.json({ message: 'Jadwal berhasil dihapus' });
  } else {
    res.status(404).json({ message: 'Jadwal tidak ditemukan' });
  }
});

// Tugas
router.get('/tugas', (req, res) => {
  res.json(tugas.data);
});

router.post('/tugas', authMiddleware, (req, res) => {
  const {
    groupId, mataKuliah, judul, deadline,
  } = req.body;
  if (!tugas.data[groupId]) {
    tugas.data[groupId] = [];
  }
  tugas.data[groupId].push({ mataKuliah, judul, deadline });
  tugas.write();
  res.json({ message: 'Tugas berhasil ditambahkan' });
});

router.put('/tugas', authMiddleware, (req, res) => {
  const {
    groupId, mataKuliah, judul, deadline,
  } = req.body;
  if (tugas.data[groupId]) {
    const tugasItem = tugas.data[groupId].find((t) => t.mataKuliah === mataKuliah && t.judul === judul);
    if (tugasItem) {
      tugasItem.deadline = deadline;
      tugas.write();
      res.json({ message: 'Tugas berhasil diubah' });
    } else {
      res.status(404).json({ message: 'Tugas tidak ditemukan' });
    }
  } else {
    res.status(404).json({ message: 'Tugas tidak ditemukan' });
  }
});

router.delete('/tugas', authMiddleware, (req, res) => {
  const { groupId, mataKuliah, judul } = req.body;
  if (tugas.data[groupId]) {
    tugas.data[groupId] = tugas.data[groupId].filter((t) => t.mataKuliah !== mataKuliah || t.judul !== judul);
    tugas.write();
    res.json({ message: 'Tugas berhasil dihapus' });
  } else {
    res.status(404).json({ message: 'Tugas tidak ditemukan' });
  }
});

// Materi
router.get('/materi', (req, res) => {
  res.json(materi.data);
});

router.post('/materi', authMiddleware, (req, res) => {
  const {
    groupId, mataKuliah, judul, link,
  } = req.body;
  if (!materi.data[groupId]) {
    materi.data[groupId] = [];
  }
  materi.data[groupId].push({ mataKuliah, judul, link });
  materi.write();
  res.json({ message: 'Materi berhasil ditambahkan' });
});

router.put('/materi', authMiddleware, (req, res) => {
  const {
    groupId, mataKuliah, judul, link,
  } = req.body;
  if (materi.data[groupId]) {
    const materiItem = materi.data[groupId].find((m) => m.mataKuliah === mataKuliah && m.judul === judul);
    if (materiItem) {
      materiItem.link = link;
      materi.write();
      res.json({ message: 'Materi berhasil diubah' });
    } else {
      res.status(404).json({ message: 'Materi tidak ditemukan' });
    }
  } else {
    res.status(404).json({ message: 'Materi tidak ditemukan' });
  }
});

router.delete('/materi', authMiddleware, (req, res) => {
  const { groupId, mataKuliah, judul } = req.body;
  if (materi.data[groupId]) {
    materi.data[groupId] = materi.data[groupId].filter((m) => m.mataKuliah !== mataKuliah || m.judul !== judul);
    materi.write();
    res.json({ message: 'Materi berhasil dihapus' });
  } else {
    res.status(404).json({ message: 'Materi tidak ditemukan' });
  }
});

export default router;
