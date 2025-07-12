import { NextRequest, NextResponse } from "next/server";
import { generateObject } from 'ai';
import { google } from "@ai-sdk/google";
import { z } from 'zod';

// Schema for slide generation
const slideSchema = z.object({
  slides: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.enum(['title', 'content', 'bullet']),
    bulletPoints: z.array(z.string()).optional(),
  }))
});

function generateSlideHTML(slide: any, style: string = 'professional') {
  const { title, content, type, bulletPoints } = slide;
  
  // Color schemes by style
  const colorSchemes = {
    professional: {
      primary: '#1a365d',
      secondary: '#2b6cb0',
      accent: '#ed8936',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      text: '#ffffff',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    },
    creative: {
      primary: '#e53e3e',
      secondary: '#dd6b20',
      accent: '#38a169',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      text: '#ffffff',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    },
    minimal: {
      primary: '#000000',
      secondary: '#2d3748',
      accent: '#4299e1',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      text: '#2d3748',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    },
    academic: {
      primary: '#2c5282',
      secondary: '#2b6cb0',
      accent: '#d69e2e',
      background: 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)',
      text: '#ffffff',
      cardBg: '#ffffff',
      cardText: '#2d3748'
    }
  };
  
  const colors = colorSchemes[style as keyof typeof colorSchemes] || colorSchemes.professional;
  
  const baseCSS = `
    .slide-container { width: 100%; height: 100%; isolation: isolate; }
    .slide-container * { margin: 0; padding: 0; box-sizing: border-box; }
    .slide-container .slide { width: 100%; height: 100%; min-height: 500px; background: ${colors.background}; color: ${colors.text}; font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px; position: relative; overflow: hidden; }
    .slide-container .slide::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.1); z-index: 1; }
    .slide-container .slide-content { position: relative; z-index: 2; text-align: center; max-width: 800px; width: 100%; }
    .slide-container h1 { font-size: 3rem; font-weight: 700; margin-bottom: 1.5rem; line-height: 1.2; letter-spacing: -0.025em; }
    .slide-container h2 { font-size: 2.5rem; font-weight: 600; margin-bottom: 1.5rem; line-height: 1.2; letter-spacing: -0.025em; }
    .slide-container .subtitle { font-size: 1.25rem; font-weight: 400; opacity: 0.9; margin-bottom: 2rem; }
    .slide-container .content-card { background: ${colors.cardBg}; color: ${colors.cardText}; padding: 2rem; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05); margin-top: 2rem; text-align: left; }
    .slide-container .content-card p { font-size: 0.95rem; line-height: 1.6; margin-bottom: 1rem; }
    .slide-container .bullets { list-style: none; padding: 0; margin: 0; }
    .slide-container .bullets li { font-size: 0.95rem; line-height: 1.6; margin-bottom: 1rem; padding-left: 2rem; position: relative; }
    .slide-container .bullets li::before { content: '•'; color: ${colors.accent}; font-size: 1.5rem; position: absolute; left: 0; top: 0; }
    .slide-container .slide-number { position: absolute; bottom: 20px; right: 20px; font-size: 0.9rem; opacity: 0.7; z-index: 3; }
  `;
  
  let slideHTML = '';
  
  if (type === 'title') {
    slideHTML = `<div class="slide-container"><div class="slide"><div class="slide-content"><h1>${title}</h1>${content ? `<p class="subtitle">${content}</p>` : ''}</div></div></div>`;
  } else if (type === 'bullet') {
    const bulletHTML = bulletPoints ? `<ul class="bullets">${bulletPoints.map((bullet: string) => `<li>${bullet}</li>`).join('')}</ul>` : '';
    slideHTML = `<div class="slide-container"><div class="slide"><div class="slide-content"><h2>${title}</h2><div class="content-card">${bulletHTML}</div></div></div></div>`;
  } else {
    slideHTML = `<div class="slide-container"><div class="slide"><div class="slide-content"><h2>${title}</h2><div class="content-card"><p>${content}</p></div></div></div></div>`;
  }
  
  return `<style>${baseCSS}</style>${slideHTML}`;
}

export async function POST(req: NextRequest) {
    try {
        const { content, style = 'professional', slideCount = 5 } = await req.json();

        if (!content) {
            return NextResponse.json({ error: 'Content is required to generate slides.' }, { status: 400 });
        }

        const { object } = await generateObject({
            model: google('gemini-2.5-pro'),
            schema: slideSchema,
            prompt: `You will be given text that describes the content for a presentation, structured slide by slide. Your task is to convert this structured text into a valid JSON object that matches the slide schema. Use the provided text to populate the 'title', 'content', and 'bulletPoints' for each slide. Determine the best 'type' for each slide ('title', 'content', or 'bullet') based on the provided structure.

Here is the structured content:
---
${content}
---

Convert this into the slide schema.`,
        });

        const slidesWithHTML = object.slides.map(slide => ({
            ...slide,
            html: generateSlideHTML(slide, style)
        }));

        return NextResponse.json({
            slides: slidesWithHTML,
            hasSlides: true,
        });

    } catch (error) {
        console.error('Error generating slides:', error);
        return NextResponse.json(
            { error: 'Failed to generate slides.', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}