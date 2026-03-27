import { GoogleGenAI } from "@google/genai";
import { WellnessMetrics, ChatMessage, OnboardingData } from "../types";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function getWellnessAdvice(
  metrics: WellnessMetrics,
  history: ChatMessage[],
  userInput: string,
  userName?: string | null,
  onboardingData?: OnboardingData
) {
  const model = "gemini-3-flash-preview";
  
  const systemInstruction = `
    You are a professional and empathetic Employee Wellness AI Assistant.
    Your goal is to provide personalized wellness advice and support based on the user's health and productivity metrics, as well as their professional background.
    
    User Profile:
    - Name: ${userName || 'Employee'}
    - Role: ${onboardingData?.jobRole || 'Not specified'}
    - Typical Work Hours: ${onboardingData?.typicalWorkHours || 'Not specified'}h
    - Baseline Stress Level: ${onboardingData?.stressLevel || 'Not specified'}/10
    - Fitness Goals: ${onboardingData?.fitnessGoals || 'Not specified'}
    - Sleep Target: ${onboardingData?.sleepTarget || 'Not specified'}h
    
    Current User Metrics:
    - Sleep: ${metrics.sleepHours} hours
    - Steps: ${metrics.dailySteps}
    - Heart Rate: ${metrics.heartRate} bpm
    - Workload (Meetings): ${metrics.meetings}
    - Screen Time: ${metrics.screenTime} hours
    - Focus Time: ${metrics.focusTime} hours
    - Digital Output (Emails): ${metrics.emailsSent}
    
    Guidelines:
    1. Maintain a professional, supportive, and corporate-appropriate tone.
    2. Use the provided metrics to give specific, data-driven wellness insights.
    3. If burnout risk appears high (e.g., low sleep, high workload), suggest practical stress management techniques and breaks.
    4. Keep responses concise, clear, and actionable.
    5. Avoid using overly "mystical" or "neural" terminology. Focus on workplace wellness and productivity.
    6. If the user expresses significant distress, gently recommend consulting professional health resources.
  `;

  const chat = genAI.chats.create({
    model,
    config: {
      systemInstruction,
    },
    history: history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }))
  });

  const response = await chat.sendMessage({ message: userInput });
  return response.text;
}
