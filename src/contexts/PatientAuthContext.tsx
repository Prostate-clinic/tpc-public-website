"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
}

interface PatientAuthState {
  patient: PatientProfile | null;
  token: string | null;
  login: (token: string, patient: PatientProfile) => void;
  logout: () => void;
}

const PatientAuthContext = createContext<PatientAuthState>({
  patient: null,
  token: null,
  login: () => {},
  logout: () => {},
});

const STORAGE_KEY = "patient_auth";

export function PatientAuthProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPatient(parsed.patient);
        setToken(parsed.token);
      }
    } catch {
      // ignore
    }
  }, []);

  const login = (newToken: string, newPatient: PatientProfile) => {
    setToken(newToken);
    setPatient(newPatient);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token: newToken, patient: newPatient }));
  };

  const logout = () => {
    setToken(null);
    setPatient(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  return (
    <PatientAuthContext.Provider value={{ patient, token, login, logout }}>
      {children}
    </PatientAuthContext.Provider>
  );
}

export const usePatientAuth = () => useContext(PatientAuthContext);
