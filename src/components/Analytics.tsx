import OpenAI from "openai";
import { useState, useEffect } from "react";
import styled from 'styled-components';

const env = import.meta.env;

const openai = new OpenAI({
    apiKey: env.VITE_OPENAI_API_KEY,
    project: env.VITE_OPENAI_PROJECT_NAME,
    dangerouslyAllowBrowser: true,
});

const AnalyticsContainer = styled.div`
  background-color: #1a1a1a;
  color: #ffffff;
  padding: 2rem;
  font-family: 'Arial', sans-serif;
`;

const Card = styled.div`
  background-color: #2a2a2a;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ChatContainer = styled.div`
  background-color: #333333;
  border-radius: 8px;
  padding: 1rem;
  height: 300px;
  overflow-y: auto;
`;

const ChatMessage = styled.p`
  margin-bottom: 0.5rem;
  line-height: 1.5;
`;

export default function Analytics({ data }: { data: any }) {
    console.log(env.VITE_HELLO);

    const [streamedText, setStreamedText] = useState('');

    useEffect(() => {
        async function streamText() {
            setStreamedText('');

            const stream = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: "You are a helpful assistant who summarises and analyses user interactions with websites. You will be given mouse press data as a JSON string, and should output a reasonably short analysis of it in plain text." },
                    { role: "user", content: JSON.stringify(data) }
                ],
                stream: true,
            });

            for await (const chunk of stream) {
                if (chunk.choices[0].delta.content) {
                    setStreamedText(prevText => prevText + chunk.choices[0].delta.content);
                }
            }
        }

        streamText();
    }, [data]);

    return (
        <AnalyticsContainer>
            <Card>
                <ChatContainer>
                    <ChatMessage>{streamedText}</ChatMessage>
                </ChatContainer>
            </Card>
        </AnalyticsContainer>
    )
}

