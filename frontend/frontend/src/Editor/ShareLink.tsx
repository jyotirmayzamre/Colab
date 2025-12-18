import { useAuth } from "@/Auth/useAuth";
import { useEffect, type JSX } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "@/Auth/api";

function ShareLinkComponent(): JSX.Element {
    const [searchParams] = useSearchParams();
    const { authenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const role = searchParams.get("role");
    const { token } = useParams();


    useEffect(() => {
        const sendShare = async () => {
            try {
                const payload = { token, role };
                const response = await api.post("/api/acceptShare/", payload);
                navigate(response.data, { replace: true });
            } catch (e) {
                console.error(e);
            }
        };

        //main logic
        if (!authenticated){
            const nextPath = `${location.pathname}${location.search}`;
            navigate(`/auth/login/?next=${encodeURIComponent(nextPath)}`, {
                replace: true,
            });
        } else {
            sendShare();
        }
    }, [authenticated, location, navigate, role, token])

    return (
        <div className="flex justify-center items-center h-screen">
            <div>Processing share link…</div>
        </div>
    );
}

export default ShareLinkComponent;
