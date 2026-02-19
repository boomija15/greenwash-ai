import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:8000", timeout: 30000 });

export const analyzeProduct  = (data) => api.post("/analyze", data);
export const analyzeLive     = (text) => api.post("/analyze-live", { text });
export const getSellerProfile= (company) => api.get(`/seller/${encodeURIComponent(company)}/profile`);
export const getEarlyAlerts  = () => api.get("/regulator/alerts");
export const getAllSubmissions= () => api.get("/regulator/submissions");
export const getPlatformStats= () => api.get("/regulator/stats");