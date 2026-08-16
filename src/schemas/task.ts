export interface Task {
  id: string;
  storyId: string;
  title: string;
  description: string;
  technicalDetails: string[];
  dependencies: string[];
  estimate: {
    hours: number;
  };
}
