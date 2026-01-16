import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080",
});

export const analyzeWebsite = (url) => {
  return API.post("/analyze", { url });
};
