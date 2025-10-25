import axios from 'axios';

//API for protected routes that handles token attachment

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL, 
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});


let isRefreshing = false;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: any) => void; }[] = [];

const processQueue = (error: unknown, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};


api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;
        if(error.response.status === 401 && !originalRequest._retry){

            if(isRefreshing){
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch(err => Promise.reject(err))
            }

            originalRequest._retry = true;
            isRefreshing = true;
    
            try {
               
                await axios.post(`${import.meta.env.VITE_API_URL}/api/accounts/token/refresh/`, {}, {withCredentials: true});
                processQueue(null);
                isRefreshing = false;
                return api(originalRequest);

            } catch(refreshError){
                processQueue(refreshError, null);
                isRefreshing = false;
                window.dispatchEvent(new Event('auth:logout'));
                return Promise.reject(refreshError);
            } 
        }
        return Promise.reject(error);
    }
)

export default api;