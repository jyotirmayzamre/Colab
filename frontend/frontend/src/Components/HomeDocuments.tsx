import { useEffect, type JSX } from "react";
import { useAuth } from "../Auth/useAuth";
import api from "../Auth/api";

function HomeDocuments(): JSX.Element {
    const { user } = useAuth();


    return (
        <>
        </>
    )
}

export default HomeDocuments;