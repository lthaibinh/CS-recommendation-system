// utils/axios.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";


// Create an Axios instance
export const axiosInstance: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, // Set the base URL for your API
});

