import React from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import { useAuth } from "../AuthContext";

/**
 * Forced logout wrapper - SYNCHRONOUS logout during render.
 * This runs BEFORE any child components mount.
 */
export default function LandingPageWithLogout() {
    const { user, silentLogout } = useAuth();
    const navigate = useNavigate();

    // Move side effects to useEffect
    React.useEffect(() => {
        if (user) {
            // Clear storage immediately
            localStorage.clear();
            sessionStorage.clear();

            // Clear React state
            silentLogout();

            // Force re-render by navigating to the same path
            // This ensures auth state is cleared before any navigation
            navigate('/', { replace: true });
        }
    }, [user, silentLogout, navigate]);

    // Prevent rendering while authenticated to avoid flash of content
    if (user) {
        return null;
    }

    return <LandingPage />;
}
