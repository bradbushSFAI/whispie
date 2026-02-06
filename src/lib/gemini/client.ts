import { GoogleGenerativeAI } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is not set')
}

export const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
})

export const generationConfig = {
  temperature: 0.9,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 1024,
}
