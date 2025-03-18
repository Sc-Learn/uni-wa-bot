import { kelas } from '../utils/db.js';
import { isAdmin } from '../utils/helper.js';

const registerKelas = (groupId, kelasName, adminId) => {
  if (kelas.data[groupId]) {
    return `❌ *Grup ini sudah terdaftar dalam kelas "${kelas.data[groupId].nama}".*`;
  }

  kelas.data[groupId] = { nama: kelasName, admin: adminId };
  kelas.write();
  return `✅ *Kelas berhasil terdaftar!*\n\n📚 Nama Kelas: *${kelasName}*\n👤 Admin: *${adminId.split('@')[0]}*`;
};

const updateKelas = (groupId, newKelasName, userId) => {
  // Check if the kelas exists
  if (!kelas.data[groupId]) {
    return "❌ *Kelas belum terdaftar.*";
  }

  // Check if the user is admin
  if (!isAdmin(groupId, userId)) {
    return "❌ *Hanya admin yang bisa mengubah nama kelas.*";
  }
  
  // Update the kelas name
  kelas.data[groupId].nama = newKelasName;
  kelas.write();
  
  return `✅ *Nama kelas berhasil diubah!*\n\n📚 Nama Baru: *${newKelasName}*`;
};

const unregisterKelas = (groupId, userId) => {
  // Check if the kelas exists
  if (!kelas.data[groupId]) {
    return "❌ *Kelas belum terdaftar.*";
  }

  // Check if the user is admin
  if (!isAdmin(groupId, userId)) {
    return "❌ *Hanya admin yang bisa menghapus kelas.*";
  }
  
  // Delete the kelas
  const namaKelas = kelas.data[groupId].nama;
  delete kelas.data[groupId];
  kelas.write();
  
  return `✅ *Kelas berhasil dihapus!*\n\n📚 Nama Kelas: *${namaKelas}*`;
};

const infoKelas = (groupId) => {
  // Check if the kelas exists
  if (!kelas.data[groupId]) {
    return "❌ *Kelas belum terdaftar.*";
  }
  
  // Get the kelas info
  const namaKelas = kelas.data[groupId].nama;
  const adminKelas = kelas.data[groupId].admin.split('@')[0];
  
  return `📚 *Informasi Kelas*\n\n📚 Nama Kelas: *${namaKelas}*\n👤 Admin: *${adminKelas}*`;
};

export { registerKelas, updateKelas, unregisterKelas, infoKelas };