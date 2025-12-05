import { GoogleGenAI, Type } from "@google/genai";
import { PodcastConfig, ScriptLine } from "../types";

export const generatePodcastScript = async (config: PodcastConfig): Promise<ScriptLine[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  let prompt = `
    Create a natural, engaging podcast dialogue between two hosts, ${config.speaker1.name} and ${config.speaker2.name}.
    
    Language: ${config.language} (The script MUST be in this language, but you can use English loan words if common in that language).
    Length: ${config.duration === 'Short' ? 'Approx 150 words' : config.duration === 'Medium' ? 'Approx 300 words' : 'Approx 500 words'}.
    
    Format the output as a JSON array where each object has:
    - "speakerId": either "${config.speaker1.id}" or "${config.speaker2.id}"
    - "speakerName": the name of the speaker
    - "text": the spoken text
    
    Make it sound conversational, with reactions, slight interruptions, and enthusiasm.
  `;

  const contents: any[] = [];

  if (config.sourceMode === 'file' && config.file) {
    prompt += `\n\nBased on the attached document/content below, generate the podcast script.`;
    
    if (config.file.type === 'application/pdf') {
      // Send PDF as inline data
      contents.push({
        text: prompt
      });
      contents.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: config.file.content
        }
      });
    } else {
      // Send extracted text (DOCX or TXT)
      prompt += `\n\nDOCUMENT CONTENT:\n${config.file.content}`;
      contents.push({ text: prompt });
    }
  } else {
    // Topic Mode
    prompt += `\n\nTopic: ${config.topic}`;
    contents.push({ text: prompt });
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speakerId: { type: Type.STRING },
            speakerName: { type: Type.STRING },
            text: { type: Type.STRING },
          },
          required: ["speakerId", "speakerName", "text"],
        },
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to generate script");
  }

  try {
    return JSON.parse(response.text) as ScriptLine[];
  } catch (e) {
    console.error("Failed to parse script JSON", e);
    throw new Error("Invalid script format returned from AI");
  }
};
