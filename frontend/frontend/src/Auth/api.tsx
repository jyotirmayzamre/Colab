import axios from 'axios';

//API for protected routes that handles token attachment

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
});


let onTokenRefresh: ((access: string, refresh: string) => void) | null = null;
let onLogout: (() => void) | null = null

export const registerTokenRefreshHandler = (fn: typeof onTokenRefresh) => {
    onTokenRefresh = fn;
}

export const logoutHandler = (fn: typeof onLogout) => {
    onLogout = fn;
}

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if(token){
            config.headers.Authorization = `Bearer ${token}`
        }
        return config;
    },
    (error) => {
        return Promise.reject(error)
    }
)

api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if(error.response.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;
            try {
                const rT = localStorage.getItem('refreshToken');
                const response = await axios.post('http://localhost:8000/api/accounts/token/refresh/', {
                    rT
                });
                const { accessToken, refreshToken } = response.data;
                onTokenRefresh?.(accessToken, refreshToken);

                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
                return api(originalRequest);

            } catch(refreshError){
                console.error('Token refresh failed:', refreshError);
                onLogout?.();
                window.location.href = '/auth/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
)

export default api;