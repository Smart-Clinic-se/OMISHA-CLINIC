import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LandingPage from "./LandingPage";
import { useAuth } from "../AuthContext";
import toast from "react-hot-toast";

/**
 * Forced logout wrapper.
 * Handles the logic of clearing the session and then renders the beautiful LandingPage.
 */
export default function LandingPageWithLogout() {
    const { user, silentLogout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            // 1. UI Feedback: Premium "Goodbye" Toast
            toast.success("You have been logged out securely. See you soon!", {
                icon: "👋",
                duration: 4000,
                style: {
                    borderRadius: '16px',
                    background: '#1e293b', // Slate-800
                    color: '#fff',
                    fontWeight: 'bold',
                    border: '1px solid #334155' // Slate-700
                },
            });

            // 2. Logic: Clear Storage & State (Handled by silentLogout to preserve theme)
            silentLogout();

            // 3. Navigation: Force a cleaner URL state
            navigate('/', { replace: true });
        }
    }, [user, silentLogout, navigate]);

    // Prevent rendering content while the logout logic processes
    if (user) {
        return null;
    }

    // Render the fully styled Premium Landing Page
    return <LandingPage />;
}