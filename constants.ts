import { BoardType, ClassLevel, GoalType, NoteOption } from './types';

export const BOARDS: BoardType[] = ['CBSE', 'ICSE', 'State Board', 'Other'];
export const CLASSES: ClassLevel[] = ['6', '7', '8', '9', '10', '11', '12', 'Competitive'];
export const GOALS: GoalType[] = ['Exams', 'Concept Clarity', 'Revision'];

export const SUBJECTS_LIST = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English',
  'History',
  'Geography',
  'Economics',
  'Accountancy',
  'Business Studies',
  'AI',
  'Marketing',
  'Political Science',
  'Psychology',
  'Sociology'
];

export const NOTE_OPTIONS: NoteOption[] = [
  { type: 'short', label: 'Short Summary', description: 'Quick bullet points for fast review.' },
  { type: 'detailed', label: 'Detailed Notes', description: 'In-depth explanation with examples.' },
  { type: 'exam', label: 'Exam-Oriented', description: 'Focus on key questions, definitions, and marks.' },
];
