import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
 

type User = {
  id: number;
  email: string;
  role: 'admin' | 'supervisor' | 'operator';
};

type AuthContextProps = {
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
  isLoading: boolean; // <--- ADDED THIS
};

const AuthContext = createContext<AuthContextProps>({
  user: null,
  setUser: () => {},
  logout: () => {},
  isLoading: true, // Default to true
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <--- ADDED THIS

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          setUser({ id: decoded.id, email: decoded.email, role: decoded.role });
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      } catch (err) {
        console.error("Auth initialization failed", err);
        localStorage.removeItem('token');
      } finally {
        setIsLoading(false); // <--- Tell the app we are done checking
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    window.location.href = '/wms-frontend/#/login';
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
