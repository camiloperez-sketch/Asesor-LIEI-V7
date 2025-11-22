import React, { useState, useRef } from 'react';
import { analyzeTranscript, AnalysisInput } from './services/geminiService';
import { processStudentData } from './utils/logic';
import { AnalysisResult } from './types';
import CourseList from './components/CourseList';
import Report from './components/Report';
import html2pdf from 'html2pdf.js';
import JSZip from 'jszip';

interface BatchItem {
  id: number;
  file: { data: string, name: string } | null;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data: AnalysisResult | null;
  error: string | null;
}

const App: React.FC = () => {
  // Initialize 20 slots
  const [items, setItems] = useState<BatchItem[]>(
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      file: null,
      status: 'idle',
      data: null,
      error: null
    }))
  );

  const [isZipping, setIsZipping] = useState(false);
  const [previewItem, setPreviewItem] = useState<BatchItem | null>(null);

  // Helper to read file to base64
  const readFile = (file: File): Promise<{ data: string, name: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(',')[1];
        resolve({ data: base64Data, name: file.name });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Bulk Upload Handler
  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = e.target.files;
    const files: File[] = rawFiles ? Array.from(rawFiles) : [];
    
    // Filter PDFs and limit to 20
    const validFiles = files
      .filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))
      .slice(0, 20);

    if (validFiles.length === 0) {
        e.target.value = '';
        return;
    }

    try {
      // Read all files concurrently
      const results = await Promise.all(validFiles.map(readFile));

      setItems(prev => {
        const next = [...prev];
        // Populate slots sequentially
        results.forEach((res, idx) => {
          if (idx < next.length) {
            next[idx] = {
              ...next[idx],
              file: res,
              status: 'idle',
              data: null,
              error: null
            };
          }
        });
        return next;
      });
    } catch (error) {
      console.error("Error reading files", error);
      alert("Hubo un error al leer los archivos.");
    }
    
    // Reset input
    e.target.value = '';
  };

  // Individual File Change
  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar PDF
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      updateItem(index, { error: "Archivo no válido (solo PDF)" });
      return;
    }

    readFile(file).then(res => {
        updateItem(index, { 
            file: res,
            status: 'idle',
            error: null,
            data: null
          });
    });
  };

  const updateItem = (index: number, updates: Partial<BatchItem>) => {
    setItems(prev => prev.map(item => item.id === index ? { ...item, ...updates } : item));
  };

  const handleAnalyze = async (index: number) => {
    const item = items[index];
    if (!item.file) return;

    updateItem(index, { status: 'analyzing', error: null });

    try {
      const files: AnalysisInput[] = [{ mimeType: 'application/pdf', data: item.file.data }];
      const extractedData = await analyzeTranscript(files);
      const processed = processStudentData(extractedData.courses, extractedData.studentName, extractedData.studentId);
      
      updateItem(index, { status: 'success', data: processed });
    } catch (err) {
      console.error(err);
      updateItem(index, { status: 'error', error: "Error al analizar" });
    }
  };

  const handleAnalyzeAll = () => {
      items.forEach((item, idx) => {
          if (item.file && item.status === 'idle') {
              handleAnalyze(idx);
          }
      });
  };

  const handleDownloadPDF = (index: number) => {
    const item = items[index];
    if (!item.data) return;

    const elementId = `hidden-report-${index}`;
    const element = document.getElementById(elementId);
    
    if (!element) {
      alert("Error: Reporte no generado en DOM.");
      return;
    }

    // Format: Sugerencia de Matrícula NOMBRE COMPLETO.pdf
    const filename = `Sugerencia de Matrícula ${item.data.progress.studentName || 'Estudiante'}.pdf`;

    const opt = {
      margin:       [0.3, 0.3, 0.3, 0.3],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  const handleDownloadZIP = async () => {
    const successItems = items.filter(item => item.status === 'success' && item.data);
    if (successItems.length === 0) {
      alert("No hay reportes generados para descargar.");
      return;
    }

    setIsZipping(true);
    const zip = new JSZip();
    const folder = zip.folder("Reportes_Transicion_UNAD");

    try {
      // Generate all PDFs in memory
      await Promise.all(successItems.map(async (item) => {
         const elementId = `hidden-report-${item.id}`;
         const element = document.getElementById(elementId);
         if (!element) return;

         const filename = `Sugerencia de Matrícula ${item.data?.progress.studentName || 'Estudiante'}.pdf`;
         
         const opt = {
            margin:       [0.3, 0.3, 0.3, 0.3],
            filename:     filename,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, useCORS: true },
            jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
            pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
         };

         // Use html2pdf worker to get blob/string
         // @ts-ignore
         const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
         if (folder) folder.file(filename, pdfBlob);
      }));

      const content = await zip.generateAsync({ type: "blob" });
      
      // Trigger download
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `Reportes_UNAD_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("ZIP Generation Error", error);
      alert("Hubo un error al generar el archivo ZIP.");
    } finally {
      setIsZipping(false);
    }
  };

  const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800">
      {/* Header */}
      <header className="bg-unad-blue text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-unad-orange rounded-full flex items-center justify-center font-bold text-xl text-white">UN</div>
             <div>
               <h1 className="text-xl font-bold leading-tight">Asesor de Transición UNAD</h1>
               <p className="text-xs text-unad-light opacity-80">Procesamiento Masivo (Max 20)</p>
             </div>
          </div>
          
          <button 
            onClick={handleDownloadZIP}
            disabled={isZipping || !items.some(i => i.status === 'success')}
            className={`px-6 py-2 rounded font-bold transition flex items-center gap-2 shadow-lg border
                ${isZipping || !items.some(i => i.status === 'success') 
                  ? 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed' 
                  : 'bg-unad-yellow text-unad-blue hover:bg-yellow-400 border-yellow-500 animate-pulse-slow'}
            `}
          >
            {isZipping ? (
                <>
                  <div className="w-4 h-4 border-2 border-unad-blue border-t-transparent rounded-full animate-spin"></div>
                  Generando ZIP...
                </>
            ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Descargar TODO (ZIP)
                </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50">
             <h2 className="text-xl font-bold text-gray-800">Panel de Carga Masiva</h2>
             <p className="text-sm text-gray-500 mb-4">Suba hasta 20 Registros Académicos Individuales (PDF) para generar reportes simultáneamente.</p>
             
             {/* Bulk Actions Area */}
             <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border border-dashed border-blue-200">
                <label className="flex items-center gap-2 bg-unad-blue text-white px-5 py-2.5 rounded-lg cursor-pointer hover:bg-blue-800 transition shadow-sm font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                    Subir Múltiples Archivos (Max 20)
                    <input 
                        type="file" 
                        accept=".pdf" 
                        multiple 
                        className="hidden" 
                        onChange={handleBulkUpload} 
                    />
                </label>
                
                <button 
                    onClick={handleAnalyzeAll}
                    className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm font-bold"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z" />
                    </svg>
                    Analizar Todo
                </button>

                <button 
                    onClick={() => setItems(prev => prev.map(item => ({ ...item, file: null, status: 'idle', data: null, error: null })))}
                    className="text-gray-500 hover:text-red-500 font-semibold px-4"
                >
                    Limpiar Todo
                </button>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-100 text-gray-600 uppercase font-bold">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">#</th>
                  <th className="px-6 py-4">Registro Académico (PDF)</th>
                  <th className="px-6 py-4 w-32 text-center">Estado</th>
                  <th className="px-6 py-4 text-center w-48">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-center font-bold text-gray-400">{idx + 1}</td>
                    
                    {/* File Upload / Name */}
                    <td className="px-6 py-4">
                      {item.file ? (
                        <div className="flex items-center justify-between bg-blue-50 text-blue-800 px-3 py-2 rounded border border-blue-100">
                          <div className="flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-blue-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                              </svg>
                              <span className="font-medium truncate max-w-xs" title={item.file.name}>{item.file.name}</span>
                          </div>
                          <button 
                             onClick={() => updateItem(idx, { file: null, status: 'idle', data: null, error: null })}
                             className="text-blue-300 hover:text-red-500 ml-2 text-lg leading-none"
                             title="Quitar archivo"
                          >
                            &times;
                          </button>
                        </div>
                      ) : (
                        <div className="relative group w-full">
                          <label className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded cursor-pointer hover:border-unad-blue hover:bg-blue-50 transition opacity-60 hover:opacity-100">
                            <UploadIcon />
                            <span className="ml-2 font-medium text-gray-500 group-hover:text-unad-blue">Seleccionar PDF</span>
                            <input type="file" accept=".pdf" className="hidden" onChange={(e) => handleFileChange(idx, e)} />
                          </label>
                        </div>
                      )}
                      {item.error && <p className="text-xs text-red-500 mt-1 font-semibold">{item.error}</p>}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 text-center">
                      {item.status === 'idle' && <span className="text-gray-400 text-xs">-</span>}
                      {item.status === 'analyzing' && <span className="text-unad-blue font-bold animate-pulse flex items-center justify-center gap-1"><div className="w-2 h-2 bg-unad-blue rounded-full animate-bounce"></div> Analizando...</span>}
                      {item.status === 'success' && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold border border-green-200">Completado</span>}
                      {item.status === 'error' && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold border border-red-200">Error</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        {/* Analyze Button */}
                        <button
                          onClick={() => handleAnalyze(idx)}
                          disabled={!item.file || item.status === 'analyzing' || item.status === 'success'}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition
                             ${!item.file || item.status === 'analyzing' || item.status === 'success' 
                               ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                               : 'bg-unad-blue text-white hover:bg-blue-800 shadow-sm'}
                          `}
                        >
                          Analizar
                        </button>

                        {/* Preview Button */}
                        <button
                          onClick={() => setPreviewItem(item)}
                          disabled={item.status !== 'success'}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition border
                             ${item.status !== 'success'
                               ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                               : 'border-gray-300 text-gray-700 hover:bg-gray-100 bg-white'}
                          `}
                        >
                          Ver
                        </button>

                         {/* Download Button */}
                         <button
                          onClick={() => handleDownloadPDF(idx)}
                          disabled={item.status !== 'success'}
                          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1
                             ${item.status !== 'success'
                               ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                               : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'}
                          `}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Hidden Reports Container for PDF Generation */}
      {/* These are rendered off-screen but strictly accessible by ID for html2pdf */}
      <div style={{ position: 'absolute', top: 0, left: '-9999px', width: '900px' }}>
        {items.map(item => (
          item.status === 'success' && item.data ? (
            <div key={`hidden-${item.id}`} id={`hidden-report-${item.id}`}>
               <Report 
                 progress={item.data.progress} 
                 suggestions={item.data.suggestions} 
                 gratuidadBundle={item.data.gratuidadBundle}
                 containerId={`report-content-${item.id}`} // not strictly used by hidden, but good for props
               />
            </div>
          ) : null
        ))}
      </div>

      {/* Preview Modal */}
      {previewItem && previewItem.data && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
             <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
               <div className="flex items-center gap-3">
                   <h3 className="font-bold text-lg text-gray-800">Vista Previa - Slot #{previewItem.id + 1}</h3>
                   <span className="text-sm text-gray-500">{previewItem.file?.name}</span>
               </div>
               <button onClick={() => setPreviewItem(null)} className="text-gray-400 hover:text-red-500 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition">&times;</button>
             </div>
             <div className="p-6 bg-gray-100">
                <div className="max-w-[8.5in] mx-auto shadow-lg">
                    <Report 
                    progress={previewItem.data.progress} 
                    suggestions={previewItem.data.suggestions} 
                    gratuidadBundle={previewItem.data.gratuidadBundle}
                    containerId={`preview-report-${previewItem.id}`}
                    />
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;