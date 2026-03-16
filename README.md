# 🚀 UIGen

**AI-powered React component generator with live preview**

Generate beautiful, production-ready React components by describing them in natural language. Powered by Claude AI, tested in real-time, and iterated interactively.

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

---

## ✨ Features

- 🤖 **AI-Powered Generation** - Describe components in plain English; Claude generates production-ready code
- 👀 **Live Preview** - See components instantly as they're created
- 📝 **Virtual File System** - Work with components in-memory without cluttering your disk
- ⚡ **Hot Reload** - Changes appear in real-time with no manual refresh
- 🎨 **Code Editor** - Professional syntax highlighting and full component editing
- 💾 **Project Persistence** - Save projects to your account or work anonymously
- 🔄 **Iterative Refinement** - Chat with AI to refine and improve your components
- 📤 **Export Ready** - Export generated code directly

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, Radix UI |
| **State Management** | React Context API |
| **Database** | Prisma + SQLite |
| **AI** | Anthropic Claude API, Vercel AI SDK |
| **Testing** | Vitest, React Testing Library |
| **Build** | Turbopack |

---

## 📋 Prerequisites

- **Node.js** 18+
- **npm** (comes with Node.js)
- **Anthropic API Key** (optional - works without it)

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/andrew1440/UIGEN.git
cd UIGEN
npm run setup
```

### 2. Configure (Optional)

Create a `.env` file with your Anthropic API key for AI-powered generation:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./dev.db
```

**Note:** The app runs without an API key, but returns static code samples instead of AI-generated components.

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Local LLM Integration (Ollama)

UIGen is optimized to work with local models via **Ollama**, allowing for secure, offline component generation.

### Setup

1. **Install Ollama:** Download and install from [ollama.com](https://ollama.com).
2. **Pull a Model:** For best performance on most machines, we recommend **Llama 3.2 1B**:
   ```bash
   ollama pull llama3.2:1b
   ```
3. **Run Locally:**
   ```bash
   ollama run llama3.2:1b
   ```

### Hardware Note
Large models like **Llama 3.3 70B** require significant GPU memory (VRAM) and disk space (approx. 40GB). For local consumer hardware, 1B - 8B parameter models are recommended.

---

## 📚 Usage Guide

### For First-Time Users

1. **Sign Up or Start Anonymously** - Choose whether to create an account or work as a guest
2. **Describe Your Component** - Use the chat to describe what you want (e.g., "Create a card component with a title, description, and action button")
3. **Review in Preview** - See your component render live in the preview pane
4. **Edit & Iterate** - Switch to Code view, make edits, or ask Claude to refine it
5. **Save or Export** - Keep your components in a project or export the code

### Component Generation Examples

- _"Create a responsive navbar with logo and navigation links"_
- _"Make a form with email and password fields with validation"_
- _"Build a product card showing image, price, rating, and add-to-cart button"_

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server (port 3000 or 3001)
npm run build        # Create production build
npm run start        # Start production server
npm run test         # Run tests with Vitest
npm run lint         # Lint and check code quality
npm run setup        # Full setup (install deps, generate Prisma, migrate DB)
npm run db:reset     # Reset database (⚠️ WARNING: Destructive)
```

---

## 🏗️ Architecture Overview

### Frontend Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing/project list
│   ├── [projectId]/       # Project workspace
│   └── api/chat/          # AI chat endpoint
├── components/
│   ├── chat/              # Chat interface
│   ├── editor/            # Code editor & file tree
│   ├── preview/           # Live preview
│   └── ui/                # UI components
├── lib/
│   ├── contexts/          # React Contexts
│   ├── file-system.ts     # Virtual file system
│   └── tools/             # AI tool handlers
└── actions/               # Server actions
```

### Key Concepts

- **Virtual File System**: Components live in-memory, not on disk
- **React Contexts**: `ChatContext` and `FileSystemContext` manage global state
- **AI Integration**: Vercel AI SDK + Claude for component generation
- **Database**: Prisma stores user accounts and project metadata

---

## 🔧 Development

### Adding a New Component

Use Shadcn UI CLI or add manually to `src/components/ui/`:

```bash
npx shadcn-ui@latest add button
```

### Modifying AI Behavior

Edit `/src/app/api/chat/route.ts` to adjust:
- System prompt
- Available tools
- Model configuration
- Response format

### Database Migrations

```bash
npx prisma migrate dev --name your_migration_name
```

### Running Tests

```bash
npm run test                 # Run all tests
npm run test -- FileTree     # Run specific test
npm run test -- --watch     # Watch mode
```

---

## 🐛 Troubleshooting

### Module not found: `@/generated/prisma`

```bash
npx prisma generate
```

### Port already in use

The dev server automatically uses port 3001 if 3000 is busy. To specify a port:

```bash
$env:PORT=3002; npm run dev  # Windows PowerShell
PORT=3002 npm run dev        # macOS/Linux
```

### Database locked error

```bash
npm run db:reset
```

### No AI responses (missing API key)

Set `ANTHROPIC_API_KEY` in your `.env` file. Get one at [console.anthropic.com](https://console.anthropic.com).

---

## 📖 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com)
- [Prisma ORM](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React 19](https://react.dev)

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👤 Author

**Andrew** - [GitHub](https://github.com/andrew1440)

---

**Made with  for developers who love AI-powered tools**
