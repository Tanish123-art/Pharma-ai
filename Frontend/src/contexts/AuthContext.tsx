import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => { },
  logout: () => { },
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log("Starting auth check...");
    const timeout = setTimeout(() => {
      console.warn("Auth check timed out, forcing loading to false");
      setLoading(false);
    }, 5000); // 5s safety timeout

    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        console.log("Token found, fetching user...");
        const { data } = await api.get('/auth/me');
        console.log("User fetched successfully:", data.email);
        setUser(data);
      } catch (error) {
        console.error("Auth check failed", error);
        localStorage.removeItem('access_token');
        setUser(null);
      }
    } else {
      console.log("No token found");
    }
    clearTimeout(timeout);
    setLoading(false);
  };

  const login = (token: string, userData: User) => {
    localStorage.setItem('access_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
