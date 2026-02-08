import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Gemini 2.0 Flash - used for conversations
export const model = genAI.getGenerativeModel({
  model: 'gemini-2.0-flash',
})

// Gemini 2.5 Pro - used for analysis with thinking enabled
export const analysisModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-pro',
})

export const generationConfig = {
  temperature: 0.9,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
}

// Analysis-specific config with thinking enabled
// For Gemini 2.5 Pro, use thinkingBudget (not thinkingLevel)
// -1 = dynamic budget (up to 8192 tokens), or specify token count
export const analysisConfig = {
  temperature: 0.3,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 8192, // More tokens for detailed analysis
  thinkingConfig: {
    thinkingBudget: -1, // Dynamic thinking budget
  },
}
