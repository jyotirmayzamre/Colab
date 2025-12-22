import { useEffect,useCallback, useRef, useMemo, type ReactNode, useReducer } from 'react';
import { AuthContext } from './useAuth';
import type { User } from './types';
import api from './api';

interface Props {
    children: ReactNode;
}

interface AuthState {
    user: User | null;
    authenticated: boolean;
}

type AuthAction = 
    | { type: 'SET_USER'; payload: User }
    | { type: 'CLEAR_USER' };


function authReducer(state: AuthState, action: AuthAction){
    switch (action.type){
        case 'SET_USER':
            return {
                user: action.payload,
                authenticated: true
            }
        case 'CLEAR_USER':
            return {
                user: null,
                authenticated: true
            }
        default:
            return state
    }
}


export const AuthProvider = ({ children }: Props) => {
    const [state, dispatch] = useReducer(authReducer, { user: null, authenticated: false});

    const isLoggingOut = useRef(false);

    const getUser = useCallback(async () => {
        try {
            const response = await api.get('/api/accounts/me/');
            const data = response.data;
            const user: User = { username: data.username, site_id: data.site_id, user_id: data.id }
            dispatch({ type: 'SET_USER', payload: user})
            return response.data;
        } catch {
            dispatch({ type: 'CLEAR_USER'});
        }  
    }, []);


    const login = useCallback(async (username: string, password: string) => {
        const data = {'username': username, 'password': password};
        
        try {
            const response = await api.post('/api/accounts/login/', data);
            await getUser();
            return response.data;
        } catch {
            dispatch({ type: 'CLEAR_USER'});
        } 
    }, [getUser]);

    

    const logout = useCallback(async () => {
        isLoggingOut.current = true;
        try {
            await api.post('/api/accounts/logout/');

        } catch(error: unknown){
            if(error instanceof Error){
                console.error(error.message)
            }
        } finally {
            dispatch({ type: 'CLEAR_USER'});
            isLoggingOut.current = false;
        }
    }, []);


    useEffect(() => {
        const checkAuth = async() => {
            if(isLoggingOut.current) return;
            await getUser();
        }
        checkAuth();

        const handleLogout = () => {
            isLoggingOut.current = true;
            dispatch({ type: 'CLEAR_USER' })
            isLoggingOut.current = false;
        };

        window.addEventListener('auth:logout', handleLogout);

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, [getUser]);

    const contextValue = useMemo(
        () => ({ user: state.user, login, logout, authenticated: state.authenticated}),
        [state.user, login, logout, state.authenticated]
    );


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}