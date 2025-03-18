import pkg from 'whatsapp-web.js';
const { Client, LocalAuth, MessageMedia } = pkg;

console.log("Starting WhatsApp bot...");

import qrcode from 'qrcode-terminal';
import cron from 'node-cron';

console.log("Loading database...");
import { kelas, jadwal, tugas, materi, aktivitas } from './utils/db.js';

console.log("Loading handlers...");
import { registerKelas, updateKelas, unregisterKelas, infoKelas } from './handlers/kelasHandler.js';
import { tambahJadwal, hapusJadwal, getJadwal } from './handlers/jadwalHandler.js';
import { tambahTugas, hapusTugas, getTugas } from './handlers/tugasHandler.js';
import { uploadMateri, hapusMateri, getMateri } from './handlers/materiHandler.js';
import { updateAktivitas, getLeaderboard } from './handlers/gamifikasiHandler.js';
import { getQuote, getMeme } from './handlers/umumHandler.js';
import path from 'path';

console.log("Creating client...");
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: path.join(process.cwd(), '.wwebjs_auth')
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
  qrMaxRetries: 5,
  restartOnAuthFail: true
});

console.log("Setting up event handlers...");

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Bot is ready!');
});

client.on('message', async (msg) => {
  if (msg.fromMe) return;

  const chatId = msg.from; // ID Chat (group atau private)
  const isGroup = chatId.endsWith('@g.us');

  if (!isGroup) return;

  const text = msg.body;
  const groupId = msg.from;
  const sender = msg.author || msg.from;

  // Update aktivitas
  updateAktivitas(groupId, sender);

  // Handler untuk registrasi kelas
  if (text.startsWith('!register')) {
    const [, kelasName] = text.split(' ');

    if (!kelasName) {
      msg.reply('Format salah. Gunakan: !register <nama_kelas>');
      return;
    }

    const response = registerKelas(groupId, kelasName, sender);
    msg.reply(response);
  }

  if (text.startsWith('!update_kelas')) {
    const [, newKelasName] = text.split(' ');

    if (!newKelasName) {
      msg.reply('Format salah. Gunakan: !update_kelas <nama_kelas_baru>');
      return;
    }

    const response = updateKelas(groupId, newKelasName, sender);
    msg.reply(response);
  }

  if (text.startsWith('!info_kelas')) {
    const response = infoKelas(groupId);
    msg.reply(response);
  }

  if (text.startsWith('!unregister')) {
    const response = unregisterKelas(groupId, sender);
    msg.reply(response);
  }

  // Handler untuk jadwal kelas
  if (text.startsWith('!tambah_jadwal')) {
    const args = text.split('!tambah_jadwal ')[1]; // Ambil bagian setelah perintah
    const [hari, jam, mataKuliah, ruang] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'

    // Validasi argumen
    if (!hari || !jam || !mataKuliah || !ruang) {
      msg.reply('Format salah. Gunakan: !tambah_jadwal <hari> | <jam_awal>-<jam_akhir> | <mata_kuliah> | <ruang>');
      return;
    }

    // Pisahkan jam_awal dan jam_akhir
    const [jamAwal, jamAkhir] = jam.split('-');
    if (!jamAwal || !jamAkhir) {
      msg.reply('Format jam salah. Gunakan <jam_awal>:<jam_akhir> (contoh: 08:00-09:00)');
      return;
    }

    const response = await tambahJadwal(groupId, hari, `${jamAwal}-${jamAkhir}`, mataKuliah, ruang);
    msg.reply(response);
  }

  if (text.startsWith('!hapus_jadwal')) {
    const args = text.split('!hapus_jadwal ')[1]; // Ambil bagian setelah perintah
    const [hari, mataKuliah] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'
    const response = await hapusJadwal(groupId, hari, mataKuliah);
    msg.reply(response);
  }

  if (text.startsWith('!jadwal')) {
    const [, hari] = text.split(' ');
    const response = getJadwal(groupId, hari);
    msg.reply(response);
  }

  // Handler untuk tugas
  if (text.startsWith('!tambah_tugas')) {
    const args = text.split('!tambah_tugas ')[1]; // Ambil bagian setelah perintah
    const [mataKuliah, judul, deadline] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'
    
    if (!mataKuliah || !judul || !deadline) {
      msg.reply('Format salah. Gunakan: !tambah_tugas <mata_kuliah> | <judul> | <deadline>');
      return;
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      msg.reply('Format deadline salah. Gunakan format YYYY-MM-DD HH:mm (contoh: 2022-12-31 23:59)');
      return;
    }

    const response = await tambahTugas(groupId, mataKuliah, judul, deadline);
    msg.reply(response);
  }

  if (text.startsWith('!hapus_tugas')) {
    const args = text.split('!hapus_tugas ')[1]; // Ambil bagian setelah perintah
    const [mataKuliah, judul] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'

    if (!mataKuliah || !judul) {
      msg.reply('Format salah. Gunakan: !hapus_tugas <mata_kuliah> | <judul>');
      return;
    }

    const response = hapusTugas(groupId, mataKuliah, judul);
    msg.reply(response);
  }

  if (text.startsWith('!tugas')) {
    const [, mataKuliah] = text.split(' ');
    const response = getTugas(groupId, mataKuliah);
    msg.reply(response);
  }

  // Handler untuk materi
  if (text.startsWith('!upload_materi')) {
    const args = text.split('!upload_materi ')[1]; // Ambil bagian setelah perintah
    const [mataKuliah, judul, link] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'
    
    if (!mataKuliah || !judul || !link) {
      msg.reply('Format salah. Gunakan: !upload_materi <mata_kuliah> | <judul> | <link>');
      return;
    }

    const response = await uploadMateri(groupId, mataKuliah, judul, link);
    msg.reply(response);
  }

  if (text.startsWith('!hapus_materi')) {
    const args = text.split('!hapus_materi ')[1]; // Ambil bagian setelah perintah
    const [mataKuliah, judul] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'

    const response = hapusMateri(groupId, mataKuliah, judul);
    msg.reply(response);
  }

  if (text.startsWith('!materi')) {
    const [, mataKuliah] = text.split(' ');
    const response = getMateri(groupId, mataKuliah);
    msg.reply(response);
  }

  // Handler untuk gamifikasi
  if (text.startsWith('!leaderboard')) {
    const response = getLeaderboard(groupId);
    msg.reply(response);
  }

  if (text.startsWith('!quote')) {
    const response = await getQuote();
    msg.reply(response);
  }

  if (text.startsWith('!meme')) {
    const resp = await getMeme(); // Ambil URL meme dari API

    if (!resp.url) {
      return msg.reply('Maaf, tidak dapat mengambil meme saat ini. Coba lagi nanti.');
    }
    
    try {
      const media = await MessageMedia.fromUrl(resp.url);
      await client.sendMessage(groupId, media, { caption: resp.title ?? '😂 Meme untuk kelas!' });
    } catch (error) {
      console.error('Error sending meme:', error);
      return msg.reply('Maaf, gagal mengirim meme. Coba lagi nanti.');
    }
  }

  // Handler untuk fitur tambahan
  if (text.startsWith('!bantuan')) {
    const response = `
📋 *Daftar Perintah Bot* 📋

🎓 *Manajemen Kelas*:
- \`!register <kelas>\` ➡️ Mendaftarkan kelas.
- \`!update_kelas <kelas>\` ➡️ Mengubah nama kelas.
- \`!info_kelas <kelas>\` ➡️ Info kelas.
- \`!unregister\` ➡️ Menghapus kelas.

📅 *Manajemen Jadwal*:
- \`!tambah_jadwal <hari> | <jam> | <mata_kuliah> | <ruang>\` ➡️ Menambahkan jadwal.
- \`!hapus_jadwal <hari> | <mata_kuliah>\` ➡️ Menghapus jadwal.
- \`!jadwal <hari>\` ➡️ Menampilkan jadwal.

📚 *Manajemen Tugas*:
- \`!tambah_tugas <mata_kuliah> | <judul> | <deadline>\` ➡️ Menambahkan tugas.
- \`!hapus_tugas <mata_kuliah> | <judul>\` ➡️ Menghapus tugas.
- \`!tugas <mata_kuliah>\` ➡️ Menampilkan tugas.

📂 *Manajemen Materi*:
- \`!upload_materi <mata_kuliah> | <judul> | <link>\` ➡️ Mengupload materi.
- \`!hapus_materi <mata_kuliah> | <judul>\` ➡️ Menghapus materi.
- \`!materi <mata_kuliah>\` ➡️ Menampilkan materi.

🏆 *Gamifikasi*:
- \`!leaderboard\` ➡️ Menampilkan leaderboard.

💬 *Fitur Lainnya*:
- \`!quote\` ➡️ Menampilkan kutipan motivasi.
- \`!meme\` ➡️ Mengirimkan meme.
- \`!bantuan\` ➡️ Menampilkan daftar perintah.

🔧 *Mode Bot*:
- \`!mode_silent\` ➡️ Nonaktifkan notifikasi otomatis.
- \`!mode_aktif\` ➡️ Aktifkan notifikasi otomatis.

📌 *Catatan*:
- Gunakan tanda \`|\` untuk memisahkan argumen.
- Contoh: \`!tambah_jadwal Senin | 08:00-09:00 | Pemrograman Web | Lab 1\`
`;

    msg.reply(response);
  }

  if (text.startsWith('!mode_silent')) {
    // Implementasi mode silent (nonaktifkan notifikasi otomatis)
    msg.reply("Mode silent diaktifkan. Bot tidak akan mengirim notifikasi otomatis.");
  }

  if (text.startsWith('!mode_aktif')) {
    // Implementasi mode aktif (aktifkan notifikasi otomatis)
    msg.reply("Mode aktif diaktifkan. Bot akan mengirim notifikasi otomatis.");
  }
});

// Auto-reminder untuk jadwal kelas
cron.schedule('0 8 * * *', async () => {
  for (const groupId in jadwal.data) {
    const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
    if (jadwal.data[groupId] && jadwal.data[groupId][hariIni]) {
      const jadwalToday = jadwal.data[groupId][hariIni];
      if (jadwalToday.length > 0) {
        const jadwalText = jadwalToday.map(j => `${j.jam} - ${j.mataKuliah}`).join('\n');
        await client.sendMessage(groupId, `Pengingat jadwal hari ini:\n${jadwalText}`);
      }
    }
  }
});

// Auto-reminder untuk deadline tugas
cron.schedule('0 9 * * *', async () => {
  for (const groupId in tugas.data) {
    if (tugas.data[groupId]) {
      const tugasKelas = tugas.data[groupId];
      const deadlineMendekati = tugasKelas.filter((t) => {
        const deadline = new Date(t.deadline);
        const sekarang = new Date();
        return deadline - sekarang < 24 * 60 * 60 * 1000; // Deadline dalam 24 jam
      });

      if (deadlineMendekati.length > 0) { 
        const tugasText = deadlineMendekati.map(t => 
          `${t.mataKuliah} - ${t.judul} (Deadline: ${t.deadline})`).join('\n');
        await client.sendMessage(groupId, `Pengingat deadline tugas:\n${tugasText}`);
      }
    }
  }
});

console.log("Initializing client...");
client.initialize().catch(err => {
  console.error("Failed to initialize client:", err);
});