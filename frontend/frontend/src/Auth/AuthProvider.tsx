import { useEffect,useCallback, useRef, useState, type ReactNode } from 'react';
import { AuthContext } from './useAuth';
import type { User } from './types';
import api from './api';



interface Props {
    children: ReactNode;
}

export const AuthProvider = ({ children }: Props) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);
    const isLoggingOut = useRef(false);


    const login = async (username: string, password: string) => {
        const data = {'username': username, 'password': password}
        try {
            const response = await api.post('/api/accounts/login/', data)
            await getUser();
            return response.data;
        } catch(error){
            setUser(null);
            setAuthenticated(false);
            console.error(error);
        } 
    }

    const getUser = useCallback(async () => {
        try {
            const response = await api.get('/api/accounts/me/');
            const data = response.data;
            const user: User = { username: data.username, site_id: data.site_id, user_id: data.id }
            setUser(user);
            setAuthenticated(true);
            return response.data;
        } catch(err){
            setUser(null);
            setAuthenticated(false);
            console.error(err);
        }  
    }, []);

    const logout = async () => {
        isLoggingOut.current = true;
        try {
            await api.post('/api/accounts/logout/');

        } catch(error: unknown){
            if(error instanceof Error){
                console.error(error.message)
            }
        } finally {
            setUser(null);
            setAuthenticated(false);
            isLoggingOut.current = false;
        }
    };


    useEffect(() => {
        const checkAuth = async() => {
            if(isLoggingOut.current) return;

            try {
                await getUser();
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        checkAuth();

        const handleLogout = () => {
            isLoggingOut.current = true;
            setUser(null);
            setAuthenticated(false);
            isLoggingOut.current = false;
        };

        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, [getUser]);


    return (
        <AuthContext.Provider value={{ user, login, logout, loading, authenticated, getUser }}>
            {children}
        </AuthContext.Provider>
    )
}