import { GoogleGenAI } from "@google/genai";
import { ExtractedCourse, CourseState } from '../types';

const API_KEY = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface AnalysisInput {
  mimeType: string;
  data: string;
}

export const analyzeTranscript = async (files: AnalysisInput[], textContext?: string): Promise<{
  studentName: string;
  studentId: string;
  courses: ExtractedCourse[];
}> => {
  const modelId = 'gemini-2.5-flash';

  // Revised Prompt for "Registro Académico Individual" with strict header extraction
  const systemInstruction = `
    Extract academic data from the "Registro Académico Individual" PDF.

    1. **Student Info (CRITICAL)**: 
       - Look at the very top of the document.
       - Extract "Estudiante:" or "CC" -> studentId.
       - Extract "Nombre:" -> studentName.
       - If student name is missing, look for lines with names in uppercase at the top.

    2. **Course Data**: The document has sections starting with headers like "VIGENCIA 2023-1", "VIGENCIA 2025-2", "2025 II PERIODO 16-04", etc.
    
    For EACH course row found, extract:
    - **Code** (Código Curso)
    - **Name** (Curso Académico)
    - **Grade** (Calificación Final). Important: This column might contain a number (4.5), "Aprobado", "Reprobado", or be empty.
    - **Observation** (Observación). e.g. "Aprobado".
    - **Period Header**: The specific section header (e.g., "VIGENCIA 2025-2" or "2025 II PERIODO 16-04") that appears *above* this course.
    
    Return valid JSON:
    {
      "studentName": "string",
      "studentId": "string",
      "courses": [
        { 
          "code": "string", 
          "name": "string", 
          "grade": "string",
          "observation": "string",
          "periodHeader": "string" 
        }
      ]
    }
  `;

  const parts: any[] = [];

  files.forEach(file => {
    parts.push({
      inlineData: {
        mimeType: file.mimeType,
        data: file.data
      }
    });
  });

  if (textContext) {
    parts.push({ text: `Context:\n${textContext}` });
  }

  parts.push({ text: `Extract valid JSON.` });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: "application/json"
      }
    });

    let jsonText = response.text || "{}";
    jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Heuristic cleaning
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonText);
    const rawCourses = Array.isArray(parsed.courses) ? parsed.courses : [];
    const extractedCourses: ExtractedCourse[] = [];

    rawCourses.forEach((raw: any) => {
      const code = String(raw.code || '').trim();
      const name = String(raw.name || '').trim();
      const gradeStr = String(raw.grade || '').trim().toLowerCase();
      const obsStr = String(raw.observation || '').trim().toLowerCase();
      const periodHeader = String(raw.periodHeader || '').trim().toUpperCase();

      if (!code || code.length < 3) return;
      if (name.toLowerCase().includes('negado luego de estudio')) return;

      let grade = 0.0;
      let state = CourseState.REPROBADO; // Default
      
      // 1. Check for 700004 (Servicio Social)
      if (code === '700004') {
        const text = (gradeStr + ' ' + obsStr).toLowerCase();
        if (text.includes('no aprobado') || text.includes('reprobado')) {
          state = CourseState.REPROBADO;
          grade = 0.0;
        } else {
          // Assume approved if present and not failed
          state = CourseState.APROBADO;
          grade = 5.0; 
        }
      } 
      else {
        // 2. Standard Logic
        
        // Extract numeric grade
        const gradeMatch = gradeStr.match(/(\d\.\d)/);
        if (gradeMatch) {
          grade = parseFloat(gradeMatch[0]);
        }

        // Check for 2025-II (En Curso)
        // Headers look like: "VIGENCIA 2025-2", "2025 II PERIODO 16-04"
        const isCurrentPeriod = (periodHeader.includes('2025') && (periodHeader.includes('II') || periodHeader.includes('16-04') || periodHeader.includes('2025-2')));

        if (isCurrentPeriod) {
          state = CourseState.EN_CURSO;
        } else {
          // Historical
          if (grade >= 3.0) {
            state = CourseState.APROBADO;
          } else if ((gradeStr.includes('aprobado') || obsStr.includes('aprobado')) && !gradeStr.includes('no') && !obsStr.includes('no')) {
             // Qualitative approval (e.g. Homologation)
             state = CourseState.APROBADO;
             if (grade === 0) grade = 3.5;
          } else {
             state = CourseState.REPROBADO;
          }
        }
      }

      extractedCourses.push({
        code,
        name,
        grade,
        state,
        period: periodHeader || 'Histórico'
      });
    });

    return {
      studentName: parsed.studentName || "Estudiante UNAD",
      studentId: parsed.studentId || "",
      courses: extractedCourses
    };

  } catch (error) {
    console.error("Gemini Extraction Failed:", error);
    return {
        studentName: "No detectado",
        studentId: "",
        courses: []
    };
  }
};