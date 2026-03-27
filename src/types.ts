export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  hasCompletedOnboarding: boolean;
  onboardingData?: OnboardingData;
  lastLogin: any;
}

export interface OnboardingData {
  jobRole: string;
  typicalWorkHours: number;
  stressLevel: number; // 1-10
  fitnessGoals: string;
  sleepTarget: number;
}

export interface WellnessMetrics {
  sleepHours: number;
  dailySteps: number;
  heartRate: number;
  meetings: number;
  screenTime: number;
  focusTime: number;
  emailsSent: number;
  lastUpdated: string;
}

export type BurnoutRisk = 'Low' | 'Medium' | 'High';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}
