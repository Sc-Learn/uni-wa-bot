import { tugas } from '../utils/db.js';

const tambahTugas = async (groupId, mataKuliah, judul, deadline) => {
  tugas.data[groupId] = tugas.data[groupId] || [];
  tugas.data[groupId].push({ mataKuliah, judul, deadline });
  await tugas.write();
  return `Tugas "${judul}" untuk mata kuliah "${mataKuliah}" berhasil ditambahkan.`;
};

const hapusTugas = (groupId, mataKuliah, judul) => {
  if (!tugas.data[groupId]) {
    return "Tugas tidak ditemukan.";
  }
  tugas.data[groupId] = tugas.data[groupId].filter(t => t.mataKuliah !== mataKuliah || t.judul !== judul);
  tugas.write();
  return `Tugas ${judul} untuk mata kuliah ${mataKuliah} berhasil dihapus.`;
};

const getTugas = (groupId) => {
  if (!tugas.data[groupId] || tugas.data[groupId].length === 0) {
    return "Tidak ada tugas.";
  }
  return tugas.data[groupId].map(t => `${t.mataKuliah} - ${t.judul} (Deadline: ${t.deadline})`).join('\n');
};

export { tambahTugas, hapusTugas, getTugas };