'use client';

import { useState, useEffect } from 'react';
import { Orca } from '@picovoice/orca-web';

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orca, setOrca] = useState<Orca | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const initializeOrca = async () => {
      try {
        const accessKey = process.env.NEXT_PUBLIC_PICOVOICE_ACCESS_KEY || '';
        const orcaInstance = await Orca.create(accessKey, {
          model: { publicPath: '/orca_params.pv' }
        });
        setOrca(orcaInstance);
      } catch (error) {
        console.error('Error initializing Orca:', error);
      }
    };

    initializeOrca();

    return () => {
      if (orca) {
        orca.release();
      }
    };
  }, [orca]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/llama', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await res.json();
      setResponse(data.response);
    } catch (error) {
      console.error('Error:', error);
      setResponse('Error processing your request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async () => {
    if (!orca || !response) return;

    try {
      setIsSpeaking(true);
      const audioData = await orca.stream(response);
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      
      source.onended = () => {
        setIsSpeaking(false);
      };
    } catch (error) {
      console.error('Error speaking:', error);
      setIsSpeaking(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Llama Chat with Text-to-Speech</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex flex-col gap-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter your question..."
            className="w-full p-4 border rounded-lg min-h-[100px]"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Processing...' : 'Ask Llama'}
          </button>
        </div>
      </form>

      {response && (
        <div className="bg-gray-100 p-6 rounded-lg">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Response:</h2>
            <button
              onClick={handleSpeak}
              disabled={isSpeaking}
              className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {isSpeaking ? 'Speaking...' : 'Speak'}
            </button>
          </div>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </main>
  );
} 