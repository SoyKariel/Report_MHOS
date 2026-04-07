import { generarExcelBuffer } from './excelGenerator';

export const generarPDF = async (reportData) => {
  try {
    const FileSaver = await import('file-saver');
    const saveAs = FileSaver.saveAs || FileSaver.default?.saveAs || FileSaver.default;

    // 1. Construir el Excel con datos y fotos en Memoria
    const excelBuffer = await generarExcelBuffer(reportData);
    
    // 2. Prepararlo para enviarlo a nuestra API de conversión
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const formData = new FormData();
    
    formData.append('file', blob, 'temp.xlsx');

    alert("Generando PDF con LibreOffice... Esto puede tomar unos segundos.");

    // 3. Enviar a nuestro propio servidor (Next.js API)
    const response = await fetch('/api/convert-to-pdf', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('La conversión falló en el servidor.');
    }

    // 4. Descargar el resultado PDF exacto al diseño de Excel
    const pdfBlob = await response.blob();
    saveAs(pdfBlob, `${reportData.serial}_Impresion.pdf`);

  } catch (error) {
    console.error("Error en PDF Builder:", error);
    alert("Error al generar PDF. Asegúrate de tener LibreOffice instalado y la API funcionando.");
  }
};