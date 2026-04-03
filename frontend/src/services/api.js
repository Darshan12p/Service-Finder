import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// helper: check JWT format
const isJwt = (t) => typeof t === "string" && t.split(".").length === 3;

// helper: safely parse localStorage json
const safeParse = (value, fallback = null) => {
  try {
    return JSON.parse(value || "null") ?? fallback;
  } catch {
    return fallback;
  }
};

// AUTO ATTACH TOKEN
API.interceptors.request.use((config) => {
  const url = config.url || "";

  const isAdminRequest =
    url.startsWith("/admin") ||
    url.includes("/admin/") ||
    url.startsWith("/bookings/admin") ||
    url.includes("/bookings/admin/");

  const isPartnerRequest =
    url.startsWith("/bookings/partner") ||
    url.includes("/bookings/partner/") ||
    url.includes("/partner-accept") ||
    url.includes("/partner-reject");

  const user = safeParse(localStorage.getItem("user"), null);
  const admin = safeParse(localStorage.getItem("admin"), null);
  const partner = safeParse(localStorage.getItem("partner"), null);

  const rawUserToken =
    localStorage.getItem("token") ||
    localStorage.getItem("userToken") ||
    user?.token;

  const rawAdminToken =
    localStorage.getItem("adminToken") ||
    admin?.token;

  const rawPartnerToken =
    localStorage.getItem("partnerToken") ||
    partner?.token;

  const userToken = isJwt(rawUserToken) ? rawUserToken : "";
  const adminToken = isJwt(rawAdminToken) ? rawAdminToken : "";
  const partnerToken = isJwt(rawPartnerToken) ? rawPartnerToken : "";

  let tokenToUse = userToken;

  if (isAdminRequest) {
    tokenToUse = adminToken || userToken;
  } else if (isPartnerRequest) {
    tokenToUse = partnerToken || userToken;
  }

  config.headers = config.headers || {};
  if (tokenToUse) {
    config.headers.Authorization = `Bearer ${tokenToUse}`;
  }

  return config;
});

// ====================== AUTH / OTP ======================
export const sendOtpApi = (email) => API.post("/send-otp", { email });

export const verifyOtpApi = (email, otp, extra = {}) =>
  API.post("/verify-otp", { email, otp, ...extra });

// ====================== ADMIN DASHBOARD ======================
export const getDashboardSummaryApi = (params) =>
  API.get("/admin/dashboard/summary", { params });

// ====================== ADMIN BOOKINGS ======================
// IMPORTANT: these now match bookingRoutes.js
export const getBookingsApi = (params) =>
  API.get("/bookings/admin/all", { params });

export const updateBookingStatusApi = (bookingId, bookingStatus) =>
  API.put(`/bookings/admin/status/${bookingId}`, { bookingStatus });

export const deleteBookingApi = (bookingId) =>
  API.delete(`/bookings/admin/${bookingId}`);

export const getAssignablePartnersApi = (bookingId) =>
  API.get(`/bookings/admin/assignable-partners/${bookingId}`);

export const assignPartnerManuallyApi = (bookingId, partnerId) =>
  API.put(`/bookings/admin/assign/${bookingId}/${partnerId}`);

export const getAdminBookingsApi = getBookingsApi;
export const updateAdminBookingStatusApi = updateBookingStatusApi;
export const deleteAdminBookingApi = deleteBookingApi;

// optional if you still use this somewhere
export const adminCreateBookingApi = (payload) =>
  API.post("/bookings", payload);

// ====================== ADMIN SERVICES ======================
export const getServicesApi = (params) =>
  API.get("/admin/services", { params });

export const createServiceApi = (formData) =>
  API.post("/admin/services", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateServiceApi = (id, formData) =>
  API.put(`/admin/services/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const toggleServiceApi = (id) =>
  API.patch(`/admin/services/${id}/toggle`);

export const deleteServiceApi = (id) =>
  API.delete(`/admin/services/${id}`);

export const updateServicePopularityApi = (id, payload) =>
  API.patch(`/admin/services/${id}/popularity`, payload);

// ====================== ADMIN USERS ======================
export const getUsersApi = (params) =>
  API.get("/admin/users", { params });

export const toggleUserActiveApi = (id) =>
  API.patch(`/admin/users/${id}/toggle-active`);

export const changeUserRoleApi = (id, role) =>
  API.patch(`/admin/users/${id}/role`, { role });

export const updatePartnerSettingsApi = (id, payload) =>
  API.patch(`/admin/users/${id}/partner-settings`, payload);

// ====================== PUBLIC CATEGORIES ======================
export const getCategoriesApi = () =>
  API.get("/categories");

// ====================== ADMIN CATEGORIES ======================
export const adminGetCategoriesApi = () =>
  API.get("/admin/categories");

export const adminCreateCategoryApi = (formData) =>
  API.post("/admin/categories", formData);

export const adminUpdateCategoryApi = (id, formData) =>
  API.patch(`/admin/categories/${id}`, formData);

export const adminToggleCategoryApi = (id) =>
  API.patch(`/admin/categories/${id}/toggle`);

export const adminDeleteCategoryApi = (id) =>
  API.delete(`/admin/categories/${id}`);

// ====================== PUBLIC SERVICES ======================
export const getPublicServicesApi = (params = {}) =>
  API.get("/services", {
    params: {
      page: 1,
      limit: 500,
      ...params,
    },
  });

export const getPopularServicesApi = async ({ limit = 100 } = {}) => {
  const res = await API.get(`/services/popular?limit=${limit}`);
  return res.data;
};

export const getServicesByCategoryApi = (categoryId) =>
  API.get(`/services/by-category/${categoryId}`);

export const getServiceByIdApi = (id) =>
  API.get(`/services/${id}`);

// ====================== PACKAGES ======================
export const getPackagesByServiceApi = (serviceId) =>
  API.get(`/services/packages/service/${serviceId}`);

// ====================== USER BOOKINGS ======================
export const createBookingApi = (payload) =>
  API.post("/bookings", payload);

export const getPartnersForServiceBookingApi = (serviceId, params = {}) =>
  API.get(`/bookings/partners/by-service/${serviceId}`, { params });

export const getMyBookingsApi = (userId, tab = "upcoming") =>
  API.get(`/bookings/user/${userId}`, { params: { tab } });

export const getBookingByIdApi = (id) =>
  API.get(`/bookings/${id}`);

export const getUserBookingDetailsApi = (bookingId) =>
  API.get(`/bookings/${bookingId}/details`);

export const getBookingForRatingApi = (bookingId) =>
  API.get(`/reviews/booking/${bookingId}`);

// ====================== USER ADDRESSES ======================
export const getUserAddressesApi = (userId) =>
  API.get(`/addresses/${userId}`);

export const addUserAddressApi = (userId, addressObj) =>
  API.post(`/addresses/${userId}`, addressObj);

// ====================== CONTACT ======================
export const sendContactMessageApi = (payload) =>
  API.post("/contact", payload);

export const adminGetContactMessagesApi = (params) =>
  API.get("/admin/contact-messages", { params });

export const adminToggleContactMessageStatusApi = (id) =>
  API.patch(`/admin/contact-messages/${id}/toggle`);

export const adminDeleteContactMessageApi = (id) =>
  API.delete(`/admin/contact-messages/${id}`);

// ====================== JOIN-US ======================
export const submitJoinUsApi = (formData) =>
  API.post("/join-us", formData);

export const adminGetJoinInquiriesApi = (params) =>
  API.get("/admin/join-inquiries", { params });

export const adminUpdateJoinInquiryStatusApi = (id, payload) =>
  API.patch(`/admin/join-inquiries/${id}/status`, payload);

export const adminDeleteJoinInquiryApi = (id) =>
  API.delete(`/admin/join-inquiries/${id}`);

// ====================== OFFERS ======================
export const getActiveOffersApi = () =>
  API.get("/offers");

export const adminGetOffersApi = (params) =>
  API.get("/admin/offers", { params });

export const adminCreateOfferApi = (payload) =>
  API.post("/admin/offers", payload);

export const adminUpdateOfferApi = (id, payload) =>
  API.patch(`/admin/offers/${id}`, payload);

export const adminToggleOfferApi = (id) =>
  API.patch(`/admin/offers/${id}/toggle`);

export const adminDeleteOfferApi = (id) =>
  API.delete(`/admin/offers/${id}`);

export const adminAssignOfferServicesApi = (offerId, serviceIds = []) =>
  API.patch(`/admin/offers/${offerId}/services`, { serviceIds });

// ====================== USER PROFILE ======================
export const getMyProfileApi = (userId) =>
  API.get(`/users/me`, { params: { userId } });

export const updateMyProfileApi = (userId, payload) =>
  API.patch(`/users/me`, payload, { params: { userId } });

// ====================== REVIEWS (USER + PUBLIC) ======================
export const getReviewsByServiceApi = (serviceId) =>
  API.get(`/reviews/service/${serviceId}`);

export const getReviewsByPartnerApi = (partnerId) =>
  API.get(`/reviews/partner/${partnerId}`);

export const addOrUpdateReviewApi = (bookingId, payload) =>
  API.post(`/reviews/booking/${bookingId}`, payload);

export const getLatestReviewsApi = (limit = 3) =>
  API.get(`/reviews/latest?limit=${limit}`);

// ====================== REVIEWS (ADMIN) ======================
export const adminGetReviewsApi = (page = 1, limit = 20) =>
  API.get(`/admin/reviews?page=${page}&limit=${limit}`);

export const adminDeleteReviewApi = (id) =>
  API.delete(`/admin/reviews/${id}`);

// ====================== PARTNER BOOKINGS ======================
export const getPartnerBookingsApi = (tab = "all") =>
  API.get("/bookings/partner/my", { params: { tab } });

export const partnerAcceptBookingApi = (bookingId) =>
  API.patch(`/bookings/${bookingId}/partner-accept`);

export const partnerRejectBookingApi = (bookingId) =>
  API.patch(`/bookings/${bookingId}/partner-reject`);

// ====================== PAYMENT ======================
export const createRazorpayOrderApi = (bookingId) =>
  API.post("/payments/create-order", { bookingId });

export const verifyRazorpayPaymentApi = (payload) =>
  API.post("/payments/verify", payload);

export const markPaymentFailedApi = (bookingId) =>
  API.post("/payments/failed", { bookingId });


export const adminGetPaymentsApi = (params = {}) => {
  return API.get("/admin/payments", { params });
};

export const getPartnerReviewsApi = (partnerId) =>
  API.get(`/reviews/partner/${partnerId}`);

export const getAdminProfileApi = () =>
  API.get("/admin/profile/me");

export const updateAdminProfileApi = (payload) =>
  API.put("/admin/profile/me", payload);

export default API;

