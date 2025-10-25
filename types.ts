
export interface Topic {
  name: string;
  cleanedName: string;
}

export interface EnergyCenterContent {
    title: string;
    sanskritName: string;
    location: string;
    color: string;
    element: string;
    purpose: string;
    balancedState: string;
    unbalancedState:string;
    relatedConcepts: string[];
    practicalApplication: string;
    suggestedImagePrompt: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}