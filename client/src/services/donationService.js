import API from "./API";

const dataOf = (response) => response?.data || {};

export const listDonations = async (filters = {}) => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== "" && value != null)
  );
  return dataOf(await API.get("/donations", { params }));
};

export const getDonation = async (id) => dataOf(await API.get(`/donations/${id}`));
export const getMyDonations = async () => dataOf(await API.get("/donations/mine"));
export const createDonation = async (payload) => dataOf(await API.post("/donations", payload));
export const updateDonation = async (id, payload) =>
  dataOf(await API.patch(`/donations/${id}`, payload));
export const withdrawDonation = async (id) => dataOf(await API.delete(`/donations/${id}`));

export const claimDonation = async (donationId, quantity) =>
  dataOf(await API.post(`/donations/${donationId}/claim`, { quantity }));
export const getMyClaims = async () => dataOf(await API.get("/donations/claims/mine"));
export const getIncomingClaims = async () => dataOf(await API.get("/donations/incoming-claims"));
export const markClaimCollected = async (claimId) =>
  dataOf(await API.patch(`/donations/claims/${claimId}/collect`));
export const cancelClaim = async (claimId) =>
  dataOf(await API.post(`/donations/claims/${claimId}/cancel`));

export const getDashboard = async () => dataOf(await API.get("/dashboard"));
export const getNotifications = async () => dataOf(await API.get("/notifications"));
export const markNotificationsRead = async () => dataOf(await API.patch("/notifications/read-all"));

export const getAdminOverview = async () => dataOf(await API.get("/admin/overview"));
export const getAdminUsers = async () => dataOf(await API.get("/admin/users"));
export const getAdminDonations = async () => dataOf(await API.get("/admin/donations"));
