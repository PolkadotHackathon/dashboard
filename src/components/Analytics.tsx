import OpenAI from "openai";
import { useState, useEffect } from "react";

const env = import.meta.env;

const openai = new OpenAI({
  apiKey: env.VITE_OPENAI_API_KEY,
  project: env.VITE_OPENAI_PROJECT_NAME,
  dangerouslyAllowBrowser: true,
});

export default function Analytics({ data }: { data: any }) {
  const [streamedText, setStreamedText] = useState("");

  useEffect(() => {
    async function streamText() {
      setStreamedText(""); // Reset the text before starting the stream

      try {
        // Make sure to use the correct method from the OpenAI SDK
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant who summarizes and analyzes user interactions with websites. You will be given data about mouse presses on an ecommerce website, and should output a short and succinct analysis of it in plain text. Do NOT use markdown formatting.",
            },
            {
              role: "user",
              content: `Please summarize this data: ${JSON.stringify(data)}`,
            },
          ],
          stream: true,
        });

        // Handling the streamed response
        const reader = response.toReadableStream().getReader();
        const decoder = new TextDecoder();
        let text = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const nt = JSON.parse(decoder.decode(value, { stream: true }))
            .choices[0].delta.content;
          if (nt) {
            text += nt;
            setStreamedText(text);
          }
        }
      } catch (error) {
        console.error("Error while streaming text:", error);
      }
    }

    streamText();
  }, []);

  return (
    <div
      style={{
        wordWrap: "break-word",
        wordBreak: "break-all",
      }}
    >
      {streamedText}
    </div>
  );
}
