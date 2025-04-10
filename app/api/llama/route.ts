import { NextResponse } from 'next/server';
import Together from "together-ai";

// Initialize the Together client outside the handler
// It will use the TOGETHER_API_KEY environment variable automatically
const together = new Together();

export async function POST(request: Request) {
  console.log('Received request for /api/llama using together-ai library');
  try {
    const { prompt } = await request.json();
    console.log('Prompt received:', prompt);

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use the chat completions endpoint
    const response = await together.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." }, // Optional: Add a system message
        { role: "user", content: prompt }
      ],
      model: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8", // Using the same model as before, adjust if needed
      max_tokens: 1000, // Optional parameters can be added here
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
    });

    console.log('Together API response received:', JSON.stringify(response));

    // Extract the response content
    const llamaResponse = response.choices?.[0]?.message?.content;

    if (!llamaResponse) {
      console.error('Could not extract response content from Together API response:', response);
      throw new Error('Failed to get valid response content from Together API');
    }

    console.log('Llama response extracted:', llamaResponse);
    return NextResponse.json({ response: llamaResponse });

  } catch (error) {
    console.error('Error in /api/llama:', error);
    // Extract more specific error message from the library if available
    // Check if error is an instance of Error first
    let errorMessage = 'Failed to process request';
    if (error instanceof Error) {
        errorMessage = error.message;
        // Potentially check for more specific error structure from the library if needed
        // e.g., if (error.response?.data?.error?.message) errorMessage = error.response.data.error.message;
    }
    const status = (error as any)?.status || 500; // Keep status extraction if library uses it, but type assertion is needed
    return NextResponse.json(
      { error: errorMessage },
      { status: status }
    );
  }
} 