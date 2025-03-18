import { materi } from '../utils/db.js';

const uploadMateri = async (groupId, mataKuliah, judul, link) => {
  materi.data[groupId] = materi.data[groupId] || [];
  materi.data[groupId].push({ mataKuliah, judul, link });
  await materi.write();
  return `Materi "${judul}" untuk mata kuliah "${mataKuliah}" berhasil diupload.`;
};

const hapusMateri = (groupId, mataKuliah, judul) => {
  if (!materi.data[groupId]) {
    return "Materi tidak ditemukan.";
  }
  materi.data[groupId] = materi.data[groupId].filter(m => m.mataKuliah !== mataKuliah || m.judul !== judul);
  materi.write();
  return `Materi ${judul} untuk mata kuliah ${mataKuliah} berhasil dihapus.`;
};

const getMateri = (groupId) => {
  if (!materi.data[groupId] || materi.data[groupId].length === 0) {
    return "Tidak ada materi.";
  }
  return materi.data[groupId].map(m => `${m.mataKuliah} - ${m.judul} (Link: ${m.link})`).join('\n');
};

export { uploadMateri, hapusMateri, getMateri };