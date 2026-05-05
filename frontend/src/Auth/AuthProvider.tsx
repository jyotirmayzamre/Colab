import { useEffect,useCallback, useRef, useMemo, type ReactNode, useReducer } from 'react';
import { AuthContext } from './useAuth';
import { User, AuthState } from './types';
import api from './api';

interface Props {
    children: ReactNode;
}


type AuthAction = 
    | { type: 'SET_USER'; payload: User }
    | { type: 'CLEAR_USER' }


function authReducer(state: AuthState, action: AuthAction){
    switch (action.type){
        case 'SET_USER':
            return {
                user: action.payload,
                authenticated: true,
                authChecked: true
            }

        case 'CLEAR_USER':
            return {
                user: null,
                authenticated: false,
                authChecked: true
            }

        default:
            return state
    }
}


export const AuthProvider = ({ children }: Props) => {
    const [state, dispatch] = useReducer(authReducer, { user: null, authenticated: false, authChecked: false});

    const isLoggingOut = useRef(false);

    const getUser = useCallback(async () => {
        try {
            const response = await api.get('/api/accounts/me/');
            const data = response.data;
            const user: User = { username: data.username, user_id: data.id }
            dispatch({ type: 'SET_USER', payload: user})
            return response.data;
        } catch(e) {
            console.error(e);
            dispatch({ type: 'CLEAR_USER'});
        }  
    }, []);


    const login = useCallback(async (username: string, password: string) => {
        const data = {'username': username, 'password': password};
        
        try {
            const response = await api.post('/api/accounts/login/', data);
            await getUser();
            return response.data;
        } catch(error) {
            dispatch({ type: 'CLEAR_USER'});
            throw error;
        } 
    }, [getUser]);

    

    const logout = useCallback(async () => {
        isLoggingOut.current = true;
        try {
            await api.post('/api/accounts/logout/');

        } catch(e){
            console.error(e);
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
        () => ({ 
            user: state.user, 
            login, 
            logout, 
            authenticated: state.authenticated, 
            authChecked: state.authChecked}),
        [state.user, login, logout, state.authenticated, state.authChecked]
    );


    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    )
}
