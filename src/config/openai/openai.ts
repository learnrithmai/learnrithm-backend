import { OpenAI } from "openai";
import { ENV } from "@/validations/envSchema";

const openai = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
});

export default openai;
