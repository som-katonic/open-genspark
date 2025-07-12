import { google } from '@ai-sdk/google';
import { generateText } from 'ai';
import { Composio } from '@composio/core';
import { VercelProvider } from '@composio/vercel';

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider()
});

export async function POST(req: Request) {
  try {
    const { message, sheetUrl, conversationHistory, userId } = await req.json();

    // Validate userId is provided
    if (!userId) {
      return Response.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return Response.json(
        { error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' },
        { status: 500 }
      );
    }

    if (!process.env.COMPOSIO_API_KEY) {
      return Response.json(
        { error: 'Missing COMPOSIO_API_KEY' },
        { status: 500 }
      );
    }

    const tools = await composio.tools.get(
        userId,
        {
            toolkits: ['GOOGLESHEETS']
        }
    );

    // Extract sheet ID from URL for context
    const sheetId = extractSheetId(sheetUrl);
    
    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nPrevious conversation:\n' + 
        conversationHistory.map((msg: any) => `${msg.role}: ${msg.content}`).join('\n');
    }

    const systemPrompt = `You are an intelligent Google Sheets assistant. You can help users analyze, query, and manipulate data in their Google Sheets.

Current Sheet: ${sheetUrl}
Sheet ID: ${sheetId}
User ID: ${userId}

Guidelines:
- Always use the Google Sheets tools to access real data from the spreadsheet
- Provide clear, actionable insights based on the actual data
- If you need to read data, use the appropriate Google Sheets tools first
- Format your responses in a clear, professional manner
- If asked about calculations, use the actual data from the sheet
- For data analysis, provide specific insights and recommendations

User's current question: ${message}
${conversationContext}`;

    const { text, finishReason } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: systemPrompt,
      maxSteps: 10,
      tools: tools,
      toolChoice: 'auto',
    });

    return Response.json({ 
      response: text, 
      finishReason,
      sheetId,
      userId 
    });

  } catch (error) {
    console.error('Error in Google Sheets agent:', error);
    return Response.json(
      { error: 'Failed to process your request. Please try again.' },
      { status: 500 }
    );
  }
}

// Helper function to extract Google Sheets ID from URL
function extractSheetId(url: string): string {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  } catch (error) {
    return '';
  }
} 