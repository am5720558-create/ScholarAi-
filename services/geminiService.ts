import { GoogleGenAI } from "@google/genai";
import { UserProfile, ChatMessage, QuizQuestion } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_TEXT = 'gemini-3-flash-preview'; 

export const generateNotes = async (
  content: string, 
  fileData: { mimeType: string; data: string } | null, 
  type: 'short' | 'detailed' | 'exam',
  userProfile: UserProfile
): Promise<string> => {
  try {
    const parts: any[] = [];
    
    // Add file if exists
    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data
        }
      });
    }

    // Add text prompt
    const prompt = `
      You are an expert private tutor for a student in Class ${userProfile.classLevel} (${userProfile.board}).
      The student's goal is: ${userProfile.goal}.
      
      Task: Create ${type} study notes based on the provided content.
      
      Formatting Requirements (Crucial):
      - Use strictly Markdown format.
      - Use clear headings (#, ##).
      - Use bullet points (-) for lists to make it readable.
      - Use tables (| col | col |) for ANY comparisons, pros/cons, or structured data.
      - Highlight key terms in **bold**.
      - Use blockquotes (>) for definitions or important tips.
      
      ${type === 'short' ? 'Keep it concise, focusing on high-level concepts and keywords.' : ''}
      ${type === 'detailed' ? 'Provide deep explanations, real-world examples, and derivations where applicable.' : ''}
      ${type === 'exam' ? 'Focus on questions likely to appear in exams, marking schemes, important definitions, and mnemonics.' : ''}

      Input Content to process:
      ${content ? content : '(See attached file)'}
    `;
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: { parts },
    });

    return response.text || "Sorry, I couldn't generate notes at this time.";
  } catch (error) {
    console.error("Error generating notes:", error);
    return "An error occurred while generating notes. Please try again.";
  }
};

export const chatWithAI = async (
  history: ChatMessage[], 
  newMessage: string, 
  userProfile: UserProfile
): Promise<string> => {
  try {
    const systemInstruction = `
      You are a friendly and encouraging AI tutor named "ScholarAI".
      User Profile: ${userProfile.name}, Class ${userProfile.classLevel}, ${userProfile.board}, Goal: ${userProfile.goal}.
      Subjects: ${userProfile.subjects.join(', ')}.
      
      Guidelines for Response:
      1. Structure your answer for maximum clarity.
      2. ALWAYS use bullet points or numbered lists for steps or lists.
      3. ALWAYS use Markdown tables (| col | col |) when comparing two concepts or listing data.
      4. Highlight key terms in **bold**.
      5. If the user asks for a "Real-life example", provide a relatable analogy.
      6. If the user asks for "Exam answer", structure it exactly how they should write it in an exam (Introduction, Points, Conclusion).
    `;

    // Using chat history for context
    const chat = ai.chats.create({
      model: MODEL_TEXT,
      config: { systemInstruction },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const response = await chat.sendMessage({ message: newMessage });
    return response.text || "I didn't catch that. Could you rephrase?";

  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting right now. Please try again later.";
  }
};

export const generateQuiz = async (topic: string, userProfile: UserProfile): Promise<QuizQuestion[]> => {
    try {
        const prompt = `
          Generate a practice quiz for Class ${userProfile.classLevel} student studying ${topic}.
          Board: ${userProfile.board}.
          Create 5 Multiple Choice Questions.
          
          Return the response ONLY as a raw JSON array. Do not add markdown code blocks (like \`\`\`json).
          
          Format:
          [
            {
              "id": 1,
              "question": "Question text here",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0, // Index of correct option (0-3)
              "explanation": "Why this is correct"
            }
          ]
        `;

        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });

        const text = response.text || "[]";
        // Clean up any potential markdown formatting just in case
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Quiz generation error:", error);
        return [];
    }
}

export const generateStudyPlan = async (
    hoursPerDay: number, 
    examDate: string, 
    userProfile: UserProfile
): Promise<string> => {
    try {
        const prompt = `
            Create a personalized study table/schedule for ${userProfile.name}.
            Class: ${userProfile.classLevel}, Board: ${userProfile.board}.
            Subjects: ${userProfile.subjects.join(', ')}.
            Goal: ${userProfile.goal}.
            Available Study Hours/Day: ${hoursPerDay}.
            Target Exam Date: ${examDate}.

            Please create a structured plan using a Markdown Table.
            Columns: Day/Time, Subject, Topic Focus, Activity (Read/Practice/Revise).
            Also add a section for "Weekly Goals" and "Tips for Success" using bullet points.
        `;

        const response = await ai.models.generateContent({
            model: MODEL_TEXT,
            contents: prompt
        });

        return response.text || "Could not generate plan.";
    } catch (error) {
        console.error("Planner error:", error);
        return "Error creating plan.";
    }
}