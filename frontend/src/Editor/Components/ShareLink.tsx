import { useAuth } from "@/Auth/useAuth";
import { useEffect, type JSX } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMemo } from "react";
import api from "@/Auth/api";
import useProfiler from "../profiler";
import { sendNotif } from "@/lib/utils";

function ShareLinkComponent(): JSX.Element {
    const [searchParams] = useSearchParams();
    const { authenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const role = useMemo(() => searchParams.get("role"), [searchParams]);
    const { token } = useParams();

    useProfiler('Share Link component')


    useEffect(() => {
        const sendShare = async (): Promise<void> => {
            try {
                const payload = { token, role };
                const response = await api.post("/api/permissions/accept-share/", payload);
                navigate(response.data, { replace: true });
            } catch(e){
                console.error(e);
                sendNotif('error', 'Could not share document via link :(');
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
