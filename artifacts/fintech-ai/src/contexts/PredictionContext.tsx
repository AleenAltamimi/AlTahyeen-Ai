import React, { createContext, useContext, useState } from 'react';
import { PredictionResult } from '@workspace/api-client-react';

interface PredictionContextType {
  currentPrediction: PredictionResult | null;
  setCurrentPrediction: (p: PredictionResult | null) => void;
}

const PredictionContext = createContext<PredictionContextType | undefined>(undefined);

export function PredictionProvider({ children }: { children: React.ReactNode }) {
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  
  return (
    <PredictionContext.Provider value={{ currentPrediction, setCurrentPrediction }}>
      {children}
    </PredictionContext.Provider>
  );
}

export function usePrediction() {
  const context = useContext(PredictionContext);
  if (context === undefined) {
    throw new Error('usePrediction must be used within a PredictionProvider');
  }
  return context;
}
