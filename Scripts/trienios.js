function getMonthDiff(start, end) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

const trienioRates = [
  { year: 2020, rate: 46.32 },
  { year: 2021, rate: 46.74 },
  { year: 2022, rate: 47.67 },
  { year: 2023, rate: 49.59 },
  { year: 2024, rate: 51.07 },
  { year: 2025, rate: 52.60 },
  { year: 2026, rate: 53.39 }
];

function getRateForYear(year) {
  const entry = trienioRates.find(rate => rate.year === year);
  return entry ? entry.rate : trienioRates[trienioRates.length - 1].rate;
}

function calcularTrienios(startDate, endDate) {
  const now = endDate || new Date();
  if (startDate > now) {
    return null;
  }

  const totalMonths = Math.max(0, getMonthDiff(startDate, now));
  let totalDue = 0;
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const monthlyData = [];

  const initialDateTSJA = new Date(2020, 6, 1);

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
    const accumulatedTrienios = Math.floor(monthIndex / 36);
    let monthAmount = 0;
    // Solo acumular trienios a partir de julio de 2020 (Según sentencia TSJA)
    if (currentMonth >= initialDateTSJA) {
      const monthlyRate = getRateForYear(currentMonth.getFullYear());
      monthAmount = accumulatedTrienios * monthlyRate;
    }

    totalDue += monthAmount;

    monthlyData.push({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      amount: monthAmount
    });

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  const anos = totalMonths / 12;
  const trienios = Math.floor(totalMonths / 36);
  
  // Organizar los datos en una matriz por año y mes
  const breakdownMatrix = {};
  monthlyData.forEach(entry => {
    if (!breakdownMatrix[entry.year]) {
      breakdownMatrix[entry.year] = {};
    }
    breakdownMatrix[entry.year][entry.month] = entry.amount;
  });

  return {
    anos,
    trienios,
    deuda: Math.round(totalDue * 100) / 100,
    now,
    totalMonths,
    breakdown: breakdownMatrix
  };
}
