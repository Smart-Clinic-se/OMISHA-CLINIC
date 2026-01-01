import React, { useState, useEffect, useContext, createContext } from "react";
import api, { loginAPI, registerAPI, registerStaffAPI, updateDoctorAvailabilityAPI } from "./api";
import toast from "react-hot-toast";
import axios from 'axios'; // Needed for direct refresh call
import { useTheme } from './context/ThemeContext';
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { syncThemeWithBackend } = useTheme();
  const navigate = useNavigate();

  // === NEW: REFRESH USER DATA ===
  const refreshUser = async () => {
    try {
      // We use the api instance which handles the base URL and token
      const res = await api.get('/auth/me');

      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user.themePreference) {
          syncThemeWithBackend(res.data.user.themePreference);
        }
      }
    } catch (err) {
      console.error("Failed to refresh user data", err);
      // Optional: Logout if token invalid
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token && storedUser !== "undefined") {
          const parsedUser = JSON.parse(storedUser);
          setUser({
            ...parsedUser,
            availabilityStatus: parsedUser.availabilityStatus || 'Available',
          });
          // Refresh in background to get latest security status
          refreshUser();
        }
      } catch (error) {
        console.error("Failed to load user from storage:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (identifier, password, role) => {
    try {
      const res = await loginAPI({ loginInput: identifier, password, role });

      if (res.data?.user && res.data?.token) {
        const userData = res.data.user;

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", res.data.token);

        if (userData.themePreference) {
          syncThemeWithBackend(userData.themePreference);
        }

        // Fetch latest details immediately (to check security question)
        await refreshUser();

        const roleGreeting = {
          patient: "Welcome! Your queue is ready",
          doctor: `Dr. ${userData.name}, your dashboard is ready`,
          staff: "Staff login successful",
          admin: "Admin access granted",
        };

        toast.success(roleGreeting[userData.role] || "Login successful!");
        return { success: true };
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Register Patient
  const register = async (userData) => {
    try {
      const res = await registerAPI(userData);
      toast.success("Account created successfully! Please login.");
      // Return credentials for popup
      return { success: true, message: res.data.message, credentials: res.data.credentials };
    } catch (error) {
      const msg = error.response?.data?.message || "Registration failed.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Register Doctor OR Staff (Admin only)
  const registerDoctor = async (staffData) => {
    try {
      const res = await registerStaffAPI(staffData);
      toast.success(res.data.message);
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to add user.";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Logout
  const logout = async () => {
    if (user?.role === "doctor") {
      try {
        await updateDoctorAvailabilityAPI(user._id, {
          status: "Not Available",
          breakDuration: 0
        });
      } catch (err) {
        console.error("Failed to update status on logout", err);
      }
    }

    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/");
  };

  // Silent Logout (for landing page security - no toast, no redirect)
  const silentLogout = () => {
    // Clear storage but PRESERVE THEME
    const theme = localStorage.getItem('theme');
    localStorage.clear();
    if (theme) localStorage.setItem('theme', theme);

    sessionStorage.clear();

    // Clear React state
    setUser(null);
    // No toast notification
    // No redirect - caller handles navigation
  };

  // === REAL-TIME AVAILABILITY SYNC ===
  const updateAvailability = async (status, breakDuration = 0) => {
    if (user?.role === "doctor") {
      try {
        // 1. Optimistic UI Update
        const updatedUser = { ...user, availabilityStatus: status };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));

        // 2. Backend API Call
        await updateDoctorAvailabilityAPI(user._id, {
          status,
          breakDuration
        });

      } catch (err) {
        console.error("Availability Sync Failed:", err);
        toast.error("Connection failed. Reverting status.");
      }
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    registerDoctor,
    logout,
    silentLogout, // NEW: For landing page security
    updateAvailability,
    refreshUser, // EXPOSED HERE
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    isDoctor: user?.role === "doctor",
    isStaff: user?.role === "staff" || user?.role === "admin",
    isPatient: user?.role === "patient",
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};