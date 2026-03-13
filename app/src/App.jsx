import React, { useState, useEffect } from 'react';
import { useCalorimetry } from './hooks/useCalorimetry';
import ConfigurationPanel from './components/ConfigurationPanel';
import VisualLab from './components/VisualLab';
import RealtimeChart from './components/RealtimeChart';
import ResultsTable from './components/ResultsTable';
import HessCycle from './components/HessCycle';
import Questionnaire from './components/Questionnaire';

export default function App() {
  const { config, state, startExperiment, resetExperiment, updateConfig } = useCalorimetry();
  const [history, setHistory] = useState({ R1: null, R2: null, R3: null });

  // Update history when a reaction finishes
  useEffect(() => {
    if (state.status === 'finished' && state.results) {
      setHistory(prev => ({
        ...prev,
        [config.reactionType]: state.results
      }));
    }
  }, [state.status, state.results, config.reactionType]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 p-8 w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-500 mb-4">
            Simulador de Calorimetría
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-lg max-w-2xl mx-auto">
            Demostración virtual da Lei de Hess. Configura o experimento para R1 (Disolución), R3 (Neutralización) e R2 (Global) para visualizar as súas variacións entálpicas.
          </p>
        </header>

        {/* Main Interface Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Config & VisualLab */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            <ConfigurationPanel 
              config={config} 
              updateConfig={updateConfig} 
              state={state} 
              startExperiment={startExperiment} 
              resetExperiment={resetExperiment} 
            />
            <VisualLab state={state} />
          </div>

          {/* Right Column: Chart & Results */}
          <div className="lg:col-span-8 flex flex-col gap-8">
             <RealtimeChart dataPoints={state.dataPoints} currentTemp={state.currentTemp} />
             <div className="flex-1">
               <ResultsTable results={state.results} config={config} />
             </div>
          </div>
        </div>

        {/* Bottom Section: Hess Cycle & Questionnaire */}
        <div className="w-full space-y-8">
          <HessCycle history={history} />
          <Questionnaire history={history} />
        </div>
        
      </div>
    </div>
  );
}
