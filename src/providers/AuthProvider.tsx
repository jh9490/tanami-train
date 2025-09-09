import React, { createContext, useContext, useMemo, useState } from 'react';

type AuthContextType = {
  isAuthenticated: boolean;
  userName: string | null;
  signInMock: (name?: string) => void;
  signOutMock: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider/>');
  return ctx;
};

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isAuthenticated, setAuthed] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const signInMock = (name = 'زائر') => {
    setUserName(name);
    setAuthed(true);
  };

  const signOutMock = () => {
    setUserName(null);
    setAuthed(false);
  };

  const value = useMemo(() => ({ isAuthenticated, userName, signInMock, signOutMock }), [isAuthenticated, userName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
