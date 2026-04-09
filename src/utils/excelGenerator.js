const isProd = process.env.NODE_ENV === 'production';
const base = isProd ? '/Report_MHOS' : '';

// Función auxiliar para convertir imágenes locales a Base64
const getBase64ImageFromUrl = async (imageUrl) => {
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`No se pudo cargar la imagen: ${imageUrl}`);
    return null;
  }
};

export const construirWorkbook = async (reportData) => {
  const ExcelJS = (await import('exceljs')).default;
  const response = await fetch(`${base}/templates/Plantilla_Preventivo.xlsx`);
  const arrayBuffer = await response.arrayBuffer();
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  const ws = workbook.worksheets[0];

  // ---------------------------------------------------------
  // 1. INYECCIÓN DE ENCABEZADO Y PIE (PROPORCIÓN 4 Y 3)
  // ---------------------------------------------------------

  
  const headerBase64 = await getBase64ImageFromUrl(`${base}/templates/header.png`);
  const footerBase64 = await getBase64ImageFromUrl(`${base}/templates/footer.png`);

  if (headerBase64) {
    const headerId = workbook.addImage({ base64: headerBase64, extension: 'png' });
    // Pág 1: 0 | Pág 2: 64 | Pág 3: 128 (Justo después del footer anterior)
    const filasHeader = [0, 64, 128]; 

    filasHeader.forEach(fila => {
      try { ws.mergeCells(`A${fila + 1}:I${fila + 3}`); } catch(e) {}
      ws.addImage(headerId, {
        tl: { col: 1, row: fila },
        br: { col: 10, row: fila + 3 }, 
        editAs: 'absolute'
      });
    });
  }

  if (footerBase64) {
    const footerId = workbook.addImage({ base64: footerBase64, extension: 'png' });
    // Pág 1: 61 | Pág 2: 125 (Según tu indicación) | Pág 3: 189
    const filasFooter = [61, 125, 189]; 

    filasFooter.forEach(fila => {
      try { ws.mergeCells(`C${fila + 1}:I${fila + 3}`); } catch(e) {}
      ws.addImage(footerId, {
        tl: { col: 2, row: fila },
        br: { col: 10, row: fila + 3}, 
        editAs: 'absolute'
      });
    });
  }

  // ---------------------------------------------------------
  // 2. LLENADO DE DATOS (RECALIBRADO TOTAL)
  // ---------------------------------------------------------

  // --- PÁGINA 1 ---
  ws.getCell('D5').value = reportData.serial;
  ws.getCell('D6').value = reportData.date;
  ws.getCell('C8').value = reportData.client;
  ws.getCell('C10').value = reportData.direccion;
  ws.getCell('D13').value = reportData.contrato;
  ws.getCell('J13').value = reportData.partida;
  ws.getCell('C26').value = reportData.equipo;
  ws.getCell('C27').value = reportData.marca;
  ws.getCell('C28').value = reportData.modelo;
  ws.getCell('J26').value = reportData.numSerieEq;
  ws.getCell('J27').value = reportData.folioSsm;
  ws.getCell('J28').value = reportData.ubicacion;
  ws.getCell('C31').value = reportData.falla;
  ws.getCell('D33').value = reportData.condiciones;

  const tituloObs = "Trabajos realizados/Notas/Observaciones/Recomendaciones:\n\n";
  ws.getCell('B37').value = tituloObs + (reportData.trabajos || reportData.description || '');

  const celdasRefacciones = ['E48', 'B49', 'B50', 'B51'];
  reportData.refacciones?.forEach((ref, index) => {
    if(index < 4 && ref) ws.getCell(celdasRefacciones[index]).value = ref;
  });

  const filasMedicion = [54, 55, 56];
  reportData.medicion?.forEach((med, index) => {
    if(index < 3) {
      ws.getCell(`B${filasMedicion[index]}`).value = med.equipo;
      ws.getCell(`D${filasMedicion[index]}`).value = med.marca;
      ws.getCell(`G${filasMedicion[index]}`).value = med.modelo;
      ws.getCell(`L${filasMedicion[index]}`).value = med.serie;
    }
  });

  ws.getCell('B58').value = reportData.firmaEntrega;
  ws.getCell('D58').value = reportData.firmaRecibe;
  ws.getCell('G58').value = reportData.firmaValida;

  // --- PÁGINA 2 (Inicia en 68) ---
  ws.getCell('D68').value = reportData.serial;
  ws.getCell('D69').value = reportData.date;
  ws.getCell('C71').value = reportData.client;
  ws.getCell('C72').value = reportData.direccion;
  ws.getCell('E76').value = reportData.contrato;
  ws.getCell('J76').value = reportData.partida;
  ws.getCell('C82').value = reportData.equipo;
  ws.getCell('C83').value = reportData.marca;
  ws.getCell('C84').value = reportData.modelo;
  ws.getCell('J82').value = reportData.numSerieEq;
  ws.getCell('J83').value = reportData.folioSsm;
  ws.getCell('J84').value = reportData.ubicacion;

  for (let i = 0; i < 28; i++) {
    if (reportData.checklist && reportData.checklist[i]) {
      const celda = ws.getCell(`K${88 + i}`); 
      celda.value = 'X';
      celda.font = { bold: true };
    }
  }

  ws.getCell('B121').value = reportData.firmaEntrega;
  ws.getCell('D121').value = reportData.firmaRecibe;
  ws.getCell('G121').value = reportData.firmaValida;

  // --- PÁGINA 3 (Inicia en D132) ---
  ws.getCell('D132').value = reportData.serial;
  ws.getCell('D133').value = reportData.date;
  ws.getCell('C135').value = reportData.client;
  ws.getCell('C137').value = reportData.contrato;
  ws.getCell('J137').value = reportData.partida;

  ws.getCell('B178').value = reportData.firmaEntrega;
  ws.getCell('D178').value = reportData.firmaRecibe;
  ws.getCell('G178').value = reportData.firmaValida;

  // ---------------------------------------------------------
  // 3. INYECCIÓN FOTOS DE EVIDENCIA
  // ---------------------------------------------------------
  const addImageToExcel = (base64Str, col, row) => {
    if(!base64Str) return;
    try {
      const imgId = workbook.addImage({ base64: base64Str, extension: 'jpeg' });
      ws.addImage(imgId, { tl: { col, row }, ext: { width: 180, height: 180 }, editAs: 'absolute' });
    } catch(e) { console.error(e) }
  };

  if(reportData.fotos) {
  addImageToExcel(reportData.fotos.antes1, 1, 141); // A142
  addImageToExcel(reportData.fotos.antes2, 2, 141); // B142
  addImageToExcel(reportData.fotos.antes3, 3, 141); // C142
  
  addImageToExcel(reportData.fotos.durante1, 6, 141); // F142
  addImageToExcel(reportData.fotos.durante2, 9, 141); // I142
  
  addImageToExcel(reportData.fotos.despues1, 1, 154); // A155
  addImageToExcel(reportData.fotos.despues2, 2, 154); // B155
  addImageToExcel(reportData.fotos.etiqueta, 8, 154); // G155
  }

  // ---------------------------------------------------------
  // 4. CONFIGURACIÓN FINAL
  // ---------------------------------------------------------

  // Dentro de tu función construirWorkbook, antes del return:
ws.pageSetup.margins = {
  left: 0.5, right: 0.5,
  top: 0.5, bottom: 0,    // Margen inferior en 0 para pegar el footer al borde
  header: 0, footer: 0
};

  ws.pageSetup.printArea = 'A1:L192';
  ws.pageSetup.fitToPage = true;
  ws.pageSetup.fitToWidth = 1;
  ws.pageSetup.fitToHeight = 3;

  return workbook;
};

export const generarExcel = async (reportData) => {
  try {
    const FileSaver = await import('file-saver');
    const saveAs = FileSaver.saveAs || FileSaver.default?.saveAs || FileSaver.default;

    const workbook = await construirWorkbook(reportData);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_${reportData.serial}.xlsx`);
  } catch (error) {
    console.error("Error:", error);
    alert("Error al generar el archivo.");
  }
};

export const generarExcelBuffer = async (reportData) => {
  const workbook = await construirWorkbook(reportData);
  return await workbook.xlsx.writeBuffer();
};