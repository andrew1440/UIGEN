# UIGen - Copilot Instructions

AI-powered React component generator with live preview using Next.js and Claude API.

## Project Overview

UIGen is a web application that allows users to:
- Describe React components in natural language via chat
- Generate component code using Claude AI
- Preview components in real-time
- Edit and iterate on generated components
- Persist projects (for authenticated users) or work anonymously

**Key Technologies**: Next.js 15, React 19, TypeScript, Tailwind CSS, Prisma (SQLite), Anthropic Claude

---

## Architecture & Key Components

### Frontend Structure

```
src/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing/main page
│   ├── [projectId]/page.tsx      # Project view
│   ├── api/chat/route.ts         # AI chat endpoint
│   └── layout.tsx                # Root layout with providers
├── components/
│   ├── auth/                     # Login/signup UI
│   ├── chat/                     # Chat interface & markdown rendering
│   ├── editor/                   # Code editor & file tree
│   ├── preview/                  # Live preview frame
│   └── ui/                       # Shadcn UI components
├── lib/
│   ├── contexts/                 # React contexts (chat, file-system)
│   ├── file-system.ts            # Virtual file system class
│   ├── auth.ts                   # Authentication logic
│   ├── prisma.ts                 # Prisma client singleton
│   └── tools/                    # AI tool handlers (file-manager, str-replace)
└── actions/                      # Server actions (data persisting)
```

### Core Concepts

- **Virtual File System**: Components are stored in-memory via `VirtualFileSystem` class, NOT written to disk
- **Contexts**: `ChatContext` and `FileSystemContext` manage state for the entire app
- **AI Integration**: Uses Vercel AI SDK with Anthropic Claude for component generation
- **Database**: Prisma + SQLite stores user accounts and project metadata

---

## Development Setup & Commands

### Initial Setup
```bash
npm run setup
# Installs dependencies, generates Prisma client, runs migrations
```

### Development Server
```bash
npm run dev
# Starts Next.js dev server with turbopack
# Default: http://localhost:3000 (may use 3001 if 3000 is in use)
# IMPORTANT: NODE_OPTIONS='--require ./node-compat.cjs' is required (handled by npm scripts)
```

### Other Commands
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run test` - Run tests with Vitest
- `npm run lint` - ESLint check
- `npm run db:reset` - Reset database (⚠️ destructive)

### Windows Compatibility
All npm scripts use `NODE_OPTIONS='--require ./node-compat.cjs'` for cross-platform compatibility. This is **required** when running Next.js commands directly outside npm scripts.

---

## Important Conventions & Patterns

### File System Operations
The app manages files in-memory via `VirtualFileSystem`:
```typescript
// Virtual files are NOT written to disk
const fs = new VirtualFileSystem();
fs.createFile("/MyComponent.tsx", content);
fs.getFileContent("/MyComponent.tsx");
fs.updateFile("/MyComponent.tsx", newContent);
```

### Component Generation Workflow
1. User sends chat message describing a component
2. `/api/chat` route receives the request with current file system state
3. Claude generates component code using tool calls (`create_file`, `str_replace`)
4. Tool calls are processed server-side and reflected in the virtual file system
5. Updated state is sent to client and component previews update in real-time

### Context Usage
```typescript
// Chat state
const { messages, input, handleInputChange, handleSubmit, status } = useContext(ChatContext);

// File system operations
const { fileSystem, selectedFile, updateFile } = useContext(FileSystemContext);
```

### Database Models
- **User**: Email, password (hashed with bcrypt), project relationships
- **Project**: Name, userId (optional), messages JSON, data JSON, timestamps
  - Projects can be anonymous (userId = null) or owned by a user
  - Messages and data stored as JSON strings (for flexibility)

---

## Common Development Tasks

### Adding a New UI Component
1. Use Shadcn CLI or manually create in `src/components/ui/`
2. Export from `src/components/ui/index` if needed
3. Import and use in feature components

### Modifying the Chat System
- **AI Configuration**: Edit `/src/app/api/chat/route.ts` (system prompt, tools, models)
- **Message Handling**: Update `ChatProvider` in `/src/lib/contexts/chat-context.tsx`
- **Tool Implementation**: Add to `/src/lib/tools/` and register in the API route

### Updating Database Schema
1. Modify `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name migration_name`
3. Commit both schema and migration files

### Server Actions (Data Persistence)
- Located in `/src/actions/`
- Functions marked with `"use server"` for secure backend operations
- Used for user auth, project CRUD, data persistence

---

## Environment Configuration

### `.env` (Create/Edit as needed)
```
ANTHROPIC_API_KEY=your-key-here
DATABASE_URL=file:./dev.db (auto-configured for SQLite)
```

**Note**: App works without API key but returns static code instead of AI-generated components.

---

## Key File Locations

| File | Purpose |
|------|---------|
| `/src/app/api/chat/route.ts` | AI chat endpoint - system prompt, tool definitions |
| `/src/lib/contexts/chat-context.tsx` | Chat state management |
| `/src/lib/contexts/file-system-context.tsx` | Virtual file system state |
| `/src/lib/file-system.ts` | Virtual file system implementation |
| `/src/components/chat/ChatInterface.tsx` | Main chat UI |
| `/src/components/editor/CodeEditor.tsx` | Code editor & syntax highlighting |
| `/src/components/preview/PreviewFrame.tsx` | Live preview rendering |
| `/prisma/schema.prisma` | Database schema |
| `/next.config.ts` | Next.js configuration |
| `/.env` | Environment variables |

---

## Error Handling & Common Issues

### Module Not Found: `@/generated/prisma`
**Cause**: Prisma client not generated
**Fix**: Run `npx prisma generate`

### Port Already in Use
**Behavior**: Dev server automatically uses next available port (usually 3001)
**Manual Fix**: Kill process on port 3000 or specify port: `$env:PORT=3002; npm run dev`

### TypeScript Errors in Contexts
- Ensure contexts are used only in client components (`"use client"` at top)
- Ensure providers wrap child components in layout

### Database Connection Issues
- Check `.env` DATABASE_URL is correct
- Ensure `/dev.db` exists and is readable
- Try `npm run db:reset` (will clear all data)

---

## Testing

### Unit/Component Tests
Tests are colocated with components in `__tests__/` directories:
```
src/
├── components/chat/__tests__/
├── components/editor/__tests__/
├── lib/__tests__/
└── lib/transform/__tests__/
```

#### Running Unit Tests
```bash
npm run test                    # Run all tests
npm run test -- FileTree        # Run specific test
npm run test -- --watch        # Watch mode
```

#### Testing Tools
- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **jsdom**: DOM environment

### End-to-End (E2E) Tests
E2E tests use Playwright to test the full application flow:
```
e2e/
├── basic.spec.ts              # Basic page load and UI tests
└── auth.spec.ts               # Authentication and interaction tests
```

#### Running E2E Tests
```bash
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run tests with Playwright UI
npm run test:e2e:debug         # Run tests in debug mode
npm run test:e2e:report        # View HTML test report
```

#### E2E Testing Tools
- **Playwright**: Browser automation and end-to-end testing
- **@playwright/mcp**: Playwright MCP server integration

#### E2E Test Coverage
- Page load and navigation
- UI rendering and responsiveness
- Authentication workflows (when available)
- Chat interface interaction
- Error handling and recovery
- Accessibility compliance

#### Configuration
- **Config File**: `playwright.config.ts`
- **Base URL**: `http://localhost:3000`
- **Web Server**: Automatically starts `npm run dev`
- **Browsers**: Chromium, Firefox, WebKit
- **Viewports**: Desktop, Mobile, Tablet

#### Tips for Writing E2E Tests
1. Tests automatically start the dev server
2. Use `page.goto('/')` for relative navigation
3. Wait for network idle: `await page.waitForLoadState('networkidle')`
4. Use selectors: `button`, `[role="button"]`, `input`, etc.
5. Tests run in parallel by default (set `fullyParallel: false` to disable)

---

## Development Best Practices

1. **Always use contexts** for global state (chat, file system)
2. **Keep server actions** in `/src/actions/` for data persistence
3. **Use TypeScript** - strict mode enabled
4. **Tailwind classes** for styling - see `globals.css` for customization
5. **Radix UI components** as base for accessibility
6. **Component organization**: One component per file, related files grouped in directories
7. **Virtual file system**: Remember files are NOT on disk - they're in-memory only

---

## Related Documentation

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma Client](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [React 19](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
