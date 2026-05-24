import { AxiosInstance } from 'axios';
export declare const apiClient: AxiosInstance;
export declare function setApiURL(url: string): void;
export declare function setTokenFetcher(fetcher: () => Promise<string | null>): void;
