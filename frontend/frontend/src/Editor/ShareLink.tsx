import { useAuth } from "@/Auth/useAuth";
import { useEffect, type JSX } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "@/Auth/api";

function ShareLinkComponent(): JSX.Element {
    const { docId } = useParams();
    const [searchParams] = useSearchParams();
    const { authenticated, loading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const role = searchParams.get("role");
    const token = searchParams.get("token");

    useEffect(() => {
        if (loading) return;

        if (!authenticated) {
            const nextPath = `${location.pathname}${location.search}`;
            navigate(`/auth/login/?next=${encodeURIComponent(nextPath)}`, {
                replace: true,
            });
        }
    }, [authenticated, loading, location, navigate]);

    
    useEffect(() => {
        if (loading || !authenticated) return;
        if (!token || !role || !docId) return;

        const sendShare = async () => {
            try {
                const payload = { token, role };
                const response = await api.post("/api/acceptShare/", payload);
                navigate(response.data, { replace: true });
            } catch (e) {
                console.error(e);
            }
        };

        sendShare();
    }, [authenticated, loading, token, role, docId, navigate]);

    return (
        <div className="flex justify-center items-center h-screen">
            <div>Processing share link…</div>
        </div>
    );
}

export default ShareLinkComponent;
