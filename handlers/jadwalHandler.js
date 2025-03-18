import { jadwal } from '../utils/db.js';

const tambahJadwal = (groupId, hari, jam, mataKuliah) => {
  if (!jadwal.data[groupId]) {
    jadwal.data[groupId] = {};
  }
  if (!jadwal.data[groupId][hari]) {
    jadwal.data[groupId][hari] = [];
  }
  jadwal.data[groupId][hari].push({ jam, mataKuliah });
  jadwal.write();
  return `Jadwal ${mataKuliah} pada hari ${hari} jam ${jam} berhasil ditambahkan.`;
};

const hapusJadwal = async (groupId, hari, mataKuliah) => {
  console.log(groupId, hari, mataKuliah);
  if (jadwal.data[groupId]) {
    if (jadwal.data[groupId][hari]) {
      jadwal.data[groupId][hari] = jadwal.data[groupId][hari].filter(
        (j) => j.mataKuliah !== mataKuliah
      );
      if (jadwal.data[groupId][hari].length === 0) {
        delete jadwal.data[groupId][hari];
      }
      await jadwal.write();
      return `Jadwal "${mataKuliah}" pada hari ${hari} berhasil dihapus.`;
    }
  }
  return 'Tidak ada jadwal untuk dihapus.';
};

const getJadwal = (groupId, hari) => {
  if (!jadwal.data[groupId] || Object.keys(jadwal.data[groupId]).length === 0) {
    return "Tidak ada jadwal.";
  }

  if (!hari) {
    const hariUrutan = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    let allJadwal = [];
    
    for (let h of hariUrutan) {
      if (jadwal.data[groupId][h]) {
        allJadwal.push(`${h}:`);
        const sortedJadwal = jadwal.data[groupId][h].sort((a, b) => a.jam.split('-')[0].localeCompare(b.jam.split('-')[0]));
        allJadwal = allJadwal.concat(sortedJadwal.map(j => `  ${j.jam} - ${j.mataKuliah}`));
      }
    }
    return allJadwal.join('\n');
  }

  if (!jadwal.data[groupId][hari]) {
    return "Tidak ada jadwal untuk hari ini.";
  }

  const sortedJadwal = jadwal.data[groupId][hari].sort((a, b) => a.jam.split('-')[0].localeCompare(b.jam.split('-')[0]));
  return sortedJadwal.map(j => `${j.jam} - ${j.mataKuliah}`).join('\n');
};

export { tambahJadwal, hapusJadwal, getJadwal };