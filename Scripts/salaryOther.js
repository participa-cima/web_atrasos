// Porcentajes de subidas salariales a empleados públicas aplicadas desde 2022
const salaryIncreases = [
  { dateAnnounced: new Date(2022, 10, 1), dateApplied: new Date(2022, 0, 1), increase: 0.015 }, // +1,5% anunciado en noviembre 2022, retroactivo a enero 2022
  { dateAnnounced: new Date(2023, 0, 1), dateApplied: new Date(2023, 0, 1), increase: 0.025 },  // +2,5% desde enero 2023
  { dateAnnounced: new Date(2023, 9, 1), dateApplied: new Date(2023, 0, 1), increase: 0.005 },  // +0,5% anunciado en octubre 2023, retroactivo a enero 2023
  { dateAnnounced: new Date(2024, 1, 8), dateApplied: new Date(2023, 0, 1), increase: 0.005 },  // +0,5% anunciado en febrero 2024, retroactivo a enero 2023
  { dateAnnounced: new Date(2024, 6, 1), dateApplied: new Date(2024, 0, 1), increase: 0.02 },   // +2% anunciado en julio 2024, retroactivo a enero 2024
  { dateAnnounced: new Date(2025, 6, 1), dateApplied: new Date(2024, 0, 1), increase: 0.005 },  // +0,5% anunciado en julio 2025, retroactivo a enero 2024
  { dateAnnounced: new Date(2025, 11, 1), dateApplied: new Date(2025, 0, 1), increase: 0.025 }, // +2,5% anunciado en diciembre 2025, retroactivo a enero 2025
  { dateAnnounced: new Date(2026, 0, 1), dateApplied: new Date(2026, 0, 1), increase: 0.015 }   // +1,5% desde enero 2026
];

function getMonthDiffOther(start, end) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function calcularSalarioOtro(startDate, anualSalary, endDate) {
  const now = endDate || new Date();
  
  if (startDate > now) {
    return null;
  }
  const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (anualSalary <= 0) {
    return null;
  }
  const monthlySalary = anualSalary / 12;

  const totalMonths = Math.max(0, getMonthDiffOther(startDate, nowDate))+1;
  let totalDebt = 0;
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const monthlyData = [];

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
    let updatedSalary = monthlySalary;

    // Aplicar los aumentos correspondientes según la fecha
    // Solo se aplican los aumentos que fueron anunciados después de la fecha de inicio del contrato
    salaryIncreases.forEach(salaryIncrease => {
      if (startDate < salaryIncrease.dateAnnounced && currentMonth >= salaryIncrease.dateApplied) {
        updatedSalary *= (1 + salaryIncrease.increase);
      }
    });

    let monthlyDebt = updatedSalary - monthlySalary;

    if (monthIndex === 0) {
        // Para el primer mes, hay que multiplicar el salario por el número de días del mes que restan desde la fecha de inicio
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const startDay = startDate.getDate();
        monthlyDebt *= (daysInMonth - startDay + 1) / daysInMonth;
    } else if (monthIndex === totalMonths - 1) {
        // Para el último mes, hay que multiplicar el salario por el número de días del mes que han pasado hasta la fecha final
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const diffDays = (nowDate - currentMonth) / (1000 * 60 * 60 * 24);
        monthlyDebt *= diffDays / daysInMonth;
      }

    totalDebt += monthlyDebt;

    monthlyData.push({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      amount: monthlyDebt
    });

    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  // Organizar los datos en una matriz por año y mes
  const breakdownMatrix = {};
  monthlyData.forEach(entry => {
    if (!breakdownMatrix[entry.year]) {
      breakdownMatrix[entry.year] = {};
    }
    breakdownMatrix[entry.year][entry.month] = entry.amount;
  });

  return {
    deuda: Math.round(totalDebt * 100) / 100,
    totalMonths,
    breakdown: breakdownMatrix
  };
}
