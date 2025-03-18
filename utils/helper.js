import { kelas as kelasDB } from "./db.js";

// check is user admin
export const isAdmin = (groupId, userId) => {
  return kelasDB.data[groupId].admin === userId;
}