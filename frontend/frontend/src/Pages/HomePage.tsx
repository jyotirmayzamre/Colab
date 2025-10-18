import { useEffect, type JSX } from "react";
import { useAuth } from "../Auth/useAuth";
import api from "../Auth/api";

function Home(): JSX.Element {
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            const response = await api.get('/api/documents/');
            console.log(response.data);
        };
        fetchData();
    }, []);

    return (
        <>
            <p>Welcome Home, {user?.username}</p>
        </>
    )
}

export default Home;