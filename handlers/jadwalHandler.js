import { jadwal as jadwalDB } from '../utils/db.js';

  const tambahJadwal = (groupId, hari, jam, mataKuliah, ruang) => {
    if (!jadwalDB.data[groupId]) {
      jadwalDB.data[groupId] = {};
    }
    if (!jadwalDB.data[groupId][hari]) {
      jadwalDB.data[groupId][hari] = [];
    }
    jadwalDB.data[groupId][hari].push({ jam, mataKuliah, ruang });
    jadwalDB.write();
    return `✅ *Jadwal berhasil ditambahkan!*\n\n📅 Hari: *${hari}*\n🕒 Jam: *${jam}*\n📚 Mata Kuliah: *${mataKuliah}*\n📍 Ruang: *${ruang}*`;
  };

  const hapusJadwal = async (groupId, hari, mataKuliah) => {
    const jadwal = jadwalDB.data[groupId];
  
    if (jadwal) {
      if (jadwal[hari]) {
        jadwal[hari] = jadwal[hari].filter(
          (j) => j.mataKuliah !== mataKuliah
        );
        if (jadwal[hari].length === 0) {
          delete jadwal[hari];
        }
        await jadwalDB.write();
        return `🗑️ *Jadwal berhasil dihapus!*\n\n📅 Hari: *${hari}*\n📚 Mata Kuliah: *${mataKuliah}*`;
      }
    }
    return '❌ *Tidak ada jadwal untuk dihapus.*';
  };

  const getJadwal = (groupId, hari) => {
    if (!jadwalDB.data[groupId] || Object.keys(jadwalDB.data[groupId]).length === 0) {
      return "📭 *Tidak ada jadwal.*";
    }
  
    if (!hari) {
      const hariUrutan = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
      let allJadwal = ["📅 *Jadwal Mingguan* 📅\n"];
      
      for (let h of hariUrutan) {
        if (jadwalDB.data[groupId][h]) {
          allJadwal.push(`\n📅 *${h.toUpperCase()}*:`);
          const sortedJadwal = jadwalDB.data[groupId][h].sort((a, b) => a.jam.split('-')[0].localeCompare(b.jam.split('-')[0]));
          allJadwal = allJadwal.concat(sortedJadwal.map(j => `  🕒 *${j.jam}* - 📚 *${j.mataKuliah}* (📍 *${j.ruang}*)`));
        }
      }
      return allJadwal.join('\n');
    }
  
    if (!jadwalDB.data[groupId][hari]) {
      return `📭 *Tidak ada jadwal untuk hari ${hari}.*`;
    }
  
    const sortedJadwal = jadwalDB.data[groupId][hari].sort((a, b) => a.jam.split('-')[0].localeCompare(b.jam.split('-')[0]));
    return (
      `📅 *Jadwal ${hari.toUpperCase()}* 📅\n\n` +
      sortedJadwal.map(j => `🕒 *${j.jam}* - 📚 *${j.mataKuliah}* (📍 *${j.ruang}*)`).join('\n')
    );
  };  

export { tambahJadwal, hapusJadwal, getJadwal };