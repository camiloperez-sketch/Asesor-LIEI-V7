import { NewPlanCourse } from './types';

// Agreement 038 Equivalency Map: Old Code -> New Code(s) or Special Action
export const EQUIVALENCY_MAP: Record<string, string> = {
  '80017': '80017',
  '700004': '700004',
  '40003': '40003',
  '40002': '40002',
  '150001': '150001',
  '900001': '900001',
  '900002': '900002',
  '900003': '900003',
  '900005': '900005',
  '200610': '200610',
  '200611': 'ELECTIVO_IBC_1', // Special mapping
  '112001': 'ELECTIVO_IBC_2', // Special mapping
  '50004': '520027',
  '401302': '517022',
  '401305': '517020',
  '401307': '517021',
  '50001': '520025',
  '50002': '517023',
  '50005': '500001',
  '401304': '520026',
  '50003': '517018',
  '514518': '502707680',
  '514519': '514519',
  '514517': '514517',
  '514006': '514006',
  '514505': '514505',
  '514502': '514502',
  '514017': '514017',
  '514507': '514507',
  '514506': '514506',
  '514512': '514512',
  '514508': '514508',
  '514516': '514516',
  '514004': '514004',
  '514501': '514501',
  '514005': '502707682',
  '514515': '514515',
  '514003': '514003',
  '514503': 'ELECTIVO_DE_1', // Special mapping
};

// Full New Curriculum (156 Credits) with Prerequisites
export const NEW_PLAN: NewPlanCourse[] = [
  // Period 1
  { code: '502707680', name: 'Introducción a la Licenciatura', credits: 3, period: 1, type: 'OBLIGATORIO' },
  { code: '514519', name: 'Lectura y escritura académicas', credits: 3, period: 1, type: 'OBLIGATORIO' },
  { code: '80017', name: 'Catedra Unadista', credits: 3, period: 1, type: 'OBLIGATORIO' },
  { code: '200610', name: 'Herramientas Digitales', credits: 3, period: 1, type: 'OBLIGATORIO' },
  { code: '40003', name: 'Competencias Comunicativas', credits: 3, period: 1, type: 'OBLIGATORIO' },
  { code: '40002', name: 'Ética y ciudadanía', credits: 3, period: 1, type: 'OBLIGATORIO' },
  // Period 2
  { code: '514517', name: 'Infancia: historias y perspectivas', credits: 3, period: 2, type: 'OBLIGATORIO' },
  { code: '520027', name: 'Epistemología e historia de la pedagogía', credits: 3, period: 2, type: 'OBLIGATORIO' },
  { code: '150001', name: 'Fundamentos de investigación', credits: 3, period: 2, type: 'OBLIGATORIO' },
  { code: '517022', name: 'Teorías del aprendizaje', credits: 3, period: 2, type: 'OBLIGATORIO' },
  { code: '517031', name: 'Matemáticas para la resolución de problemas', credits: 3, period: 2, type: 'OBLIGATORIO' },
  { code: '520025', name: 'Ética de la profesión docente', credits: 3, period: 2, type: 'OBLIGATORIO' },
  // Period 3
  { code: '514502', name: 'Políticas y programas de atención', credits: 3, period: 3, type: 'OBLIGATORIO' },
  { code: '517020', name: 'Didáctica', credits: 3, period: 3, type: 'OBLIGATORIO' },
  { code: '517021', name: 'Enfoques curriculares', credits: 3, period: 3, type: 'OBLIGATORIO' },
  { code: '517027', name: 'Educación para la transformación social', credits: 3, period: 3, type: 'OBLIGATORIO' },
  { code: '514006', name: 'Salud y desarrollo infantil', credits: 3, period: 3, type: 'OBLIGATORIO' },
  { code: '502707681', name: 'Educación infantil en perspectiva de género', credits: 3, period: 3, type: 'OBLIGATORIO' },
  // Period 4
  { code: '514505', name: 'Desarrollo socioafectivo y moral', credits: 3, period: 4, type: 'OBLIGATORIO' },
  { code: '514017', name: 'Pedagogía y didácticas para la inclusión', credits: 3, period: 4, type: 'OBLIGATORIO' },
  { code: '517023', name: 'Investigación educativa y pedagógica', credits: 3, period: 4, type: 'OBLIGATORIO', prerequisites: ['150001'] },
  { code: '514506', name: 'Educación, familia y comunidad', credits: 3, period: 4, type: 'OBLIGATORIO' },
  { code: '520026', name: 'Evaluación', credits: 3, period: 4, type: 'OBLIGATORIO' },
  { code: '900001', name: 'Inglés A1', credits: 3, period: 4, type: 'OBLIGATORIO' },
  // Period 5
  { code: '514515', name: 'Juego, lúdica y psicomotricidad', credits: 3, period: 5, type: 'OBLIGATORIO' },
  { code: '502707682', name: 'Exploración del medio en la infancia', credits: 3, period: 5, type: 'OBLIGATORIO' },
  { code: '514507', name: 'Investigación en educación Infantil', credits: 3, period: 5, type: 'OBLIGATORIO', prerequisites: ['517023'] },
  { code: '502707683', name: 'Maestros, infancias y contextos', credits: 3, period: 5, type: 'OBLIGATORIO', prerequisites: ['517020', '517023', '520026', '517027', '514502', '514006'] }, // Práctica 1 (Approximate prerequisites based on curriculum logic)
  { code: '517028', name: 'Escenarios educativos inclusivos', credits: 3, period: 5, type: 'OBLIGATORIO' },
  { code: '900002', name: 'Inglés A2', credits: 3, period: 5, type: 'OBLIGATORIO', prerequisites: ['900001'] },
  // Period 6
  { code: '514516', name: 'Construcción de la lengua escrita', credits: 3, period: 6, type: 'OBLIGATORIO' },
  { code: '514003', name: 'Arte y Educación Artística', credits: 3, period: 6, type: 'OBLIGATORIO' },
  { code: '517018', name: 'Prácticas educativas mediadas por TIC', credits: 3, period: 6, type: 'OBLIGATORIO' },
  { code: '502707684', name: 'Maestro innovador reflexivo', credits: 3, period: 6, type: 'OBLIGATORIO', prerequisites: ['502707683'] }, // Práctica 2
  { code: 'ELECTIVO_DE_1', name: 'Electivo Disciplinar 1', credits: 3, period: 6, type: 'ELECTIVO_DE' },
  { code: '900003', name: 'Inglés B1', credits: 3, period: 6, type: 'OBLIGATORIO', prerequisites: ['900002'] },
  // Period 7
  { code: '514501', name: 'Literatura y oralidad en la Infancia', credits: 3, period: 7, type: 'OBLIGATORIO' },
  { code: '514005', name: 'Desarrollo del pensamiento lógico-matemático', credits: 3, period: 7, type: 'OBLIGATORIO' },
  { code: '500001', name: 'Administración y gestión educativa', credits: 3, period: 7, type: 'OBLIGATORIO' },
  { code: '502707685', name: 'Maestro investigador reflexivo', credits: 3, period: 7, type: 'OBLIGATORIO', prerequisites: ['502707684'] }, // Práctica 3
  { code: 'ELECTIVO_IBC_1', name: 'Electivo IBC 1', credits: 3, period: 7, type: 'ELECTIVO_IBC' },
  { code: '900005', name: 'Inglés B2', credits: 3, period: 7, type: 'OBLIGATORIO', prerequisites: ['900003'] },
  // Period 8
  { code: '514511', name: 'Bilingüismo en educación infantil', credits: 3, period: 8, type: 'OBLIGATORIO', prerequisites: ['900005'] },
  { code: '514508', name: 'Uso de la TIC en educación infantil', credits: 3, period: 8, type: 'OBLIGATORIO' },
  { code: '514512', name: 'Gestión de proyectos', credits: 3, period: 8, type: 'OBLIGATORIO', prerequisites: ['500001'] },
  { code: '502707686', name: 'Maestro investigador transformativo', credits: 3, period: 8, type: 'OBLIGATORIO', prerequisites: ['502707685'] }, // Práctica 4
  { code: '520024', name: 'Legislación educativa', credits: 3, period: 8, type: 'OBLIGATORIO' },
  { code: 'ELECTIVO_DE_2', name: 'Electivo Disciplinar 2', credits: 3, period: 8, type: 'ELECTIVO_DE' },
  { code: 'ELECTIVO_FC_1', name: 'Electivo Compl. 1', credits: 3, period: 8, type: 'ELECTIVO_FC' },
  // Period 9
  { code: 'ELECTIVO_DE_3', name: 'Electivo Disciplinar 3', credits: 3, period: 9, type: 'ELECTIVO_DE' },
  { code: 'ELECTIVO_IBC_2', name: 'Electivo IBC 2', credits: 3, period: 9, type: 'ELECTIVO_IBC' },
  { code: 'ELECTIVO_FC_2', name: 'Electivo Compl. 2', credits: 3, period: 9, type: 'ELECTIVO_FC' },
  { code: '502707687', name: 'Cátedra de infancias', credits: 3, period: 9, type: 'OBLIGATORIO', prerequisites: ['502707686'] }, // Práctica 5
  { code: '700004', name: 'Prestación servicio social unadista', credits: 0, period: 9, type: 'OBLIGATORIO' },
  { code: 'ELECTIVO_FC_3', name: 'Electivo Compl. 3', credits: 3, period: 9, type: 'ELECTIVO_FC' },
];

export const DEMO_OCR_TEXT = `
Sistema Integrado de Información 4.0
Plataforma AUREA Historial de calificaciones
Estudiante: CC 1001805394 - ROSA MARIA MANCHEGO MORENO
...
200611 PENSAMIENTO LÓGICO Y MATEMÁTICO 3.0 4.0 3.3 3
40002 ÉTICA Y CIUDADANÍA (PREGRADO) 4.6 1.2 3.8 3
401302 TEORÍAS DEL APRENDIZAJE 3.9 2.9 3.7 3
...
VIGENCIA 2025-1
2025 I PERIODO 16-01
259915406420 514003 ARTE Y EDUCACIÒN ARTISTICA EN LA INFANCIA 3 T/P 3.6 4.7 3.9 Aprobado
`;