import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RealtimeChart({ dataPoints, currentTemp }) {
  // Pad the array with empty points for a static x-axis up to 30s
  const chartData = [...dataPoints];
  // if (chartData.length === 0) {
  //   chartData.push({ time: 0, temp: 20 });
  // }

  return (
    <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 w-full h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100">Temp. vs Tempo</h3>
        <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 py-1 px-3 rounded-full text-sm font-bold">
          {currentTemp.toFixed(1)} °C
        </span>
      </div>
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-zinc-700" />
            <XAxis 
              dataKey="time" 
              type="number" 
              domain={[0, 30]} 
              tickCount={7}
              stroke="#6b7280"
            />
            <YAxis 
              domain={['auto', 'auto']} 
              stroke="#6b7280"
              tickFormatter={(val) => val.toFixed(1)}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              labelFormatter={(label) => `Tempo: ${label}s`}
              formatter={(value) => [`${Number(value).toFixed(2)} °C`, 'Temperatura']}
            />
            <Line 
              type="monotone" 
              dataKey="temp" 
              stroke="#a855f7" 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
