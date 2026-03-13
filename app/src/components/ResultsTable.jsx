import React from 'react';
import { THEORETICAL_DH } from '../hooks/useCalorimetry';
import { Table, CheckCircle2 } from 'lucide-react';

export default function ResultsTable({ results, config }) {
  if (!results) {
    return (
      <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-full flex flex-col items-center justify-center opacity-70 h-full text-zinc-500 min-h-[300px]">
        <Table size={48} className="mb-4 opacity-50" />
        <p>Os resultados aparecerán tras o experimento.</p>
      </div>
    );
  }

  const { reactionType } = config;
  const theoretical = THEORETICAL_DH[reactionType];

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-full h-full">
      <h3 className="text-xl font-bold mb-6 text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
        <CheckCircle2 className="text-emerald-500" />
        Resultados Experimentais
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">T. Inicial (T₀)</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{results.T0.toFixed(1)} °C</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">T. Máxima (Tₘₐₓ)</p>
          <p className="text-2xl font-bold text-red-500">{results.Tmax.toFixed(1)} °C</p>
        </div>
        
        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Incremento Térmico (ΔT)</p>
          <p className="text-2xl font-bold text-orange-500">+{results.deltaT.toFixed(2)} °C</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Moles NaOH (n)</p>
          <p className="text-2xl font-bold text-blue-500">{results.nNaOH.toFixed(3)} mol</p>
        </div>

        <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Calor (Q)</p>
          <p className="text-2xl font-bold text-amber-500">{results.Q.toFixed(0)} J</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700/50">
           <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">Entalpía Simulada (ΔH)</p>
           <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">{results.dH.toFixed(1)} kJ/mol</p>
        </div>
      </div>

       <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800/50">
        <div className="flex justify-between items-center">
           <div>
             <p className="text-sm font-semibold mb-1">Valor Teórico Estándar:</p>
             <p className="font-mono">{theoretical.toFixed(1)} kJ/mol</p>
           </div>
           <div className="text-right">
             <p className="text-sm font-semibold mb-1">Erro Relativo:</p>
             <p className="font-bold text-lg">{results.error.toFixed(1)}%</p>
           </div>
        </div>
       </div>

    </div>
  );
}
