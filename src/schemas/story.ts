export interface Story {
  id: string;
  epicId: string;
  title: string;
  description: string;
  businessValue: string;

  acceptanceCriteria: string[];

  technicalRequirements: string[];

  dependencies: string[];

  hldReferences: string[];

  estimate: {
    storyPoints: number;
  };
}