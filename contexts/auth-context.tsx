"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { api, storage, tokenManager } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.roles?.includes('ADMIN') || user?.roles?.includes('ROLE_ADMIN') || false;

  useEffect(() => {
    // Check for existing user on mount
    const storedUser = storage.getUser();
    if (storedUser) {
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.auth.login({ email, password });
    if (response.data) {
      setUser(response.data);
    }
  };

  const register = async (email: string, password: string, username: string) => {
    const response = await api.auth.register({ email, password, username });
    if (response.data) {
      setUser(response.data);
    }
  };

  const loginWithToken = async (token: string) => {
    const response = await api.auth.loginWithToken(token);
    if (response.data) {
      setUser(response.data);
    }
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin, login, register, loginWithToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
