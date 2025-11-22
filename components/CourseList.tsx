import React from 'react';
import { ExtractedCourse, CourseState } from '../types';

interface CourseListProps {
  courses: ExtractedCourse[];
}

const CourseList: React.FC<CourseListProps> = ({ courses }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm text-left text-gray-500">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
          <tr>
            <th className="px-4 py-2">Código</th>
            <th className="px-4 py-2">Nombre</th>
            <th className="px-4 py-2">Nota</th>
            <th className="px-4 py-2">Estado</th>
            <th className="px-4 py-2">Periodo</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c, idx) => (
            <tr key={`${c.code}-${idx}`} className="bg-white border-b hover:bg-gray-50">
              <td className="px-4 py-2 font-medium text-gray-900">{c.code}</td>
              <td className="px-4 py-2 truncate max-w-xs" title={c.name}>{c.name}</td>
              <td className="px-4 py-2 font-bold">{c.grade}</td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold
                  ${c.state === CourseState.APROBADO ? 'bg-green-100 text-green-800' :
                    c.state === CourseState.REPROBADO ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'}`}>
                  {c.state}
                </span>
              </td>
              <td className="px-4 py-2">{c.period}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CourseList;