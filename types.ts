export enum CourseState {
  APROBADO = 'APROBADO',
  REPROBADO = 'REPROBADO',
  EN_CURSO = 'EN_CURSO',
  PENDIENTE = 'PENDIENTE' // For new plan courses not yet taken
}

export interface ExtractedCourse {
  code: string;
  name: string;
  grade: number;
  state: CourseState;
  period: string;
}

export interface NewPlanCourse {
  code: string;
  name: string;
  credits: number;
  period: number; // 1-9
  type: 'OBLIGATORIO' | 'ELECTIVO_IBC' | 'ELECTIVO_DE' | 'ELECTIVO_FC';
  prerequisites?: string[];
}

export interface StudentProgress {
  totalCredits: number;
  approvedCredits: number;
  pendingCredits: number;
  percentage: number;
  mappedCourses: Map<string, CourseState>; // NewPlanCode -> State
  history: ExtractedCourse[];
  studentName: string;
  studentId: string;
}

export interface Suggestion {
  priority: 'ALTA' | 'MEDIA' | 'BAJA';
  course: NewPlanCourse;
  justification: string;
}

export interface AnalysisResult {
  progress: StudentProgress;
  suggestions: Suggestion[];
  gratuidadBundle: Suggestion[];
}