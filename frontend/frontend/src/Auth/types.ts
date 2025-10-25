export interface User {
    user_id: string;
    username: string;
    site_id: number;
}


export interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    loading: boolean,
    authenticated: boolean,
    getUser: () => Promise<void>;
}