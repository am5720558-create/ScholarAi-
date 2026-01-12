export type BoardType = 'CBSE' | 'ICSE' | 'State Board' | 'Other';
export type GoalType = 'Exams' | 'Concept Clarity' | 'Revision';
export type ClassLevel = '6' | '7' | '8' | '9' | '10' | '11' | '12' | 'Competitive';

export interface UserProfile {
  name: string;
  board: BoardType;
  classLevel: ClassLevel;
  subjects: string[];
  goal: GoalType;
  onboardingComplete: boolean;
}

export type ViewState = 'LANDING' | 'ONBOARDING' | 'DASHBOARD' | 'NOTES' | 'CHAT' | 'PRACTICE' | 'PLANNER';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface NoteOption {
  type: 'short' | 'detailed' | 'exam';
  label: string;
  description: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}