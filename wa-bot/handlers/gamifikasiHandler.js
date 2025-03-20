import { aktivitas } from '../../shared/utils/db.js';

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
};

const getLeaderboard = (groupId) => {
  if (
    !aktivitas.data[groupId]
    || Object.keys(aktivitas.data[groupId]).length === 0
  ) {
    return '📭 *Belum ada data aktivitas untuk grup ini.*';
  }

  const sorted = Object.entries(aktivitas.data[groupId])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sorted.length === 0) {
    return '📭 *Belum ada data aktivitas untuk grup ini.*';
  }

  return `🏆 *LEADERBOARD* 🏆\n\n${sorted
    .map(([user, score], index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🔹';
      return `${medal} *${index + 1}.* ${user.split('@')[0]}: *${score} pesan*`;
    })
    .join('\n')}`;
};

export { updateAktivitas, getLeaderboard };
