# 🚀 QUICK START GUIDE

## Get Running in 3 Steps!

### Step 1: Install Dependencies
```bash
npm install
```
This will install Next.js, Tailwind CSS, Framer Motion, and all required packages.

### Step 2: Run Development Server
```bash
npm run dev
```

### Step 3: Open Browser
Go to: **http://localhost:3000**

That's it! 🎉

---

## 📚 Adding Your Textbook PDF

1. Create the textbooks folder (if it doesn't exist):
   ```bash
   mkdir -p public/textbooks
   ```

2. Copy your PDF:
   ```bash
   cp /path/to/your/science-form-5.pdf public/textbooks/
   ```

3. The PDF will be ready for future AI integration!

---

## 🎨 What You'll See

### Left Panel: Chapter Navigation
- Expandable chapters
- Clickable subchapters
- Progress tracking

### Middle Panel: Content Viewer
- Rich markdown content
- Embedded YouTube videos
- Interactive quizzes

### Right Panel: AI Assistant
- Text explanation tool
- Chat interface (UI ready)
- Difficulty level selector

---

## 🎯 Key Features to Try

1. **Navigate Chapters**: Click chapters on the left to explore
2. **Watch Videos**: Scroll down in content to see embedded videos
3. **Take Quizzes**: Click "Start Quiz" button under each subchapter
4. **Highlight Text**: Select any text in the content area
5. **Change Difficulty**: Toggle between Beginner/Intermediate/Advanced/Expert
6. **Explain Text Tab**: See selected text ready for AI explanation

---

## 🔧 Troubleshooting

### Port Already in Use?
```bash
npm run dev -- -p 3001
```

### Missing Dependencies?
```bash
rm -rf node_modules package-lock.json
npm install
```

### Styling Not Loading?
```bash
npm run dev
# Refresh browser with Ctrl+F5 (hard reload)
```

---

## 📝 Customization Quick Tips

### Change Primary Color
Edit `tailwind.config.js`:
```javascript
primary: {
  600: '#YOUR_COLOR_HERE'
}
```

### Add More Content
Edit `data/chaptersData.js` and add new chapters/subchapters.

### Modify Layout
Edit `app/page.js` to adjust panel widths:
```javascript
<aside className="w-80">        // Left panel width
<section className="flex-1">    // Middle panel (flexible)
<aside className="w-96">        // Right panel width
```

---

## 🚧 Next Steps (For Full Implementation)

1. **Get API Keys**:
   - Groq: https://console.groq.com
   - OpenAI: https://platform.openai.com
   - Google AI: https://ai.google.dev

2. **Create `.env.local`**:
   ```env
   GROQ_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   GOOGLE_AI_API_KEY=your_key_here
   ```

3. **Create API Routes**:
   - `app/api/explain/route.js` - Text explanations
   - `app/api/chat/route.js` - Chat responses
   - `app/api/quiz/route.js` - Quiz generation

4. **Implement AI Integration**:
   - See README.md "API Integration Guide" section

---

## 💡 Tips

- **Development Mode**: Changes auto-reload in browser
- **Production Build**: Run `npm run build` then `npm start`
- **Inspect Code**: Check `components/` folder for all UI components
- **Sample Data**: See `data/chaptersData.js` for content structure

---

## 🆘 Need Help?

1. Check README.md for detailed documentation
2. Review component files for implementation details
3. Inspect browser console for any errors
4. Ensure Node.js version is 18 or higher

---

**Happy Learning! 🎓**
