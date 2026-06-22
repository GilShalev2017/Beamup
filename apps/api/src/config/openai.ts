import OpenAI from 'openai';

let openaiClient: OpenAI;

export const getOpenAI = (): OpenAI => {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY is not defined');
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
};

export default getOpenAI;
