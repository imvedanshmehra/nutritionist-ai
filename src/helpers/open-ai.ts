import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process?.env?.OPEN_AI_KEY,
});

const config = {
  temperature: 1,
  max_tokens: 256,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0,
};

const model = "gpt-3.5-turbo";

export { openai, model, config };
