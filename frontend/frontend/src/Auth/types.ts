export interface User {
    token_type: string;
    exp: number;
    jti: string;
    user_id: string;
    username: string;
}

export interface AuthContextType {
    user: User | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    refreshTokens: (access: string, refresh: string) => void;
}