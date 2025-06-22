import React, { createContext, useContext, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import type { User } from "../types/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, isAuthenticated, login, logout } = useAuthStore();
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token && !user) {
        try {
          const userProfile = await authService.getProfile();
          login(token, userProfile);
        } catch (error) {
          console.error("Failed to verify token:", error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [user, login, logout]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
