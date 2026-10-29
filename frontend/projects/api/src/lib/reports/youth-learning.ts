/** A youth's lessons, quiz average, modules, best quiz scores and badges. */
export interface YouthLearning {
  completedLessons: number;
  totalLessons: number;
  completion: number | null;
  quizAverage: number | null;
  modules: {
    moduleId: string;
    title: string;
    done: number;
    total: number;
    state: 'Done' | 'InProgress' | 'NotStarted';
  }[];
  quizzes: { quizId: string; title: string; bestScore: number }[];
  badges: string[];
}
