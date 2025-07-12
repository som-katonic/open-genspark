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
            description: 'Creates professional presentation slides on any topic with customizable count and style',
            inputParams: z.object({
                topic: z.string().describe('The topic or subject of the presentation'),
                slideCount: z.number().min(1).max(20).default(5).describe('Number of slides to generate (1-20)'),
                style: z.enum(['professional', 'creative', 'minimal', 'academic']).default('professional').describe('Presentation style')
            }),
            execute: async (input: any, connectionConfig?: any) => {
                try {
                    const { topic, slideCount, style } = input;
                    
                    const { object } = await generateObject({
                        model: google('gemini-2.5-flash'),
                        schema: slideSchema,
                        prompt: `Create a professional presentation about "${topic}" with ${slideCount} slides using a ${style} style.

CRITICAL CONTENT RULES:
- NEVER use placeholder text like "heading", "content", "bullet point", etc.
- ALWAYS write actual, meaningful, specific content about the topic
- Each slide must have substantive, valuable information
- Use concrete examples, facts, and insights
- Make every word count and add value

SLIDE STRUCTURE:
- Slide 1: Title slide with compelling title and descriptive subtitle about the topic
- Slides 2-${slideCount-1}: Content slides with specific information, insights, or analysis
- Slide ${slideCount}: Strong conclusion with key takeaways and next steps

CONTENT QUALITY STANDARDS:
- Write as if presenting to industry experts
- Include specific details, statistics, or real-world examples when relevant
- Use active voice and compelling language
- Each bullet point should be a complete, valuable insight
- Avoid generic statements - be specific to the "${topic}" topic

SLIDE TYPES:
- Use "title" type for the first slide only
- Use "bullet" type for slides with multiple key points (3-5 bullets max)
- Use "content" type for slides with detailed explanations or analysis

Example of GOOD content for a slide about AI:
Title: "Machine Learning Applications in Healthcare"
Content: "AI-powered diagnostic tools are reducing misdiagnosis rates by 23% in radiology departments, while predictive algorithms help identify at-risk patients 48 hours before critical events occur."

Example of BAD content (DO NOT DO THIS):
Title: "Heading"
Content: "This slide contains content about the topic."

Generate substantial, professional content that demonstrates expertise in "${topic}".`,
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
                            topic,
                            style,
                            message: `Successfully generated ${slidesWithHTML.length} slides for "${topic}" in ${style} style`
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
        const { prompt, selectedTool, conversationHistory, userId } = await req.json();
        
        // Validate userId is provided
        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required. Please sign in.' },
                { status: 401 }
            );
        }
        
        // Initialize the custom slide generation tool
        await initializeSlideGenerationTool();
        
        // Detect if this is a slide generation request - but only if the prompt actually asks for slides
        const isExplicitSlideRequest = selectedTool === 'slides' && 
                                     /\b(presentation|slide|slides|ppt|powerpoint|deck|create|make|generate)\b/i.test(prompt);
        
        if (isExplicitSlideRequest) {
            // Use the simplified slide generation with fixed templates
            const { object } = await generateObject({
                model: google('gemini-2.5-flash'),
                schema: slideSchema,
                prompt: `Create a professional presentation based on the following prompt: "${prompt}".

CRITICAL CONTENT RULES:
- NEVER use placeholder text like "heading", "content", "bullet point", etc.
- ALWAYS write actual, meaningful, specific content related to the user's request
- Each slide must have substantive, valuable information
- Use concrete examples, facts, and insights
- Make every word count and add value

SLIDE STRUCTURE:
- Slide 1: Title slide with compelling title and descriptive subtitle
- Slides 2-4: Content slides with specific information, insights, or analysis
- Slide 5: Strong conclusion with key takeaways and next steps

CONTENT QUALITY STANDARDS:
- Write as if presenting to industry experts
- Include specific details, statistics, or real-world examples when relevant
- Use active voice and compelling language
- Each bullet point should be a complete, valuable insight
- Avoid generic statements - be specific to the user's request

SLIDE TYPES:
- Use "title" type for the first slide only
- Use "bullet" type for slides with multiple key points (3-5 bullets max)
- Use "content" type for slides with detailed explanations or analysis

Example of GOOD content:
Title: "Machine Learning Applications in Healthcare"
Content: "AI-powered diagnostic tools are reducing misdiagnosis rates by 23% in radiology departments, while predictive algorithms help identify at-risk patients 48 hours before critical events occur."

Example of BAD content (DO NOT DO THIS):
Title: "Heading"
Content: "This slide contains content about the topic."

Generate substantial, professional content that demonstrates real expertise and value.`
            });

            // Add HTML to each slide using the fixed template
            const slidesWithHTML = object.slides.map(slide => ({
                ...slide,
                html: generateSlideHTML(slide, 'professional')
            }));

            return NextResponse.json({
                response: `Successfully generated presentation slides based on your prompt.`,
                slides: slidesWithHTML,
                hasSlides: true,
                userId: userId
            });
        }

        // Get comprehensive toolkits based on selected tool or default to all
        let toolkits = ['GOOGLESUPER', 'COMPOSIO_SEARCH'];
        

        // Get both toolkit tools and custom tools
        const google_super_toolkit = await composio.tools.get(String(userId), {
            toolkits: ['GOOGLESUPER']
        });

        const composio_search_toolkit = await composio.tools.get(String(userId), {
            toolkits: ['COMPOSIO_SEARCH']
        });

        const composio_toolkit = await composio.tools.get(String(userId), {
            toolkits: ['COMPOSIO']
        });


        // Only include slide generation tool if explicitly requested or if prompt suggests presentation creation
        const isSlideRequest = selectedTool === 'slides' || 
                               /\b(presentation|slide|slides|ppt|powerpoint|deck)\b/i.test(prompt);
        
        let allTools = Object.assign({}, google_super_toolkit, composio_search_toolkit, composio_toolkit);
        
        if (isSlideRequest) {
            const customTools = await composio.tools.get(String(userId), {toolkits: [SLIDE_GENERATOR_TOOL]});
            allTools = Object.assign({}, allTools, customTools);
        }
        console.log(allTools);
        // Build messages array with system prompt and conversation history
        const messages: any[] = [
            {
                role: 'system',
                content: `You are Google Super Agent Powered by Composio - an advanced AI assistant that can perform real-world tasks using various tools and integrations.

🎯 PRIMARY DIRECTIVE: BE CONVERSATIONAL FIRST, USE TOOLS ONLY WHEN EXPLICITLY REQUESTED

Core Capabilities:
- Research and analyze information from the web
- Create and edit documents, presentations, and spreadsheets
- Generate images and videos
- Make phone calls and send messages
- Automate workflows across multiple platforms
- Download and process files
- Integrate with productivity tools
- Generate professional presentation slides

🚨 CRITICAL CONVERSATION GUIDELINES:
- You are PRIMARILY a conversational AI assistant
- Engage in natural conversation and answer questions directly from your knowledge
- NEVER automatically use tools for casual conversation, greetings, or general questions
- Only use tools when the user EXPLICITLY requests a specific task or action
- If unsure whether to use a tool, DEFAULT to conversational response

🔧 TOOL USAGE RULES (STRICT):
- Use presentation tools ONLY when users explicitly say "create presentation", "make slides", "generate PPT", etc.
- Use research tools ONLY when users ask for current/specific information you don't know
- Use other tools ONLY when users request specific actions (calls, downloads, etc.)
- NEVER use tools for: greetings, how are you, general knowledge questions, explanations, casual chat

✅ CORRECT EXAMPLES:
- "Hi" → "Hello! I'm Google Super Agent Powered by Composio. How can I help you today?" (NO TOOLS)
- "How are you?" → "I'm doing great! Ready to help with any tasks you need." (NO TOOLS)
- "What is AI?" → Explain AI conversationally (NO TOOLS)
- "Tell me about marketing" → Explain marketing conversationally (NO TOOLS)
- "What's the weather in NYC?" → Use research tools to get current weather
- "Create a presentation about marketing" → Use presentation tools
- "Call John" → Use phone tool
- "Download this file" → Use download tool

❌ WRONG EXAMPLES:
- "Hi" → Using any tools (WRONG!)
- "Tell me about AI" → Using presentation tools (WRONG!)
- "How does marketing work?" → Using slide generation (WRONG!)

Selected Tool Context: ${selectedTool || 'General Assistant'}
User ID: ${userId}
Available Tools: ${isSlideRequest ? 'Research + Presentation Tools' : 'Research Tools Only'}

🎯 REMEMBER: Default to conversation. Only use tools when the user clearly requests an action, not information or explanation.

Don't use Wait for connection action. For non google related actions, use Composio Tools.

`
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

        const response = await generateText({
            model: google('gemini-2.5-pro'),
            messages: messages,
            tools: allTools,
            toolChoice: 'auto',
            maxSteps: 50,
            temperature: 0.7
        });

        // Extract slide data from tool execution results
        let slideData = null;
        let hasSlides = false;
        
        if (response.steps) {
            for (const step of response.steps) {
                if (step.toolCalls && step.toolResults) {
                    for (let i = 0; i < step.toolCalls.length; i++) {
                        const toolCall = step.toolCalls[i];
                        const toolResult = step.toolResults[i];
                        
                        if (toolCall.toolName === SLIDE_GENERATOR_TOOL && toolResult) {
                            try {
                                const result = toolResult as any;
                                
                                // Access the nested result.data.slides
                                if (result.result && result.result.data && result.result.data.slides) {
                                    slideData = result.result.data.slides;
                                    hasSlides = true;
                                    break;
                                }
                            } catch (error) {
                                console.error('Error extracting slide data:', error);
                            }
                        }
                    }
                }
                if (hasSlides) break;
            }
        }

        return NextResponse.json({
            response: response.text,
            selectedTool,
            finishReason: response.finishReason,
            toolsUsed: response.steps?.length || 0,
            slideData,
            hasSlides,
            userId: userId
        });
        
    } catch (error) {
        console.error('SuperAgent Error:', error);
        return NextResponse.json(
            { error: 'Failed to process your request. Please try again.' },
            { status: 500 }
        );
    }
}