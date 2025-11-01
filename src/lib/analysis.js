// Example calculation 1: Internal Energy (U = 1.5 * P * V)
const calculateInternalEnergy = (row) => {
  const P = row.pressure; 
  const V = row.volume;
  
  if (P && V) {
    const p_pa = parseFloat(P) * 1000; // kPa to Pa
    const v_m3 = parseFloat(V) / 1000; // L to m^3
    const U = (1.5 * p_pa * v_m3).toFixed(3);
    return parseFloat(U);
  }
  return null;
};

// Example calculation 2: Enthalpy (H = U + PV)
const calculateEnthalpy = (row, calculatedData) => {
  const P = row.pressure;
  const V = row.volume;
  const U = calculatedData.internalEnergy; 
  
  if (P && V && U !== undefined && U !== null) { // Added null check
    const p_pa = parseFloat(P) * 1000;
    const v_m3 = parseFloat(V) / 1000;
    const H = (parseFloat(U) + (p_pa * v_m3)).toFixed(3);
    return parseFloat(H);
  }
  return null;
};

// This array is now just the *default* calculations.
export const AVAILABLE_CALCULATIONS = [
  {
    id: 'internalEnergy',
    name: 'Internal Energy (U)',
    formula: 'U = 1.5 * P * V (Ideal Gas)',
    func: calculateInternalEnergy,
    requiredInputs: ['pressure', 'volume'], 
    outputKey: 'internalEnergy',
    outputUnit: 'J',
  },
  {
    id: 'enthalpy',
    name: 'Enthalpy (H)',
    formula: 'H = U + P * V',
    func: calculateEnthalpy,
    requiredInputs: ['pressure', 'volume'],
    dependencies: ['internalEnergy'], // Depends on a previous calculation
    outputKey: 'enthalpy',
    outputUnit: 'J',
  },
];

/**
 * Processes the full dataset based on selected calculations.
 * @param {Array<Object>} data - Parsed data
 * @param {Object} columnMap - Map of standard keys to user keys
 * @param {Array<Object>} selectedCalculations - Array of calculation objects (inbuilt + custom)
 * @returns {Object} - { newData, newHeaders }
 */
export const runAnalysis = (data, columnMap, selectedCalculations) => {
  // Simple dependency sort (inbuilt or custom)
  const calculationsToRun = [...selectedCalculations].sort(
    (a, b) => (a.dependencies?.length || 0) - (b.dependencies?.length || 0)
  );

  const newHeaders = [];
  const newData = data.map(originalRow => {
    // 1. Create a "standardized" row
    const stdRow = {};
    for (const [stdKey, userKey] of Object.entries(columnMap)) {
      stdRow[stdKey] = originalRow[userKey];
    }

    // 2. Run calculations
    const calculatedData = {};
    const newRow = { ...originalRow };

    for (const calc of calculationsToRun) {
      // Check if all inputs are present
      const hasInputs = calc.requiredInputs.every(key => stdRow[key] !== undefined);
      // Check if dependencies are met
      const hasDeps = (calc.dependencies || []).every(dep => calculatedData[dep] !== undefined);

      if (hasInputs && hasDeps) {
        // Pass stdRow for base inputs, and calculatedData for dependent inputs
        const result = calc.func(stdRow, calculatedData);
        if (result !== null) {
          const headerName = `${calc.name} (${calc.outputUnit})`;
          calculatedData[calc.outputKey] = result;
          newRow[headerName] = result;
          
          if (!newHeaders.includes(headerName)) {
            newHeaders.push(headerName);
          }
        }
      }
    }
    return newRow;
  });

  return { newData, newHeaders };
};