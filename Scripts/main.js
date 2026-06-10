const modeSalary = document.getElementById('modeSalary');
const salaryFields = document.getElementById('salaryFields');
const predoctoralStart = document.getElementById('predoctoralStart');
const fpuConv = document.getElementById('fpuConv');

const modeTrienios = document.getElementById('modeTrienios');
const trieniosFields = document.getElementById('trieniosFields');
const umaStart = document.getElementById('umaStart');
const umaEnd = document.getElementById('umaEnd');

const salaryOtherFields = document.getElementById('salaryOtherFields');
const modeSalaryOther = document.getElementById('modeSalaryOther');
const contractStart = document.getElementById('contractStart');
const contractSalary = document.getElementById('contractSalary');
const contractEnd = document.getElementById('contractEnd');

const calculateBtn = document.getElementById('calculateBtn');
const resultBox = document.getElementById('result');
const calculatorInstructions = document.getElementById('calculatorInstructions');
const breakdownDetails = document.getElementById('breakdownDetails');
const breakdownContainer = document.getElementById('breakdownContainer');

let currentMode = 'salary';

function switchMode(mode) {
  currentMode = mode;
  modeSalary.classList.toggle('active', mode === 'salary');
  modeTrienios.classList.toggle('active', mode === 'trienios');
  modeSalaryOther.classList.toggle('active', mode === 'salaryOther');
  salaryFields.classList.toggle('hidden', mode !== 'salary');
  trieniosFields.classList.toggle('hidden', mode !== 'trienios');
  salaryOtherFields.classList.toggle('hidden', mode !== 'salaryOther');

  if (mode === 'salary') {
    calculatorInstructions.textContent = 'Si tienes, o has tenido recientemente, \
          un contrato predoctoral, puedes calcular cuánto te deben de atrasos salariales. Para ello, introduce \
          la fecha de inicio del contrato predoctoral y selecciona si perteneces a una convocatoria FPU reciente \
          (ya que algunas tienen salarios por encima del EPIPF)';
  } else if (mode === 'trienios'){
    calculatorInstructions.textContent = 'Los trienios son complementos salariales que se obtienen por cada período \
                    de 3 años trabajados en administraciones públicas. Asumiendo que no has trabajado en ninguna otra \
                    que la UMA, y que has estado contratado de forma ininterrumpida, puedes calcular aquí cuánto habrías acumulado.';
  } else if (mode === 'salaryOther'){
    calculatorInstructions.textContent = 'Si tienes, o has tenido recientemente, un contrato postdoctoral o con cargo a proyecto en la UMA, \
                    puedes calcular cuánto más habrías cobrado en bruto hasta hoy si te hubiesen aplicado las últimas subidas salariales.';
  }

  resultBox.textContent = 'Selecciona una opción y completa los datos para calcular.';
  resultBox.style.color = varComputedColor(resultBox, '--text');
  clearBreakdown();
}

modeSalary.addEventListener('click', () => switchMode('salary'));
modeTrienios.addEventListener('click', () => switchMode('trienios'));
modeSalaryOther.addEventListener('click', () => switchMode('salaryOther'));
calculateBtn.addEventListener('click', () => {
  if (currentMode === 'salary') {
    const fechaValor = predoctoralStart.value;
    const fpuValor = fpuConv.value;

    if (!fechaValor) {
      resultBox.textContent = 'Rellena la fecha de inicio del contrato predoctoral \
                              para calcular el salario atrasado.';
      resultBox.style.color = '#b91c1c';
      return;
    }

    const fecha = new Date(fechaValor + 'T00:00:00');
    const resultado = calcularSalarioAtrasado(fecha, fpuValor);

    if (!resultado) {
      resultBox.textContent = 'La fecha de inicio no puede ser posterior a hoy.';
      resultBox.style.color = '#b91c1c';
      return;
    }

    resultBox.style.color = varComputedColor(resultBox, '--text');
    // Damos el salario con máximo 2 cifras decimales
    if (resultado.deuda === 0) {
      resultBox.innerHTML = `No tienes deuda salarial según los mínimos marcados por EPIPF.`;
      clearBreakdown();
    } else {
      const addText = resultado.indemnizacion > 0 ? `<br>De los cuales 
            ${resultado.indemnizacion.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}€
            corresponden a la indemnización por fin de contrato.` : '';
      const total = resultado.deuda + resultado.indemnizacion;
      resultBox.innerHTML = `Deuda bruta estimada por atrasos salariales: 
                            ${total.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}€` + addText;
      renderBreakdown(resultado.breakdown);
    }
  } else if (currentMode === 'trienios') {
    const startValor = umaStart.value;
    const endValor = umaEnd.value;

    if (!startValor) {
      resultBox.textContent = 'Introduce la fecha de inicio del contrato en la UMA para calcular tus trienios.';
      resultBox.style.color = '#b91c1c';
      return;
    }

    const fechaInicio = new Date(startValor + 'T00:00:00');
    const fechaFin = endValor ? new Date(endValor + 'T00:00:00') : null;
    const resultado = calcularTrienios(fechaInicio, fechaFin);

    if (!resultado) {
      resultBox.textContent = 'La fecha de inicio no puede ser posterior a la fecha final ni a hoy.';
      resultBox.style.color = '#b91c1c';
      clearBreakdown();
      return;
    }

    resultBox.style.color = varComputedColor(resultBox, '--text');
    if (resultado.trienios === 0) {
      resultBox.innerHTML = `Aún no tienes un trienio completo.<br>
                            Llevas ${resultado.anos.toFixed(1)} años 
                            (≈${resultado.totalMonths} meses completos) en la UMA.`;
      clearBreakdown();
    } else {
      resultBox.innerHTML = `Deuda bruta estimada acumulada: 
                            ${resultado.deuda.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}€
                            <br><small>Tienes ${resultado.trienios} trienio(s) completo(s) tras 
                            ${resultado.totalMonths} meses.</small>`;
      renderBreakdown(resultado.breakdown);
    }
  } else if (currentMode === 'salaryOther') {
    const contractStartValor = contractStart.value;
    const contractSalaryValor = parseFloat(contractSalary.value);

    if (!contractStartValor) {
      resultBox.textContent = 'Introduce la fecha de inicio del contrato para calcular el salario atrasado.';
      resultBox.style.color = '#b91c1c';
      return;
    }

    if (!contractSalaryValor || contractSalaryValor <= 0) {
      resultBox.textContent = 'Introduce un salario anual válido (mayor que 0).';
      resultBox.style.color = '#b91c1c';
      return;
    }

    const contractStartDate = new Date(contractStartValor + 'T00:00:00');
    const contractEndDate = contractEnd.value ? new Date(contractEnd.value + 'T00:00:00') : null;
    const resultado = calcularSalarioOtro(contractStartDate, contractSalaryValor, contractEndDate);

    if (!resultado) {
      resultBox.textContent = 'La fecha de inicio no puede ser posterior a hoy.';
      resultBox.style.color = '#b91c1c';
      clearBreakdown();
      return;
    }

    resultBox.style.color = varComputedColor(resultBox, '--text');
    if (resultado.deuda === 0) {
      resultBox.innerHTML = `Con los datos proporcionados, no te habrías beneficiado de ninguna subida salarial aún.`;
      clearBreakdown();
    } else {
      resultBox.innerHTML = `Salario bruto adicional acumulado si te hubieran aplicado los aumentos salariales: 
                            ${resultado.deuda.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}€`;
      renderBreakdown(resultado.breakdown);
    }
  }
});

function clearBreakdown() {
  breakdownContainer.innerHTML = '';
  breakdownDetails.classList.add('hidden');
}

function renderBreakdown(breakdown) {
  if (!breakdown || typeof breakdown !== 'object' || Object.keys(breakdown).length === 0) {
    breakdownContainer.innerHTML = '<p>No hay desglose disponible.</p>';
    breakdownDetails.classList.remove('hidden');
    return;
  }

  // Obtener años únicos y ordenarlos
  const years = Object.keys(breakdown).map(Number).sort((a, b) => a - b);
  
  if (years.length === 0) {
    breakdownContainer.innerHTML = '<p>No hay desglose disponible.</p>';
    breakdownDetails.classList.remove('hidden');
    return;
  }

  let html = '<div class="breakdown-info">Aquí puedes ver el desglose de las cantidades generadas en cada mes de cada año.</div>';
  html += '<div class="breakdown-scroll"><table class="breakdown-matrix-table"><thead><tr><th>Mes \\ Año</th>';
  
  // Encabezados de años
  years.forEach(year => {
    html += `<th>${year}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Filas para cada mes
  for (let month = 1; month <= 12; month++) {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    html += `<tr><td class="month-label">${monthNames[month - 1]}</td>`;
    
    years.forEach(year => {
      const amount = breakdown[year] && breakdown[year][month] !== undefined ? breakdown[year][month] : 0;
      const displayAmount = amount > 0 ? amount.toFixed(2) : '-';
      html += `<td class="amount-cell">${displayAmount}</td>`;
    });
    
    html += '</tr>';
  }

  html += '</tbody></table></div>';
  breakdownContainer.innerHTML = html;
  breakdownDetails.classList.remove('hidden');
}

function varComputedColor(element, variable) {
  return getComputedStyle(element).getPropertyValue(variable) || '#1f2937';
}
