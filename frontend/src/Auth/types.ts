export interface User {
    user_id: string;
    username: string;
    site_id: number;
}


export interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    authenticated: boolean,
    authChecked: boolean
}

export interface AuthState {
    user: User | null;
    authenticated: boolean;
    authChecked: boolean;
}
