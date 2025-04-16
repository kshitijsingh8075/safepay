import OpenAI from "openai";

async function testOpenAI() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log("Testing OpenAI connection...");
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: "Generate a JSON object with 3 recent UPI scam alerts in India with title, description, and risk_level fields." }
      ],
      response_format: { type: "json_object" }
    });
    
    console.log("OpenAI Response:", response.choices[0].message.content);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("OpenAI Test Error:", error);
    throw error;
  }
}

export { testOpenAI };