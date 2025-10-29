import axios from "axios";

const BASE = (process.env.REACT_APP_API_BASE || "http://localhost:8080")
  .replace(/\/+$/, "");

const api = axios.create({
  baseURL: BASE,          
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  // เคลียร์ header เดิม
  if (config.headers) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }

  if (!isFormData) {
    // กรณีส่ง JSON เท่านั้น 
    config.headers = {
      ...(config.headers || {}),
      "Content-Type": "application/json",
    };
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    console.error("[API ERROR]", status, data || error?.message);
    return Promise.reject(error);
  }
);

export default api;
