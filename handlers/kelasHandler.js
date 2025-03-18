import { kelas } from '../utils/db.js';

const registerKelas = (groupId, kelasName, adminId) => {
  // Initialize or update the kelas data
  kelas.data[groupId] = { nama: kelasName, admin: adminId };
  kelas.write();
  return `Kelas ${kelasName} berhasil terdaftar!`;
};

const updateKelas = (groupId, newKelasName) => {
  // Check if the kelas exists
  if (!kelas.data[groupId]) {
    return "Kelas belum terdaftar.";
  }
  
  // Update the kelas name
  kelas.data[groupId].nama = newKelasName;
  kelas.write();
  
  return `Nama kelas berhasil diubah menjadi ${newKelasName}`;
};

const unregisterKelas = (groupId) => {
  // Check if the kelas exists
  if (!kelas.data[groupId]) {
    return "Kelas belum terdaftar.";
  }
  
  // Delete the kelas
  delete kelas.data[groupId];
  kelas.write();
  
  return `Kelas berhasil dihapus dari sistem.`;
};

export { registerKelas, updateKelas, unregisterKelas };