import React, { createContext, useContext, useState, ReactNode } from "react";

type WalletContextType = {
  wallet: string | null;
  setWallet: (wallet: string | null) => void;
};

const WalletContext = createContext<WalletContextType>({
  wallet: null,
  setWallet: () => {},
});

export const useWallet = () => useContext(WalletContext);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<string | null>(null);

  return (
    <WalletContext.Provider value={{ wallet, setWallet }}>
      {children}
    </WalletContext.Provider>
  );
}