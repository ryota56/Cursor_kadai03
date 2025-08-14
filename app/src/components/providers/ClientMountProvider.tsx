'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface ClientMountContextType {
  mounted: boolean;
}

const ClientMountContext = createContext<ClientMountContextType>({
  mounted: false,
});

export function useClientMount() {
  return useContext(ClientMountContext);
}

interface ClientMountProviderProps {
  children: React.ReactNode;
}

// クライアントマウント状態を管理するProvider
// マウント完了まではSkeleton等を表示するために使用
export function ClientMountProvider({ children }: ClientMountProviderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <ClientMountContext.Provider value={{ mounted }}>
      {children}
    </ClientMountContext.Provider>
  );
}
