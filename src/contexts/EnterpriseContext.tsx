import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import api from '../services/api';
import type { Enterprise, UserEnterprise } from '../dtos';
import { useAuth } from './AuthContext';

interface EnterpriseContextData {
  enterprises: UserEnterprise[];
  current: Enterprise | null;
  setCurrent(enterprise: Enterprise): void;
  loading: boolean;
  refresh(): void;
}

const EnterpriseContext = createContext<EnterpriseContextData>(
  {} as EnterpriseContextData,
);

export function EnterpriseProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [enterprises, setEnterprises] = useState<UserEnterprise[]>([]);
  const [current, setCurrent] = useState<Enterprise | null>(() => {
    const stored = localStorage.getItem('@DrPlantaoHub:enterprise');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);

  const handleSetCurrent = useCallback((enterprise: Enterprise) => {
    setCurrent(enterprise);
    localStorage.setItem('@DrPlantaoHub:enterprise', JSON.stringify(enterprise));
  }, []);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const response = await api.get('/userEnterprise/my-enterprises');
      setEnterprises(response.data);

      // Se não há nenhuma selecionada, seleciona a primeira
      if (!current && response.data.length > 0) {
        handleSetCurrent(response.data[0].enterprise);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, current, handleSetCurrent]);

  useEffect(() => {
    refresh();
  }, [isAuthenticated]);

  return (
    <EnterpriseContext.Provider
      value={{ enterprises, current, setCurrent: handleSetCurrent, loading, refresh }}
    >
      {children}
    </EnterpriseContext.Provider>
  );
}

export function useEnterprise(): EnterpriseContextData {
  const context = useContext(EnterpriseContext);
  if (!context)
    throw new Error('useEnterprise must be used within EnterpriseProvider');
  return context;
}
