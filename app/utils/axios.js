import axios from "axios";
import { API_URL } from "../../app/api/api.js";

export const Axios = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    },
    // Untuk production deployment
    withCredentials: false, // Set true jika menggunakan HTTP-only cookies dari backend
    timeout: 10000 // 10 detik timeout
});

// Request interceptor untuk debugging
Axios.interceptors.request.use(
    (config) => {
        // Log untuk debugging di development
        if (process.env.NODE_ENV === 'development') {
            console.log('API Request:', config.baseURL + config.url);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor untuk error handling
Axios.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired atau tidak valid
            if (typeof window !== 'undefined') {
                // Clear cookie dan redirect ke login
                document.cookie = "authToken=; path=/; max-age=0";
                window.location.href = '/auth/login';
            }
        }
        return Promise.reject(error);
    }
);
