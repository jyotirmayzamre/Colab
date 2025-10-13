import axios from 'axios';


export const loginHelper = async (username: string, password: string) => {
    const data = {'username': username, 'password': password}
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/accounts/login/',
            data,
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;

    } catch(error: unknown){
        if(error instanceof Error){
            console.error(error.message)
        }
    }
}

export const logoutHelper = async () => {
    try {
        await axios.post('http://127.0.0.1:8000/api/accounts/logout/');
        console.log('Logout successful')

    } catch(error: unknown){
        if(error instanceof Error){
            console.error(error.message)
        }
    }
}
