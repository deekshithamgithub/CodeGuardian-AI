
// import axios from "axios";

// const API = axios.create({
//   baseURL: "http://localhost:5000/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// export default api;


// Attach JWT token to requests when available
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Generate an AI code fix
export const generateCodeFix = async (code, issue) => {
  const response = await API.post("/fixes", {
    code,
    issue,
  });

  return response.data;
};

export default API;
