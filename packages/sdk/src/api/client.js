"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
exports.setApiURL = setApiURL;
exports.setTokenFetcher = setTokenFetcher;
const axios_1 = __importDefault(require("axios"));
let apiURL = 'http://localhost:4000';
let tokenFetcher = null;
exports.apiClient = axios_1.default.create({
    baseURL: apiURL,
    timeout: 10000,
});
function setApiURL(url) {
    apiURL = url;
    exports.apiClient.defaults.baseURL = url;
}
function setTokenFetcher(fetcher) {
    tokenFetcher = fetcher;
}
// Interceptor to inject authentication token
exports.apiClient.interceptors.request.use(async (config) => {
    if (tokenFetcher) {
        try {
            const token = await tokenFetcher();
            if (token) {
                config.headers['Authorization'] = `Bearer ${token}`;
            }
        }
        catch (err) {
            console.warn('[SDK API Client] Token fetcher failed:', err);
        }
    }
    return config;
}, (error) => Promise.reject(error));
