import { materi } from '../../shared/utils/db.js';

const uploadMateri = async (groupId, mataKuliah, judul, link) => {
  materi.data[groupId] = materi.data[groupId] || [];
  materi.data[groupId].push({ mataKuliah, judul, link });
  await materi.write();
  return `✅ *Materi berhasil diupload!*\n\n📚 Mata Kuliah: *${mataKuliah}*\n📄 Judul: *${judul}*\n🔗 Link: *${link}*`;
};

const hapusMateri = (groupId, mataKuliah, judul) => {
  if (!materi.data[groupId]) {
    return '❌ *Materi tidak ditemukan.*';
  }
  materi.data[groupId] = materi.data[groupId].filter((m) => m.mataKuliah !== mataKuliah || m.judul !== judul);
  materi.write();
  return `✅ *Materi berhasil dihapus!*\n\n📚 Mata Kuliah: *${mataKuliah}*\n📄 Judul: *${judul}*`;
};

const getMateri = (groupId, mataKuliah) => {
  if (!materi.data[groupId] || materi.data[groupId].length === 0) {
    return '📭 *Tidak ada materi.*';
  }

  if (mataKuliah) {
    const materiKuliah = materi.data[groupId]
      .filter((m) => m.mataKuliah === mataKuliah)
      .map((m) => `📚 *${m.mataKuliah}*\n📄 *${m.judul}*\n🔗 *${m.link}*`)
      .join('\n\n');
    return `📚 *Daftar Materi untuk ${mataKuliah}*\n\n${materiKuliah}`;
  }

  const semuaMateri = materi.data[groupId]
    .map((m) => `📚 *${m.mataKuliah}*\n📄 *${m.judul}*\n🔗 *${m.link}*`)
    .join('\n\n');
  return `📚 *Daftar Semua Materi*\n\n${semuaMateri}`;
};

export { uploadMateri, hapusMateri, getMateri };
