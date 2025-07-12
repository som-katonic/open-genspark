import { NextRequest, NextResponse } from "next/server";
import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import { generateText, generateObject } from 'ai';
import { google } from "@ai-sdk/google";
import { z } from 'zod';

const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new VercelProvider()
});

// Fixed HTML templates for different slide types
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
    .slide-container {
      width: 100%;
      height: 100%;
      isolation: isolate;
    }
    
    .slide-container * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    .slide-container .slide {
      width: 100%;
      height: 100%;
      min-height: 500px;
      background: ${colors.background};
      color: ${colors.text};
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 40px;
      position: relative;
      overflow: hidden;
    }
    
    .slide-container .slide::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.1);
      z-index: 1;
    }
    
    .slide-container .slide-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: 800px;
      width: 100%;
    }
    
    .slide-container h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }
    
    .slide-container h2 {
      font-size: 2.5rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
      line-height: 1.2;
      letter-spacing: -0.025em;
    }
    
    .slide-container .subtitle {
      font-size: 1.25rem;
      font-weight: 400;
      opacity: 0.9;
      margin-bottom: 2rem;
    }
    
    .slide-container .content-card {
      background: ${colors.cardBg};
      color: ${colors.cardText};
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05);
      margin-top: 2rem;
      text-align: left;
    }
    
    .slide-container .content-card p {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .slide-container .bullets {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .slide-container .bullets li {
      font-size: 0.95rem;
      line-height: 1.6;
      margin-bottom: 1rem;
      padding-left: 2rem;
      position: relative;
    }
    
    .slide-container .bullets li::before {
      content: '•';
      color: ${colors.accent};
      font-size: 1.5rem;
      position: absolute;
      left: 0;
      top: 0;
    }
    
    .slide-container .slide-number {
      position: absolute;
      bottom: 20px;
      right: 20px;
      font-size: 0.9rem;
      opacity: 0.7;
      z-index: 3;
    }
  `;
  
  let slideHTML = '';
  
  if (type === 'title') {
    slideHTML = `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-content">
            <h1>${title}</h1>
            ${content ? `<p class="subtitle">${content}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  } else if (type === 'bullet') {
    const bulletHTML = bulletPoints ? 
      `<ul class="bullets">${bulletPoints.map((bullet: string) => `<li>${bullet}</li>`).join('')}</ul>` : 
      '';
    
    slideHTML = `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-content">
            <h2>${title}</h2>
            <div class="content-card">
              ${bulletHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // content type
    slideHTML = `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-content">
            <h2>${title}</h2>
            <div class="content-card">
              <p>${content}</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  return `<style>${baseCSS}</style>${slideHTML}`;
}

// Schema for slide generation with fixed templates
const slideSchema = z.object({
  slides: z.array(z.object({
    title: z.string(),
    content: z.string(),
    type: z.enum(['title', 'content', 'bullet']),
    bulletPoints: z.array(z.string()).optional(),
  }))
});

// Custom slide generation tool
const SLIDE_GENERATOR_TOOL = 'GENERATE_PRESENTATION_SLIDES';

// Initialize custom slide generation tool
async function initializeSlideGenerationTool() {
    try {
        const tool = await composio.tools.createCustomTool({
            slug: SLIDE_GENERATOR_TOOL,
            name: 'Generate Presentation Slides',
            description: 'Creates a professional presentation based on provided content, with customizable slide count and style.',
            inputParams: z.object({
                content: z.string().describe('The detailed content or data for the presentation. This should be a summary or the full text from which to generate slides.'),
                slideCount: z.number().min(1).max(20).default(5).describe('Number of slides to generate (1-20)'),
                style: z.enum(['professional', 'creative', 'minimal', 'academic']).default('professional').describe("The visual style for the presentation.")
            }),
            execute: async (input: any, connectionConfig?: any) => {
                try {
                    const { content, slideCount, style } = input;
                    
                    const { object } = await generateObject({
                        model: google('gemini-2.5-pro'),
                        schema: slideSchema,
                        prompt: `Create a professional presentation with ${slideCount} slides using a ${style} style, based on the following content:

---
${content}
---

CRITICAL CONTENT RULES:
- Base the presentation ENTIRELY on the provided content. Do not add outside information.
- NEVER use placeholder text like "heading", "content", "bullet point", etc.
- ALWAYS write actual, meaningful, specific content derived from the provided text.
- Each slide must have substantive, valuable information from the source content.

SLIDE STRUCTURE:
- Slide 1: Title slide with a compelling title and descriptive subtitle that summarizes the content.
- Slides 2-${slideCount-1}: Content slides with specific information, insights, or analysis from the source.
- Slide ${slideCount}: Strong conclusion with key takeaways and next steps based on the source.

SLIDE TYPES:
- Use "title" type for the first slide only.
- Use "bullet" for slides with multiple key points (3-5 bullets max).
- Use "content" for slides with detailed explanations.

Generate substantial, professional content that accurately reflects the provided text.`,
                    });

                    // Add HTML to each slide using the fixed template
                    const slidesWithHTML = object.slides.map(slide => ({
                        ...slide,
                        html: generateSlideHTML(slide, style)
                    }));

                    return {
                        data: {
                            slides: slidesWithHTML,
                            slideCount: slidesWithHTML.length,
                            topic: slidesWithHTML[0]?.title || 'Generated Presentation',
                            style,
                            message: `Successfully generated ${slidesWithHTML.length} slides.`
                        },
                        error: null,
                        successful: true
                    };
                } catch (error) {
                    return {
                        data: {
                            error: `Failed to generate slides: ${error instanceof Error ? error.message : 'Unknown error'}`
                        },
                        error: null,
                        successful: false
                    };
                }
            }
        });
        
        console.log('🚀 Slide generation tool created:', tool);
        return tool;
    } catch (error) {
        console.error('Error creating slide generation tool:', error);
        return null;
    }
}

// Remove the old template functions since we now use generateSlideHTML

export async function POST(req: NextRequest) {
    try {
        const { prompt, selectedTool, conversationHistory, userId, sheetUrl, docUrl } = await req.json();
        
        // Validate userId is provided
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required. Please sign in.' },
                { status: 401 }
            );
        }

        // If a new sheet is connected, ask the user what to do next.
        if (sheetUrl && !conversationHistory.some((m: any) => m.content.includes('Spreadsheet Connected'))) {
            return NextResponse.json({
                response: `📊 **Spreadsheet Connected!** I've successfully connected to your Google Sheet. What would you like to do with it? For example, you can ask me to:

- "Summarize the key insights from this data"
- "Create a chart showing sales by region"
- "Find the average revenue per customer"`,
                hasSlides: false,
            });
        }

        // If a new doc is connected, ask the user what to do next.
        if (docUrl && !conversationHistory.some((m: any) => m.content.includes('Document Connected'))) {
            return NextResponse.json({
                response: `📄 **Document Connected!** I've successfully connected to your Google Doc. What would you like to do with it? For example, you can ask me to:

- "Summarize this document"
- "Extract the key action items"
- "Check for grammatical errors"`,
                hasSlides: false,
            });
        }
        
        // Initialize the custom slide generation tool
        await initializeSlideGenerationTool();
        
        // --- REMOVED SLIDE GENERATION LOGIC ---
        // The old logic was too simple and has been removed.
        // The main agent will now handle slide generation requests using the upgraded tool.
        
        // Get comprehensive toolkits based on selected tool or default to all
        let toolkits = ['GOOGLESUPER', 'COMPOSIO_SEARCH'];
        

        // Get both toolkit tools and custom tools
        const google_super_toolkit = await composio.tools.get(String(userId), {
            toolkits: ['GOOGLESUPER'],
            limit: 10
        });
        const google_sheet_tools = await composio.tools.get(String(userId), {
            toolkits: ['GOOGLESHEETS'],
        });
        const google_docs_tools = await composio.tools.get(String(userId), {
            toolkits: ['GOOGLEDOCS'],
            limit: 10
        });
        const get_google_docs_tools = await composio.tools.get(String(userId), {
            tools: ['GOOGLEDOCS_GET_DOCUMENT_BY_ID']
        });
        const get_google_sheets_tools = await composio.tools.get(String(userId), {
            tools: ['GOOGLESHEETS_GET_SHEET_BY_ID']
        });
        const composio_search_toolkit = await composio.tools.get(String(userId), {
            toolkits: ['COMPOSIO_SEARCH']
        });

        const composio_toolkit = await composio.tools.get(String(userId), {
            toolkits: ['COMPOSIO']
        });


        // Always include slide generation tool - available for all requests
        let allTools = Object.assign({},google_sheet_tools, google_docs_tools, get_google_docs_tools, composio_search_toolkit, composio_toolkit);
        console.log(allTools);
        // Always add the slide generation tool
        const customTools = await composio.tools.get(String(userId), {toolkits: [SLIDE_GENERATOR_TOOL]});
        allTools = Object.assign({}, allTools, customTools);
        //console.log(allTools);
        
        let systemPrompt = `You are Google Super Agent, a helpful and efficient AI assistant powered by Composio. Your main goal is to assist users by using a suite of powerful tools to accomplish tasks.

**Core Principles:**
1.  **Action-Oriented:** Your primary focus is on using tools to complete user requests. While you are conversational, always look for an opportunity to take action.
2.  **Tool-First Mentality:** When a user asks for something, first consider if a tool can help. For general questions or casual chat, respond conversationally.
3.  **Think Step-by-Step:** For complex tasks, you may need to use multiple tools in a sequence. For example, to answer a question about a file, you first need to read the file.

---

**Workflow for Connected Files (Google Sheets & Docs):**

This is a critical part of your function. Follow these rules precisely.

1.  **File is Primary Context:** When a Google Sheet or Doc is connected, it is the **most important** piece of information. Assume all user questions relate to the content of that file unless they state otherwise.

2.  **Generating Presentations from Files:**
    - **Step 1: Analyze the File.** Use your tools to read and understand the data within the connected file.
    - **Step 2: Outline the Slides.** In your response, provide a clear, slide-by-slide outline of the presentation. Detail the title and key points for each slide based on your analysis.
    - **Step 3: Use the Magic Word.** After creating the slide outline, you **MUST** end your *entire* message with the special command: **[SLIDES]**

---
`;

        // Build messages array with system prompt and conversation history
        const messages: any[] = [
            {
                role: 'system',
                content: systemPrompt
            }
        ];

        // Add conversation history if available
        if (conversationHistory && conversationHistory.length > 0) {
            messages.push(...conversationHistory);
        }

        // Add current user message
        messages.push({
            role: 'user',
            content: prompt
        });

        const { text, toolCalls, toolResults } = await generateText({
            model: google('gemini-2.5-pro'),
            system: systemPrompt,
            messages,
            tools: allTools,
            maxSteps: 50,
        });

        const slideExecution = toolResults.find(result => result.toolName === SLIDE_GENERATOR_TOOL);

        if (slideExecution) {
            const slideData = slideExecution.result.data.slides;
            return NextResponse.json({
                response: text,
                slides: slideData,
                hasSlides: true,
            });
        }


        return NextResponse.json({
            response: text,
            hasSlides: false,
        });

    } catch (error) {
        console.error('Connection error:', error);
        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        );
    }
}