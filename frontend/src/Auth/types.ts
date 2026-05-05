export interface User {
    user_id: number;
    username: string;
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
