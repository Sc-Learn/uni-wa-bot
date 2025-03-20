import { tugas } from '../../shared/utils/db.js';

const tambahTugas = async (groupId, mataKuliah, judul, deadline) => {
  tugas.data[groupId] = tugas.data[groupId] || [];
  tugas.data[groupId].push({ mataKuliah, judul, deadline });
  await tugas.write();
  return `✅ *Tugas berhasil ditambahkan!*\n\n📚 Mata Kuliah: *${mataKuliah}*\n📄 Judul: *${judul}*\n⏰ Deadline: *${deadline}*`;
};

const hapusTugas = (groupId, mataKuliah, judul) => {
  if (!tugas.data[groupId]) {
    return '❌ *Tugas tidak ditemukan.*';
  }
  tugas.data[groupId] = tugas.data[groupId].filter((t) => t.mataKuliah !== mataKuliah || t.judul !== judul);
  tugas.write();
  return `✅ *Tugas berhasil dihapus!*\n\n📚 Mata Kuliah: *${mataKuliah}*\n📄 Judul: *${judul}*`;
};

const getTugas = (groupId, mataKuliah) => {
  if (!tugas.data[groupId] || tugas.data[groupId].length === 0) {
    return '📭 *Tidak ada tugas.*';
  }

  if (mataKuliah) {
    const tugasKuliah = tugas.data[groupId]
      .filter((t) => t.mataKuliah === mataKuliah)
      .map((t) => `📚 *${t.mataKuliah}*\n📄 *${t.judul}*\n⏰ *Deadline: ${t.deadline}*`)
      .join('\n\n');
    return `📚 *Daftar Tugas untuk ${mataKuliah}*\n\n${tugasKuliah}`;
  }
  const semuaTugas = tugas.data[groupId]
    .map((t) => `📚 *${t.mataKuliah}*\n📄 *${t.judul}*\n⏰ *Deadline: ${t.deadline}*`)
    .join('\n\n');
  return `📚 *Daftar Semua Tugas*\n\n${semuaTugas}`;
};

export { tambahTugas, hapusTugas, getTugas };
