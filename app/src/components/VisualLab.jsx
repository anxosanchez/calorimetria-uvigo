import React from 'react';
import { Thermometer, Activity } from 'lucide-react';

export default function VisualLab({ state }) {
  const isRunning = state.status === 'running';
  
  // Calculate relative fill based on max temp for visual effect 
  const maxT = 60; 
  const currentHeight = Math.min(((state.currentTemp - 20) / (maxT - 20)) * 100, 100);

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center w-full min-h-[400px]">
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Laboratorio Virtual</h3>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Calorímetro de paredes delgadas</p>
      </div>

      <div className="relative w-48 h-64 border-b-4 border-l-4 border-r-4 border-zinc-300 dark:border-zinc-600 rounded-b-3xl bg-blue-50/20 dark:bg-blue-900/10 flex items-end justify-center overflow-hidden overflow-visible">
        
        {/* Termómetro digital */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-zinc-800 text-green-400 font-mono text-2xl px-4 py-2 rounded-lg border-2 border-zinc-700 z-10 flex items-center gap-2 shadow-lg">
          <Thermometer size={20} className="text-red-400" />
          {state.currentTemp.toFixed(1)}°C
        </div>
        
        {/* Vara del termómetro */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-48 bg-zinc-300 dark:bg-zinc-600 z-0 rounded-b-full">
            {/* Llenado rojo del termómetro */}
            <div 
              className="absolute bottom-0 w-full bg-red-500 rounded-b-full transition-all duration-300"
              style={{ height: `${20 + currentHeight * 0.8}%` }}
            ></div>
        </div>

        {/* Agitador */}
        <div className={`absolute right-10 top-10 w-1 h-48 bg-zinc-400 z-0 ${isRunning ? 'origin-top animate-spin-slow' : ''}`} style={{ animationDuration: '2s', animationIterationCount: 'infinite' }}>
           <div className="absolute bottom-0 -left-2 w-5 h-2 bg-zinc-500 rounded"></div>
        </div>

        {/* Líquido */}
        <div className="w-full bg-blue-200/60 dark:bg-blue-600/40 relative z-10 rounded-b-2xl transition-all duration-1000" style={{ height: '50%' }}>
           {/* Partículas de reacción */}
           {isRunning && (
             <div className="absolute inset-0 overflow-hidden flex justify-center items-center">
               <Activity className="text-white/50 animate-pulse" size={40} />
             </div>
           )}
        </div>
      </div>

    </div>
  );
}
