import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';

console.log("Starting WhatsApp bot...");

console.log("Loading database...");
import { kelas, jadwal, tugas, materi, aktivitas } from './utils/db.js';

console.log("Loading handlers...");
import { registerKelas, updateKelas, unregisterKelas, infoKelas } from './handlers/kelasHandler.js';
import { tambahJadwal, hapusJadwal, getJadwal } from './handlers/jadwalHandler.js';
import { tambahTugas, hapusTugas, getTugas } from './handlers/tugasHandler.js';
import { uploadMateri, hapusMateri, getMateri } from './handlers/materiHandler.js';
import { updateAktivitas, getLeaderboard } from './handlers/gamifikasiHandler.js';
import { getQuote, getMeme } from './handlers/umumHandler.js';

// Create auth directory if it doesn't exist
const authFolder = path.join(process.cwd(), '.baileys_auth_info');
if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
    console.log('Created auth directory');
}

// start server
import { app } from './server.js';

// Function to start the bot
async function startBot() {
    // Authentication state
    const { state, saveCreds } = await useMultiFileAuthState('.baileys_auth_info');
    
    // Create WhatsApp socket
    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
        browser: ['Class Bot', 'Chrome', '104.0.0.0'],
    });
    
    // On credentials update - save credentials
    sock.ev.on('creds.update', saveCreds);
    
    // On connection update
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = 
                (lastDisconnect?.error instanceof Boom)? 
                lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut : 
                true;
            
            console.log('Connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            
            if (shouldReconnect) {
                startBot();
            }
        } else if (connection === 'open') {
            console.log('Bot is ready!');
            setupCronJobs(sock);
        }
    });
    
    // Handle incoming messages
    sock.ev.on('messages.upsert', async ({ messages }) => {
        for (const m of messages) {
            try {
                // Skip status messages and messages from self
                if (m.key.remoteJid === 'status@broadcast' || m.key.fromMe) continue;
                
                const isGroup = m.key.remoteJid.endsWith('@g.us');
                if (!isGroup) continue;
                
                // Get message content and other details
                const groupId = m.key.remoteJid;
                const sender = m.key.participant || m.key.remoteJid;
                const text = m.message?.conversation || 
                             m.message?.extendedTextMessage?.text || 
                             m.message?.imageMessage?.caption || 
                             '';
                
                if (!text) continue;
                
                console.log(`Received message: ${text} from ${sender} in ${groupId}`);
                
                // Update user activity
                updateAktivitas(groupId, sender);
                
                // Process commands
                await processCommand(sock, m, groupId, sender, text);
            } catch (error) {
                console.error('Error processing message:', error);
            }
        }
    });
}

// Process command from message
async function processCommand(sock, m, groupId, sender, text) {
    // Function to reply to a message
    const reply = async (response) => {
        await sock.sendMessage(m.key.remoteJid, { text: response }, { quoted: m });
    };

    // Handler untuk registrasi kelas
    if (text.startsWith('!register')) {
        const [, kelasName] = text.split(' ');

        if (!kelasName) {
            await reply('Format salah. Gunakan: !register <nama_kelas>');
            return;
        }

        const response = registerKelas(groupId, kelasName, sender);
        await reply(response);
    }

    else if (text.startsWith('!update_kelas')) {
        const [, newKelasName] = text.split(' ');

        if (!newKelasName) {
            await reply('Format salah. Gunakan: !update_kelas <nama_kelas_baru>');
            return;
        }

        const response = updateKelas(groupId, newKelasName, sender);
        await reply(response);
    }

    else if (text.startsWith('!info_kelas')) {
        const response = infoKelas(groupId);
        await reply(response);
    }

    else if (text.startsWith('!unregister')) {
        const response = unregisterKelas(groupId, sender);
        await reply(response);
    }

    // Handler untuk jadwal kelas
    else if (text.startsWith('!tambah_jadwal')) {
        const args = text.split('!tambah_jadwal ')[1]; // Ambil bagian setelah perintah
        if (!args) {
            await reply('Format salah. Gunakan: !tambah_jadwal <hari> | <jam_awal>-<jam_akhir> | <mata_kuliah> | <ruang>');
            return;
        }
        
        const [hari, jam, mataKuliah, ruang] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'

        // Validasi argumen
        if (!hari || !jam || !mataKuliah || !ruang) {
            await reply('Format salah. Gunakan: !tambah_jadwal <hari> | <jam_awal>-<jam_akhir> | <mata_kuliah> | <ruang>');
            return;
        }

        // Pisahkan jam_awal dan jam_akhir
        const [jamAwal, jamAkhir] = jam.split('-');
        if (!jamAwal || !jamAkhir) {
            await reply('Format jam salah. Gunakan <jam_awal>:<jam_akhir> (contoh: 08:00-09:00)');
            return;
        }

        const response = await tambahJadwal(groupId, hari.toLowerCase(), `${jamAwal}-${jamAkhir}`, mataKuliah, ruang);
        await reply(response);
    }

    else if (text.startsWith('!hapus_jadwal')) {
        const args = text.split('!hapus_jadwal ')[1]; // Ambil bagian setelah perintah
        if (!args) {
            await reply('Format salah. Gunakan: !hapus_jadwal <hari> | <mata_kuliah>');
            return;
        }
        
        const [hari, mataKuliah] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'
        const response = await hapusJadwal(groupId, hari.toLowerCase(), mataKuliah);
        await reply(response);
    }

    else if (text.startsWith('!jadwal')) {
        const [, hari] = text.split(' ');
        const response = getJadwal(groupId, hari);
        await reply(response);
    }

    // Handler untuk tugas
    else if (text.startsWith('!tambah_tugas')) {
        const args = text.split('!tambah_tugas ')[1]; // Ambil bagian setelah perintah
        if (!args) {
            await reply('Format salah. Gunakan: !tambah_tugas <mata_kuliah> | <judul> | <deadline>');
            return;
        }
        
        const [mataKuliah, judul, deadline] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'
        
        if (!mataKuliah || !judul || !deadline) {
            await reply('Format salah. Gunakan: !tambah_tugas <mata_kuliah> | <judul> | <deadline>');
            return;
        }

        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
            await reply('Format deadline salah. Gunakan format YYYY-MM-DD HH:mm (contoh: 2022-12-31 23:59)');
            return;
        }

        const response = await tambahTugas(groupId, mataKuliah, judul, deadline);
        await reply(response);
    }

    else if (text.startsWith('!hapus_tugas')) {
        const args = text.split('!hapus_tugas ')[1]; // Ambil bagian setelah perintah
        if (!args) {
            await reply('Format salah. Gunakan: !hapus_tugas <mata_kuliah> | <judul>');
            return;
        }
        
        const [mataKuliah, judul] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'

        if (!mataKuliah || !judul) {
            await reply('Format salah. Gunakan: !hapus_tugas <mata_kuliah> | <judul>');
            return;
        }

        const response = hapusTugas(groupId, mataKuliah, judul);
        await reply(response);
    }

    else if (text.startsWith('!tugas')) {
        const [, mataKuliah] = text.split(' ');
        const response = getTugas(groupId, mataKuliah);
        await reply(response);
    }

    // Handler untuk materi
    else if (text.startsWith('!upload_materi')) {
        const args = text.split('!upload_materi ')[1]; // Ambil bagian setelah perintah
        if (!args) {
            await reply('Format salah. Gunakan: !upload_materi <mata_kuliah> | <judul> | <link>');
            return;
        }
        
        const [mataKuliah, judul, link] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'
        
        if (!mataKuliah || !judul || !link) {
            await reply('Format salah. Gunakan: !upload_materi <mata_kuliah> | <judul> | <link>');
            return;
        }

        const response = await uploadMateri(groupId, mataKuliah, judul, link);
        await reply(response);
    }

    else if (text.startsWith('!hapus_materi')) {
        const args = text.split('!hapus_materi ')[1]; // Ambil bagian setelah perintah
        if (!args) {
            await reply('Format salah. Gunakan: !hapus_materi <mata_kuliah> | <judul>');
            return;
        }
        
        const [mataKuliah, judul] = args.split('|').map(arg => arg.trim()); // Pisahkan berdasarkan '|'

        const response = hapusMateri(groupId, mataKuliah, judul);
        await reply(response);
    }

    else if (text.startsWith('!materi')) {
        const [, mataKuliah] = text.split(' ');
        const response = getMateri(groupId, mataKuliah);
        await reply(response);
    }

    // Handler untuk gamifikasi
    else if (text.startsWith('!leaderboard')) {
        const response = getLeaderboard(groupId);
        await reply(response);
    }

    else if (text.startsWith('!quote')) {
        const response = await getQuote();
        await reply(response);
    }

    else if (text.startsWith('!meme')) {
        const resp = await getMeme(); // Ambil URL meme dari API

        if (!resp.url) {
            return await reply('Maaf, tidak dapat mengambil meme saat ini. Coba lagi nanti.');
        }
        
        try {
            await sock.sendMessage(
                groupId, 
                { 
                    image: { url: resp.url },
                    caption: resp.title ?? '😂 Meme untuk kelas!'
                }
            );
        } catch (error) {
            console.error('Error sending meme:', error);
            return await reply('Maaf, gagal mengirim meme. Coba lagi nanti.');
        }
    }

    // Handler untuk fitur tambahan
    else if (text.startsWith('!bantuan')) {
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
        await reply(response);
    }

    else if (text.startsWith('!mode_silent')) {
        // Implementasi mode silent (nonaktifkan notifikasi otomatis)
        await reply("Mode silent diaktifkan. Bot tidak akan mengirim notifikasi otomatis.");
    }

    else if (text.startsWith('!mode_aktif')) {
        // Implementasi mode aktif (aktifkan notifikasi otomatis)
        await reply("Mode aktif diaktifkan. Bot akan mengirim notifikasi otomatis.");
    }
}

// Set up cron jobs for auto reminders
function setupCronJobs(sock) {
	// Reminder setiap jam 7 pagi untuk jadwal dan tugas hari ini
	cron.schedule('0 7 * * *', async () => {
		const hariIni = new Date().toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
	
		for (const groupId in jadwal.data) {
			if (jadwal.data[groupId] && jadwal.data[groupId][hariIni]) {
					const jadwalToday = jadwal.data[groupId][hariIni];
					if (jadwalToday.length > 0) {
					const jadwalText = jadwalToday
							.map(j => `🕒 *${j.jam}* - 📚 *${j.mataKuliah}*${j.ruang ? ` (📍 *${j.ruang}*)` : ''}`)
							.join('\n');

					await sock.sendMessage(groupId, { 
							text: `📅 *Pengingat Jadwal Hari Ini* 📅\n\n${jadwalText}`
					});
				}
			}
		}

		for (const groupId in tugas.data) {
			if (tugas.data[groupId] && tugas.data[groupId].length > 0) {
				const tugasAktif = tugas.data[groupId].filter(t => {
					const deadline = new Date(t.deadline);
					const sekarang = new Date();
					return deadline > sekarang; // Hanya tugas yang belum lewat deadline
				});
	
				if (tugasAktif.length > 0) {
					const tugasText = tugasAktif
						.map(t => `📚 *${t.mataKuliah}*\n📄 *${t.judul}*\n⏰ *Deadline: ${t.deadline}*`)
						.join('\n\n');

					await sock.sendMessage(groupId, {
						text: `📅 *Pengingat Tugas Aktif* 📅\n\n${tugasText}`
					});
				}
			}
		}
	});

	// Reminder X minutes sebelum jadwal dimulai dan tugas berakhir
	cron.schedule('*/5 * * * *', async () => {
		const sekarang = new Date();
		const hariIni = sekarang.toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();

		for (const groupId in jadwal.data) {
			if (jadwal.data[groupId] && jadwal.data[groupId][hariIni]) {
				const jadwalToday = jadwal.data[groupId][hariIni];
				for (const j of jadwalToday) {
					const [jamMulai] = j.jam.split('-');
					const waktuMulai = new Date();
					const [jam, menit] = jamMulai.split(':');
					waktuMulai.setHours(parseInt(jam), parseInt(menit), 0, 0);

					// Hitung selisih waktu dalam menit
					const selisihMenit = (waktuMulai - sekarang) / (1000 * 60);

					// Jika sisa 30 menit, kirim reminder
					if (selisihMenit > 0 && selisihMenit <= 30) {
						const pesanReminder = `⏰ *Pengingat 30 Menit Sebelum Kelas* ⏰\n\n📚 *${j.mataKuliah}*\n🕒 *${j.jam}*${j.ruang ? `\n📍 *${j.ruang}*` : ''}`;
						
						await sock.sendMessage(groupId, { text: pesanReminder});
					}
				}
			}
		}

  for (const groupId in tugas.data) {
    if (tugas.data[groupId] && tugas.data[groupId].length > 0) {
      for (const t of tugas.data[groupId]) {
        const deadline = new Date(t.deadline);
        const selisihJam = (deadline - sekarang) / (1000 * 60 * 60); // Selisih dalam jam

        // Kirim reminder jika sisa waktu 24 jam, 12 jam, atau 1 jam
        if (selisihJam > 0 && selisihJam <= 24) {
          let pesanReminder = '';
          if (selisihJam <= 1) {
            pesanReminder = `⏰ *Pengingat 1 Jam Sebelum Deadline* ⏰\n\n📚 *${t.mataKuliah}*\n📄 *${t.judul}*\n⏰ *Deadline: ${t.deadline}*`;
          } else if (selisihJam <= 12) {
            pesanReminder = `⏰ *Pengingat 12 Jam Sebelum Deadline* ⏰\n\n📚 *${t.mataKuliah}*\n📄 *${t.judul}*\n⏰ *Deadline: ${t.deadline}*`;
          } else if (selisihJam <= 24) {
            pesanReminder = `⏰ *Pengingat 24 Jam Sebelum Deadline* ⏰\n\n📚 *${t.mataKuliah}*\n📄 *${t.judul}*\n⏰ *Deadline: ${t.deadline}*`;
          }

          if (pesanReminder) {
            await sendReminder(groupId, pesanReminder);
          }
        }
      }
    }
  }
	});
}

// Start the bot
console.log("Starting bot...");
startBot();