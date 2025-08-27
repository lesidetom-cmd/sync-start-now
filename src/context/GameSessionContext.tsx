import React, { createContext, useContext, ReactNode } from 'react';
import { useGameSession as useGameSessionHook } from '@/hooks/useGameSession';

// Create a Context to keep the game session state alive across routes
export type GameSessionContextValue = ReturnType<typeof useGameSessionHook>;

const GameSessionContext = createContext<GameSessionContextValue | undefined>(undefined);

export const GameSessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useGameSessionHook();
  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
};

// Expose the same hook name to minimize changes in pages
export const useGameSession = (): GameSessionContextValue => {
  const ctx = useContext(GameSessionContext);
  if (!ctx) {
    throw new Error('useGameSession must be used within a GameSessionProvider');
  }
  return ctx;
};
