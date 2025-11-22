import { ExtractedCourse, CourseState, StudentProgress, Suggestion, NewPlanCourse, AnalysisResult } from '../types';
import { EQUIVALENCY_MAP, NEW_PLAN } from '../constants';

export const processStudentData = (extracted: ExtractedCourse[], studentName: string, studentId: string): AnalysisResult => {
  const mappedCourses = new Map<string, CourseState>();
  let approvedCredits = 0;

  // 1. Map Extracted to New Plan
  extracted.forEach(course => {
    // Clean code strict: remove all non-numeric characters
    const cleanCode = course.code.replace(/[^0-9]/g, '');

    // Strategy A: Check Equivalency Map (Old -> New)
    let newPlanCode: string | undefined = EQUIVALENCY_MAP[cleanCode];

    // Strategy B: Check Self-Reference (New -> New)
    // If the extracted code already exists in the NEW_PLAN, map it to itself.
    if (!newPlanCode) {
      const directMatch = NEW_PLAN.find(p => p.code === cleanCode);
      if (directMatch) {
        newPlanCode = cleanCode;
      }
    }

    if (newPlanCode) {
      const existingState = mappedCourses.get(newPlanCode);
      const incomingState = course.state;

      // Hierarchy: APROBADO > EN_CURSO > REPROBADO > PENDIENTE
      if (existingState === CourseState.APROBADO) {
        return; 
      }
      
      if (incomingState === CourseState.APROBADO) {
        mappedCourses.set(newPlanCode, CourseState.APROBADO);
      } 
      else if (incomingState === CourseState.EN_CURSO) {
         mappedCourses.set(newPlanCode, CourseState.EN_CURSO);
      }
      else if (incomingState === CourseState.REPROBADO && existingState !== CourseState.EN_CURSO) {
         mappedCourses.set(newPlanCode, CourseState.REPROBADO);
      }
    }
  });

  // Calculate Credits
  NEW_PLAN.forEach(course => {
    if (mappedCourses.get(course.code) === CourseState.APROBADO) {
      approvedCredits += course.credits;
    }
  });

  const totalCredits = 156;
  const percentage = Math.min(100, (approvedCredits / totalCredits) * 100);

  // 2. Generate Suggestions using Candidate Pool Strategy
  const candidates: Suggestion[] = [];
  
  // Helper to check if prerequisites are met
  // A prerequisite is met if it is APROBADO or EN_CURSO
  const checkPrerequisites = (course: NewPlanCourse): boolean => {
    if (!course.prerequisites || course.prerequisites.length === 0) return true;
    return course.prerequisites.every(preReqCode => {
      const state = mappedCourses.get(preReqCode);
      return state === CourseState.APROBADO || state === CourseState.EN_CURSO;
    });
  };

  // Helper to check if a prerequisite is currently "En Curso" (Sequence Continuity)
  const isContinuity = (course: NewPlanCourse): boolean => {
    if (!course.prerequisites) return false;
    return course.prerequisites.some(preReqCode => mappedCourses.get(preReqCode) === CourseState.EN_CURSO);
  };

  for (const course of NEW_PLAN) {
    const status = mappedCourses.get(course.code);

    // We only suggest if NOT Approved and NOT En Curso
    if (status !== CourseState.APROBADO && status !== CourseState.EN_CURSO) {
      
      // Check if prerequisites are met
      if (checkPrerequisites(course)) {
        let priority: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
        let justification = `Curso de Periodo ${course.period} pendiente.`;

        // Priority Rules
        if (status === CourseState.REPROBADO) {
          priority = 'ALTA';
          justification = 'Curso reprobado anteriormente.';
        } else if (isContinuity(course)) {
          priority = 'ALTA';
          justification = 'Continuidad de ruta académica (Prerrequisito en curso).';
        }

        candidates.push({
          priority,
          course,
          justification
        });
      }
    }
  }

  // Sort Candidates: ALTA > MEDIA > BAJA, then by Period
  candidates.sort((a, b) => {
    if (a.priority === 'ALTA' && b.priority !== 'ALTA') return -1;
    if (a.priority !== 'ALTA' && b.priority === 'ALTA') return 1;
    return a.course.period - b.course.period;
  });

  // Fill Suggestions up to MAX_LOAD (18 credits)
  const MAX_LOAD = 18;
  let currentLoad = 0;
  const suggestions: Suggestion[] = [];

  for (const candidate of candidates) {
    if (currentLoad + candidate.course.credits <= MAX_LOAD) {
      suggestions.push(candidate);
      currentLoad += candidate.course.credits;
    }
  }

  // 3. Generate Gratuidad Bundle (Max 14 Credits)
  const gratuidadBundle: Suggestion[] = [];
  let gratuidadLoad = 0;
  
  // We reuse the sorted suggestions list because it already prioritizes High Priority items.
  // We iterate through the *selected suggestions* first to maintain consistency with the main plan.
  // If we run out of suggestions in the main bundle (e.g., total < 14), we could look at candidates again, 
  // but usually we just subset the main suggestion list.
  
  for (const sug of suggestions) {
    if (gratuidadLoad + sug.course.credits <= 14) {
      gratuidadBundle.push(sug);
      gratuidadLoad += sug.course.credits;
    }
  }

  return {
    progress: {
      totalCredits,
      approvedCredits,
      pendingCredits: totalCredits - approvedCredits,
      percentage,
      mappedCourses,
      history: extracted,
      studentName,
      studentId
    },
    suggestions,
    gratuidadBundle
  };
};