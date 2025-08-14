import axios from "axios";
import { API_URL } from "../../app/api/api.js";

export const Axios = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});
