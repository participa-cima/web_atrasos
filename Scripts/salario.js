// Salarios anuales actualizados según el CUAGE
const salarioAnualConvenio = [
  { year: 2020, rate: 29447.18 },
  { year: 2021, rate: 29712.20 },
  { year: 2022, rate: 30752.13 },
  { year: 2023, rate: 31828.44 },
  { year: 2024, rate: 32624.20 },
  { year: 2025, rate: 33439.84 },
  { year: 2026, rate: 33941.46 }
];

// Salarios anuales según convocatorias FPU recientes
const salarioConvsFPU = [
  { conv: "FPU22", anual: [17221.19, 18451.27, 23064.09, 23064.09] },
  { conv: "FPU23", anual: [19026.00, 23772.00, 23772.00, 23772.00] },
  { conv: "FPU24", anual: [24360.00, 24360.00, 24360.00, 24360.00] },
  { conv: "FPU25", anual: [25116.00, 25116.00, 25116.00, 25116.00] },
];

// Los salarios anuales desactualizados que está usando la UMA
const salarioAnualVencidoUMA = [
  { year: 2024, rate: 32465.02 },
  { year: 2025, rate: 32465.02 },
  { year: 2026, rate: 32465.02 }
];

function getSalarioAnualEPIPF(year, predocYear) {
  const entryConv = salarioAnualConvenio.find(x => x.year === year);
  const salarioConv = entryConv ? entryConv.rate : salarioAnualConvenio[salarioAnualConvenio.length - 1].rate;
  
  // Aplicamos los porcentajes de salario según el año del contrato predoctoral
  if (predocYear >= 4) {
    return salarioConv * 0.75;  // 75% del salario convenio para el cuarto año
  } else if (predocYear === 3) {
    return salarioConv * 0.60;  // 60% del salario convenio para el tercer año
  } else if (predocYear <= 2) {
    return salarioConv * 0.56;  // 56% del salario convenio para el primer y segundo años
  } else {
    return null; // No debería ocurrir, pero por seguridad
  }
}

function getSalarioAnualUMA(year, predocYear) {
  const entryConv = salarioAnualVencidoUMA.find(x => x.year === year);
  let salarioConv = 0;
  if (entryConv) {
    salarioConv = entryConv.rate;
  } else {
    if (year < salarioAnualVencidoUMA[0].year) {
      // Si no hay dato específico de la UMA para este año, usamos el salario EPIPF como referencia, 
      // asumiendo que son años lejanos en los que la UMA sí actualizó los salarios
      return getSalarioAnualEPIPF(year, predocYear); 
    } else {
      // Si el año es posterior al último dato de la UMA, asumimos que la UMA no ha actualizado y 
      // se mantiene el último salario conocido
      salarioConv = salarioAnualVencidoUMA[salarioAnualVencidoUMA.length - 1].rate;
    }
  }
  
  // Aplicamos los porcentajes de salario según el año del contrato predoctoral
  if (predocYear >= 4) {
    return salarioConv * 0.75;  // 75% del salario convenio para el cuarto año
  } else if (predocYear === 3) {
    return salarioConv * 0.60;  // 60% del salario convenio para el tercer año
  } else if (predocYear <= 2) {
    return salarioConv * 0.56;  // 56% del salario convenio para el primer y segundo años
  } else {
    return null; // No debería ocurrir, pero por seguridad
  }
}

function getMonthDiff(start, end) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function calcularSalarioAtrasado(startDate, fpuConv) {
  const now = new Date();
  if (startDate > now) {
    return null;
  }

  // Cogemos como fecha final la menor entre hoy y 4 años después del inicio de startDate, que 
  // es generalmente el máximo de duración de un contrato predoctoral
  const contractEndDate = new Date(startDate.getFullYear() + 4, startDate.getMonth(), startDate.getDate());
  const finalDate = new Date(Math.min(now.getTime(), contractEndDate.getTime()));

  // Comprobamos si es FPU de las nuevas convocatorias para obtener sus sueldos mínimos por convocatoria
  let isFpu = false;
  let convData = null;
  if (fpuConv !== 'none') {
    isFpu = true;
    convData = salarioConvsFPU.find(x => x.conv === fpuConv);
  }

  const totalMonths = Math.max(0, getMonthDiff(startDate, finalDate))+1;
  let totalDue = 0;
  let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1); // Empezamos desde el primer día del mes de inicio
  let indemnizacionDue = 0;
  const monthlyData = [];

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
    // Año del contrato predoctoral (1 a 4)
    const predocYear = Math.floor(monthIndex / 12) + 1; 
    // Salario mensual actualizado según EPIPF para el año actual y el año del contrato predoctoral
    const monthSalaryUpdated = getSalarioAnualEPIPF(currentMonth.getFullYear(), predocYear)/12;
    // Salario mensual (desactualizado) que asumimos que la UMA ha pagado este mes
    let monthSalary = getSalarioAnualUMA(currentMonth.getFullYear(), predocYear)/12;
    // Si es FPU de convocatorias recientes, el salario mensual no puede ser inferior al mínimo 
    // de su convocatoria para el año del contrato predoctoral, y asumimos que la UMA lo ha pagado correctamente
    if (isFpu) {
      const fpuMonthSalary = convData.anual[Math.min(predocYear - 1, convData.anual.length - 1)] / 12;
      monthSalary = Math.max(monthSalary, fpuMonthSalary);
    }

    let monthAmount = 0
    if (monthSalaryUpdated > monthSalary) {
      monthAmount = monthSalaryUpdated - monthSalary;
      if (monthIndex === 0) {
        // Para el primer mes, hay que multiplicar el salario por el número de días del mes que restan desde la fecha de inicio
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const startDay = startDate.getDate();
        monthAmount *= (daysInMonth - startDay + 1) / daysInMonth;
      } else if (monthIndex === totalMonths - 1) {
        // Para el último mes, hay que multiplicar el salario por el número de días del mes que han pasado hasta la fecha final
        const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
        const diffDays = (finalDate - currentMonth) / (1000 * 60 * 60 * 24);
        monthAmount *= diffDays / daysInMonth;
      }
      totalDue += monthAmount;
    }

    monthlyData.push({
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      amount: monthAmount
    });

    if (monthIndex === totalMonths - 1) {
      // Calculamos también el posible incremento en la indemnización por fin de contrato
      if (totalMonths === 48) {
        if (monthSalaryUpdated > monthSalary) {
          // La indemnización se calcula como el salario de 12 días por año trabajado
          const indemnizacionUpdated = monthSalaryUpdated*12/365*12*4;
          const indemnizacion = monthSalary*12/365*12*4;
          indemnizacionDue = indemnizacionUpdated - indemnizacion;
        }
      }
    }

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

  return { meses: totalMonths, deuda: totalDue, indemnizacion: indemnizacionDue, breakdown: breakdownMatrix };
}
