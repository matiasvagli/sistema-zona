import axios from "axios";

const axiosInstance = axios.create();

axiosInstance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry && typeof window !== "undefined") {
            originalRequest._retry = true;
            const refreshToken = localStorage.getItem("refresh_token");
            if (refreshToken) {
                try {
                    const { data } = await axios.post("http://localhost:8000/api/v1/auth/token/refresh/", {
                        refresh: refreshToken,
                    });
                    localStorage.setItem("access_token", data.access);
                    return axiosInstance(originalRequest);
                } catch (refreshError) {
                    localStorage.removeItem("access_token");
                    localStorage.removeItem("refresh_token");
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);

export { axiosInstance };
