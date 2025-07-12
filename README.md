# AI PowerPoint Creator

Generate professional presentations with AI in seconds using Google's Gemini AI model. This application creates consistent, well-designed HTML slides that can be downloaded and opened in PowerPoint or any presentation software.

## Features

- 🤖 **AI-Powered Content Generation**: Uses Google's Gemini AI to create meaningful slide content
- 🎨 **Consistent Design**: Professional, clean design with multiple style options
- 📱 **Responsive Interface**: Works on desktop and mobile devices
- 🔄 **Real-time Preview**: See your slides as they're generated
- 📥 **Easy Download**: Export as native PowerPoint (.pptx) files
- ⚡ **Fast Generation**: Create presentations in seconds

## Getting Started

### Prerequisites

- Node.js 18+ installed on your machine
- A Google AI Studio API key (free)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd genspark
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   ```

4. **Get your Gemini API key:**
   - Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Create a new API key
   - Copy the key and paste it in your `.env.local` file:
     ```
     GOOGLE_GENERATIVE_AI_API_KEY=your_actual_api_key_here
     ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

6. **Open your browser:**
   Visit [http://localhost:3000](http://localhost:3000) to see the application.

## How to Use

1. **Enter your presentation topic** - Be specific for better results (e.g., "Digital Marketing Strategy for Small Businesses")

2. **Choose the number of slides** - Select from 3 to 15 slides depending on your needs

3. **Pick a style** - Choose from Professional, Creative, Minimal, or Academic styles

4. **Generate slides** - Click "Generate Slides" and wait for the AI to create your content

5. **Preview and review** - Browse through the generated slides using the thumbnail navigation

6. **Download** - Click "Download as PowerPoint" to get your .pptx file

## Opening the Presentation

The downloaded .pptx file can be opened directly in:
- Microsoft PowerPoint
- Google Slides (File → Import slides)
- LibreOffice Impress
- Apple Keynote
- Any PowerPoint-compatible software

## Technology Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **AI Integration**: Vercel AI SDK with Google Gemini
- **Icons**: React Icons (Feather Icons)
- **Styling**: Tailwind CSS with custom slide layouts

## Customization

### Adding New Slide Types

You can extend the slide types by modifying the schema in `app/api/generate-slides/route.ts`:

```typescript
const slideSchema = z.object({
  slides: z.array(z.object({
    // Add new slide types here
    type: z.enum(['title', 'content', 'image', 'bullet', 'your_new_type']),
    // Add new fields as needed
  }))
});
```

### Styling

Modify the slide styles in `app/api/convert-to-ppt/route.ts` to change the appearance of your presentations.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This application requires an active internet connection to generate slides using the Gemini AI API.
