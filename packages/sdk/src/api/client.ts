import axios, { AxiosInstance } from 'axios';

let apiURL = 'http://localhost:4000';
let tokenFetcher: (() => Promise<string | null>) | null = null;

export const apiClient: AxiosInstance = axios.create({
  baseURL: apiURL,
  timeout: 10000,
});

export function setApiURL(url: string) {
  apiURL = url;
  apiClient.defaults.baseURL = url;
}

export function setTokenFetcher(fetcher: () => Promise<string | null>) {
  tokenFetcher = fetcher;
}

// Interceptor to inject authentication token
apiClient.interceptors.request.use(
  async (config) => {
    if (tokenFetcher) {
      try {
        const token = await tokenFetcher();
        if (token) {
          config.headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.warn('[SDK API Client] Token fetcher failed:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
