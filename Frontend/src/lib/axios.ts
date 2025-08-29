import axios from "axios";

// Get the API URL from environment variables
const API_URL = import.meta.env.VITE_PUBLIC_API_URL+"/api";

// Create axios instance with the API URL
const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export { axiosInstance };