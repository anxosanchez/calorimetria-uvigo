import { useState, useCallback, useRef } from 'react';

// Constants
const CE = 4.184; // Heat capacity in J / g ºC
const MW_NAOH = 40.0; // g/mol
const T_INITIAL = 20.0; // ºC
// Theoretical Enthalpies (kJ/mol)
export const THEORETICAL_DH = {
  R1: -44.5, // Dissolution
  R2: -102.0, // Direct (Dissolution + Neutralization)
  R3: -57.5 // Neutralization
};

export function useCalorimetry() {
  const [config, setConfig] = useState({
    massNaOH: 2.0,
    volume: 50, // Vol of solvent/acid (mL)
    volumeNaOHaq: 50, // Vol of NaOH(aq) for R3
    molarityHCl: 1.0,
    reactionType: 'R1' // 'R1', 'R2', 'R3'
  });

  const [state, setState] = useState({
    status: 'idle', // idle, running, finished
    currentTime: 0,
    currentTemp: T_INITIAL,
    dataPoints: [], // { time, temp }
    results: null // { Q, Tmax, deltaT, dH, nNaOH, error }
  });

  const timerRef = useRef(null);

  const calculateTheoretical = (cfg) => {
    const nNaOH = cfg.massNaOH / MW_NAOH;
    const nHCl = (cfg.volume / 1000) * cfg.molarityHCl;
    
    let qTheory = 0; // Joules
    let totalMass = 0; // grams

    if (cfg.reactionType === 'R1') {
      // NaOH(s) + H2O
      qTheory = nNaOH * Math.abs(THEORETICAL_DH.R1) * 1000;
      totalMass = cfg.volume + cfg.massNaOH; 
    } else if (cfg.reactionType === 'R2') {
      // NaOH(s) + HCl(aq)
      const nNeutralized = Math.min(nNaOH, nHCl);
      qTheory = (nNaOH * Math.abs(THEORETICAL_DH.R1) * 1000) + (nNeutralized * Math.abs(THEORETICAL_DH.R3) * 1000);
      totalMass = cfg.volume + cfg.massNaOH;
    } else if (cfg.reactionType === 'R3') {
      // NaOH(aq) + HCl(aq)
      const nNeutralized = Math.min(nNaOH, nHCl);
      qTheory = nNeutralized * Math.abs(THEORETICAL_DH.R3) * 1000;
      // We assume for R3, NaOH(aq) was prepared in `volumeNaOHaq` 
      totalMass = cfg.volume + cfg.volumeNaOHaq + cfg.massNaOH;
    }

    // Experimental error: random between 0.95 and 1.05 (heat loss or measurement error)
    const errorFactor = 0.95 + Math.random() * 0.10;
    const qExperimental = qTheory * errorFactor;
    
    const deltaT = qExperimental / (totalMass * CE);
    const tMax = T_INITIAL + deltaT;
    const dH_exp = - (qExperimental / (nNaOH * 1000)); // kJ/mol

    const error = Math.abs((dH_exp - THEORETICAL_DH[cfg.reactionType]) / THEORETICAL_DH[cfg.reactionType]) * 100;

    return { qExperimental, totalMass, deltaT, tMax, dH_exp, nNaOH, error, qTheory };
  };

  const startExperiment = useCallback(() => {
    if (state.status === 'running') return;
    
    // 1. Calculate final state
    const theory = calculateTheoretical(config);
    
    setState(s => ({
      ...s,
      status: 'running',
      currentTime: 0,
      currentTemp: T_INITIAL,
      dataPoints: [{ time: 0, temp: T_INITIAL }],
      results: null
    }));

    // 2. Run simulation loop
    let t = 0;
    const maxTime = 30; // 30 seconds simulation
    const dt = 1; // 1 second per tick
    
    // Simple heating curve: T(t) = T_initial + deltaT * (1 - exp(-k*t))
    // We want it to reach ~Tmax around 15 seconds.
    const k = 0.3; 

    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      t += dt;
      
      const currentTemp = T_INITIAL + theory.deltaT * (1 - Math.exp(-k * t));
      
      setState(s => {
        const newDataPoints = [...s.dataPoints, { time: t, temp: currentTemp }];
        
        if (t >= maxTime) {
          clearInterval(timerRef.current);
          return {
            ...s,
            status: 'finished',
            currentTime: t,
            currentTemp: currentTemp,
            dataPoints: newDataPoints,
            results: {
              T0: T_INITIAL,
              Tmax: currentTemp,
              deltaT: currentTemp - T_INITIAL,
              Q: theory.qExperimental,
              nNaOH: theory.nNaOH,
              dH: theory.dH_exp,
              error: theory.error,
              reaction: config.reactionType
            }
          };
        }
        
        return {
          ...s,
          currentTime: t,
          currentTemp,
          dataPoints: newDataPoints
        };
      });
    }, 200); // 200ms real time = 1 simulation sec
    
  }, [config, state.status]);

  const resetExperiment = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState({
      status: 'idle',
      currentTime: 0,
      currentTemp: T_INITIAL,
      dataPoints: [],
      results: null
    });
  }, []);

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    resetExperiment();
  }, [resetExperiment]);

  return {
    config,
    state,
    startExperiment,
    resetExperiment,
    updateConfig
  };
}
