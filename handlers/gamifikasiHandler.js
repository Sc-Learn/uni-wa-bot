import { aktivitas } from '../utils/db.js';

const updateAktivitas = (groupId, userId) => {
  if (!aktivitas.data[groupId]) {
    aktivitas.data[groupId] = {};
  }
  if (!aktivitas.data[groupId][userId]) {
    aktivitas.data[groupId][userId] = 1;
  } else {
    aktivitas.data[groupId][userId] += 1;
  }
  aktivitas.write();
  return `Aktivitas ${userId} tercatat.`;
};

const getLeaderboard = (groupId) => {
  if (!aktivitas.data[groupId] || Object.keys(aktivitas.data[groupId]).length === 0) {
    return "Belum ada data aktivitas untuk grup ini.";
  }
  const sorted = Object.entries(aktivitas.data[groupId])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  if (sorted.length === 0) {
    return "Belum ada data aktivitas untuk grup ini.";
  }
  return "🏆 LEADERBOARD 🏆\n\n" +
    sorted.map(([user, score], index) => `${index + 1}. ${user.split('@')[0]}: ${score} poin`).join('\n');
};

export { updateAktivitas, getLeaderboard };