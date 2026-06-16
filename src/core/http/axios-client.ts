import axios from "axios";
import { env } from "@/core/config/env";

export const axiosClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error),
);
