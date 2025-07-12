import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const slideSchema = z.object({
  slides: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.enum(['title', 'content', 'image', 'bullet']),
    bulletPoints: z.array(z.string()).optional(),
    imageDescription: z.string().optional(),
  }))
});

export async function POST(req: Request) {
  try {
    const { topic, slideCount, style, userId } = await req.json();

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

    const { object } = await generateObject({
      model: google('gemini-2.5-pro'),
      schema: slideSchema,
      prompt: `Create a professional presentation about "${topic}" with ${slideCount} slides. 
               Use a ${style} style. Include a mix of slide types:
               - Title slide for introduction
               - Content slides with key information
               - Bullet point slides for lists
               - Ensure each slide has meaningful, well-structured content
               - Make the content engaging and informative
               - Keep slide titles concise and descriptive
               - For bullet points, provide 3-5 clear, actionable items
               
               User ID: ${userId}`,
    });

    return Response.json({
      ...object,
      userId
    });
  } catch (error) {
    console.error('Error generating slides:', error);
    return Response.json(
      { error: 'Failed to generate slides' },
      { status: 500 }
    );
  }
} 