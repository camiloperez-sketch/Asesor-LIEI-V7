import React from 'react';
import { StudentProgress, Suggestion } from '../types';
import html2pdf from 'html2pdf.js';

interface ReportProps {
  progress: StudentProgress;
  suggestions: Suggestion[];
  gratuidadBundle: Suggestion[];
  containerId?: string;
}

const SuggestionTable: React.FC<{ suggestions: Suggestion[], showFooter?: boolean }> = ({ suggestions, showFooter = false }) => {
    const totalCredits = suggestions.reduce((acc, s) => acc + s.course.credits, 0);
    return (
        <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="border-b-2 border-gray-200 text-gray-600 bg-gray-50">
                        <th className="text-left py-3 px-4 font-bold w-24">PRIORIDAD</th>
                        <th className="text-left py-3 px-4 font-bold w-24">CÓDIGO</th>
                        <th className="text-left py-3 px-4 font-bold">CURSO</th>
                        <th className="text-center py-3 px-4 font-bold w-24">CRÉDITOS</th>
                        <th className="text-left py-3 px-4 font-bold w-48">JUSTIFICACIÓN</th>
                    </tr>
                </thead>
                <tbody>
                    {suggestions.map((s, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50/50">
                            <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-bold 
                                    ${s.priority === 'ALTA' ? 'bg-red-100 text-red-700' : 
                                      s.priority === 'MEDIA' ? 'bg-yellow-100 text-yellow-800' : 
                                      'bg-blue-100 text-blue-800'}`}>
                                    {s.priority}
                                </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-gray-600">{s.course.code}</td>
                            <td className="py-3 px-4 font-medium text-gray-800">{s.course.name}</td>
                            <td className="py-3 px-4 text-center font-bold text-gray-700">{s.course.credits}</td>
                            <td className="py-3 px-4 text-xs text-gray-500 italic">{s.justification}</td>
                        </tr>
                    ))}
                    {showFooter && (
                        <tr className="bg-blue-50 font-bold border-t border-blue-100">
                            <td colSpan={3} className="py-3 px-4 text-right text-blue-800 uppercase text-xs tracking-wider">Total Créditos Sugeridos:</td>
                            <td className="py-3 px-4 text-center text-blue-900 text-lg">{totalCredits}</td>
                            <td></td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};


const Report: React.FC<ReportProps> = ({ progress, suggestions, gratuidadBundle, containerId = 'printable-report' }) => {
  
  const handlePrint = () => {
    const element = document.getElementById(containerId);
    if (!element) return;
    
    const filename = `Sugerencia de Matrícula ${progress.studentName || 'Estudiante'}.pdf`;

    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     filename,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    // @ts-ignore
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="flex flex-col h-full">
       {/* Toolbar */}
       <div className="mb-4 flex justify-end no-print">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-unad-blue text-white rounded hover:bg-blue-800 transition font-bold flex items-center gap-2 shadow-sm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar PDF
        </button>
      </div>

      {/* Report Content - Formal Letter Format */}
      <div id={containerId} className="bg-white p-12 border rounded-lg shadow-sm max-w-[8.5in] mx-auto w-full text-gray-900 font-sans text-[10.5pt] leading-relaxed">
        
        {/* Top Info Block */}
        <div className="mb-8 pb-4 border-b border-gray-100">
             <div className="grid grid-cols-2 gap-4 text-sm">
                 <div>
                     <span className="block text-gray-500 uppercase text-xs tracking-wider">Estudiante</span>
                     <span className="font-bold text-lg text-gray-900">{progress.studentName}</span>
                 </div>
                 <div className="text-right">
                     <span className="block text-gray-500 uppercase text-xs tracking-wider">Documento</span>
                     <span className="font-bold text-lg text-gray-900">{progress.studentId}</span>
                 </div>
             </div>
             <div className="mt-2 text-right text-xs text-gray-400">
                Fecha de elaboración: {new Date().toLocaleDateString()}
             </div>
        </div>

        <div className="space-y-4 text-justify">
            <p>Recibe un cordial saludo.</p>

            <p>
                Como parte del proceso de transición del plan de estudios de Pedagogía Infantil al plan vigente de Educación Infantil, 
                he revisado tu trayectoria académica con el fin de orientarte en esta nueva etapa.
            </p>

            <div>
                <p className="font-bold text-lg mb-3 mt-6 text-unad-blue border-l-4 border-unad-orange pl-3">
                    Sugerencia para la próxima matrícula
                </p>
                <p className="mb-4">
                    Con el fin de facilitar tu adaptación al nuevo plan y avanzar de manera equilibrada, te recomiendo matricular los siguientes cursos en el próximo periodo académico:
                </p>

                {/* Standard Suggestion Table */}
                <SuggestionTable suggestions={suggestions} showFooter={true} />
            </div>

            <p>
                La propuesta busca articular los cursos reconocidos desde el plan anterior con los espacios formativos propios de la Licenciatura en Educación Infantil, 
                asegurando así la continuidad y el fortalecimiento de tu proceso académico.
            </p>

            <p>
                Quedo atenta a tus comentarios y a resolver cualquier inquietud. Recuerda que la transición es una oportunidad para actualizar tu formación y enriquecer tu perfil profesional.
            </p>

            <div className="bg-gray-50 p-4 border-l-4 border-gray-400 italic my-6 text-sm">
                <p className="font-bold not-italic mb-1">Para efectos de seguimiento académico:</p>
                <p>
                   Es indispensable que confirmes la recepción de este mensaje. Te pido responder a este correo con una breve nota que indique que has leído la información (por ejemplo: “Confirmo la recepción del correo”).
                </p>
            </div>

            <div className="mt-8 pt-6">
                <p className="font-bold">Cordialmente,</p>
                <br />
                <p className="font-bold">Maigualida Coromoto Zamora Esquiaqui</p>
                <p className="text-sm text-gray-600">Líder de Programa</p>
                <p className="text-sm text-gray-600">Licenciatura en Educación Infantil</p>
                <p className="text-sm text-gray-600">Escuela de Ciencias de la Educación - ECEDU</p>
                <p className="text-sm text-blue-600">maigualida.zamora@unad.edu.co</p>
            </div>
        </div>

        {/* Gratuidad Addendum */}
         <div className="mt-10 pt-6 border-t-2 border-gray-100 break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                <h3 className="text-sm font-bold text-gray-600 uppercase tracking-wide">Información para Estudiantes de Gratuidad / Generación E</h3>
            </div>
            
            <div className="text-sm bg-yellow-50 p-5 rounded-lg border border-yellow-100 text-gray-800 shadow-sm">
                <p className="mb-3">
                    Si usted es beneficiario de <strong>Política de Gratuidad, Generación E o Matrícula Cero</strong>, tenga en cuenta:
                </p>
                <p className="mb-4 font-bold text-yellow-800 flex items-center gap-2">
                    <span className="text-lg">⚠️</span> El beneficio cubre un máximo de 14 créditos académicos.
                </p>
                
                <p className="mb-4">
                    <strong>Carga sugerida exclusiva para Gratuidad (Máximo 14 créditos):</strong>
                    <br/>
                    <span className="text-xs text-gray-500">Selección optimizada de la lista anterior priorizando continuidad académica.</span>
                </p>

                {/* Gratuidad Table */}
                <div className="bg-white rounded border border-yellow-200 overflow-hidden mb-4">
                     <SuggestionTable suggestions={gratuidadBundle} showFooter={true} />
                </div>

                <p className="text-xs text-gray-600 italic">
                    <strong>Nota:</strong> Si decide matricular más créditos de los sugeridos en esta tabla específica (por ejemplo, la carga completa de 18), 
                    <strong>los créditos adicionales deberán ser pagados con recursos propios.</strong>
                </p>
            </div>
        </div>
        
        {/* Disclaimer */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center uppercase tracking-widest">
            Este reporte es una proyección académica basada en la información suministrada y el Acuerdo 038.
            <br/>
            El estudiante es responsable de su matrícula final.
        </div>

      </div>
    </div>
  );
};

export default Report;