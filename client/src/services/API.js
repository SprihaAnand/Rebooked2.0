import axios from "axios";
import { attachCsrfHeader } from "../utils/csrf";

// Keep the API origin configurable for local development and deployment. Cookies
// carry authentication, so no token is persisted in browser storage.
const configuredBaseUrl =
  process.env.REACT_APP_API_URL || process.env.REACT_APP_BASEURL || "/api/v1";

const API = axios.create({
  baseURL: configuredBaseUrl.trim().replace(/\/$/, ""),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use(attachCsrfHeader);

export const getErrorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  const responseData = error?.response?.data;
  if (typeof responseData === "string") return responseData;
  if (responseData?.message) return responseData.message;
  if (responseData?.error?.message) return responseData.error.message;
  return error?.message || fallback;
};

export default API;
