import OpenAI from 'openai';
import * as fs from 'fs/promises';

export interface TEASQuestion {
  subject: 'Reading' | 'Math' | 'Science' | 'English';
  question: string;
  choices: {
    option: 'A' | 'B' | 'C' | 'D';
    text: string;
    explanation: string;
  }[];
  correct: 'A' | 'B' | 'C' | 'D';
  rationale: string;
}

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("OPENAI_API_KEY environment variable is not set. Please set it to proceed.");
}

const openai = new OpenAI({ apiKey });

function buildPrompt(subject: TEASQuestion['subject']): string {
  return `
Generate an original TEAS format question for the subject: ${subject}.
Respond ONLY with a JSON that follows the model below (no comments or extra text):
{
  "subject": "${subject}",
  "question": "Your question here",
  "choices": [
    { "option": "A", "text": "Option A", "explanation": "Explain why it's correct/incorrect." },
    { "option": "B", "text": "Option B", "explanation": "Explain why it's correct/incorrect." },
    { "option": "C", "text": "Option C", "explanation": "Explain why it's correct/incorrect." },
    { "option": "D", "text": "Option D", "explanation": "Explain why it's correct/incorrect." }
  ],
  "correct": "Correct letter",
  "rationale": "Explain in detail why the correct option is right."
}
Do not add explanation before/after the JSON.
The question should be multiple choice, original, realistic, TEAS level.
`;
}

function extractJSON(text: string): TEASQuestion {
  const match = text.match(/\{[\s\S]*?\}/);
  if (!match) {
    throw new Error("No JSON found in the OpenAI response.");
  }
  try {
    const parsed = JSON.parse(match[0]);
    
    if (!parsed.subject || !parsed.question || !parsed.choices || !parsed.correct || !parsed.rationale) {
      throw new Error("Invalid question structure: missing required fields");
    }
    
    if (!Array.isArray(parsed.choices) || parsed.choices.length !== 4) {
      throw new Error("Invalid choices: must be an array of 4 options");
    }
    
    return parsed as TEASQuestion;
  } catch (parseError: any) {
    throw new Error(`Failed to parse JSON from response: ${parseError.message}. Raw text: ${text}`);
  }
}

export async function generateTEASQuestion(
  subject: TEASQuestion['subject'],
  retries: number = 3
): Promise<TEASQuestion> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Generating ${subject} question (attempt ${attempt}/${retries})...`);
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: buildPrompt(subject) }],
        temperature: 0.8,
        max_tokens: 800,
        response_format: { type: "json_object" }
      });

      const choice = completion.choices?.[0];
      if (!choice || !choice.message || !choice.message.content) {
        throw new Error("Invalid or empty response structure from OpenAI API");
      }

      const text = choice.message.content;
      return extractJSON(text);

    } catch (error: any) {
      lastError = error;
      console.error(`Attempt ${attempt} failed for ${subject}:`, error.message);
      
      if (attempt < retries) {
        const backoffDelay = Math.pow(2, attempt) * 1000;
        console.log(`Retrying in ${backoffDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw new Error(`Failed to generate question for ${subject} after ${retries} attempts: ${lastError!.message}`);
}

export async function generateTEASQuestionsBatch(
  subjectCounts: { subject: TEASQuestion['subject'], count: number }[],
  options: {
    delayMs?: number;
    retries?: number;
    maxConcurrent?: number;
  } = {}
): Promise<TEASQuestion[]> {
  const { delayMs = 1200, retries = 3, maxConcurrent = 1 } = options;
  const allQuestions: TEASQuestion[] = [];
  
  const questionsToGenerate: { subject: TEASQuestion['subject'], index: number }[] = [];
  for (const { subject, count } of subjectCounts) {
    for (let i = 0; i < count; i++) {
      questionsToGenerate.push({ subject, index: i + 1 });
    }
  }
  
  for (let i = 0; i < questionsToGenerate.length; i += maxConcurrent) {
    const batch = questionsToGenerate.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async ({ subject, index }) => {
      try {
        const totalForSubject = subjectCounts.find(sc => sc.subject === subject)?.count || 0;
        console.log(`Generating ${subject} question ${index}/${totalForSubject}...`);
        
        const question = await generateTEASQuestion(subject, retries);
        console.log(`✓ Successfully generated ${subject} question ${index}/${totalForSubject}`);
        return question;
      } catch (error: any) {
        console.error(`✗ Failed to generate ${subject} question ${index}: ${error.message}`);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    for (const result of batchResults) {
      if (result) {
        allQuestions.push(result);
      }
    }
    
    if (i + maxConcurrent < questionsToGenerate.length) {
      console.log(`Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  const totalRequested = subjectCounts.reduce((acc, curr) => acc + curr.count, 0);
  console.log(`\nBatch complete: ${allQuestions.length}/${totalRequested} questions generated successfully`);
  
  return allQuestions;
}

export async function saveQuestionsAsJson(
  questions: TEASQuestion[],
  filePath: string
): Promise<void> {
  try {
    await fs.writeFile(filePath, JSON.stringify(questions, null, 2));
    console.log(`✓ Questions successfully saved to ${filePath}`);
  } catch (error: any) {
    console.error(`✗ Error saving questions to JSON file ${filePath}:`, error.message);
    throw error;
  }
}

export async function saveQuestionsAsTS(
  questions: TEASQuestion[],
  filePath: string
): Promise<void> {
  try {
    const tsContent = `import { TEASQuestion } from './types';

export const teasQuestions: TEASQuestion[] = ${JSON.stringify(questions, null, 2)};
`;
    await fs.writeFile(filePath, tsContent);
    console.log(`✓ Questions successfully saved to ${filePath}`);
  } catch (error: any) {
    console.error(`✗ Error saving questions to TypeScript file ${filePath}:`, error.message);
    throw error;
  }
}

export function validateTEASQuestion(question: any): question is TEASQuestion {
  return (
    question &&
    typeof question.subject === 'string' &&
    ['Reading', 'Math', 'Science', 'English'].includes(question.subject) &&
    typeof question.question === 'string' &&
    Array.isArray(question.choices) &&
    question.choices.length === 4 &&
    question.choices.every((choice: any) => 
      choice &&
      typeof choice.option === 'string' &&
      ['A', 'B', 'C', 'D'].includes(choice.option) &&
      typeof choice.text === 'string' &&
      typeof choice.explanation === 'string'
    ) &&
    typeof question.correct === 'string' &&
    ['A', 'B', 'C', 'D'].includes(question.correct) &&
    typeof question.rationale === 'string'
  );
}

export async function example() {
  try {
    const questions = await generateTEASQuestionsBatch([
      { subject: 'Math', count: 2 },
      { subject: 'Science', count: 2 },
      { subject: 'Reading', count: 1 },
      { subject: 'English', count: 1 }
    ], {
      delayMs: 1000,
      retries: 2,
      maxConcurrent: 1
    });
    
    await saveQuestionsAsJson(questions, './teas-questions.json');
    await saveQuestionsAsTS(questions, './teas-questions.ts');
    
    console.log('Generation complete!');
  } catch (error) {
    console.error('Generation failed:', error);
  }
}