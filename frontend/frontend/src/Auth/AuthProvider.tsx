import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { loginHelper, logoutHelper } from './authUtility';
import { AuthContext } from './useAuth';
import { jwtDecode } from 'jwt-decode';
import type { User } from './types';
import { logoutHandler, registerTokenRefreshHandler } from './api';



interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) return null;
        try {
            const decoded: User = jwtDecode(token);
            if(decoded.exp * 1000 < Date.now()){
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                return null;
            }
            return decoded;
        } catch(err){
            console.error('Invalid token', err);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return null;
        }
    })

    const login = async (username: string, password: string) => {
        const { access, refresh } = await loginHelper(username, password);
        setUser(jwtDecode(access));
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
    }

    const logout = useCallback(async () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        await logoutHelper();
    }, []);

    const refreshTokens = useCallback((access: string, refresh: string) => {
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        setUser(jwtDecode(access));
    }, []);


    useEffect(() => {
        registerTokenRefreshHandler(refreshTokens)
        logoutHandler(logout);

    }, [refreshTokens, logout]);

   

    return (
        <AuthContext.Provider value={{ user, login, logout, refreshTokens }}>
            {children}
        </AuthContext.Provider>
    )
}