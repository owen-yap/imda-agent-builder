# Monadle Chat

An agent platform for companies to deploy custom-made agents for different use cases.

## 🚀 Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and builds
- **TanStack Router** for type-safe routing
- **TanStack Query** for data fetching and state management
- **Radix UI** & **Tailwind CSS** for responsive, accessible UI components
- **AI SDK** for AI-related frontend functionality

### Backend
- **Deno** for server-side runtime
- **Hono** for HTTP server and routing
- **Drizzle ORM** for database interactions
- **Supabase** for authentication, storage, and database
- **OpenAI** integration for AI capabilities

## 📁 Project Structure

```
monadle-chat/
├── frontend/           - React frontend application
│   ├── src/
│   │   ├── components/ - Reusable UI components
│   │   ├── hooks/      - Custom React hooks
│   │   ├── lib/        - Utility functions and libraries
│   │   ├── routes/     - Application routes
│   │   └── ...
├── server/             - Deno backend server
│   ├── src/
│   │   ├── db/         - Database models and connections
│   │   ├── functions/  - Reusable server functions
│   │   ├── middleware/ - Request middleware
│   │   ├── routes/     - API endpoint definitions
│   │   ├── tools/      - AI tools and utilities
│   │   └── types/      - TypeScript type definitions
├── supabase/           - Supabase configuration and functions
└── .cursor/            - Cursor rules for AI-assisted development
```

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- Deno (v1.40+)
- pnpm (preferred package manager)
- Supabase account

### Setting Up the Development Environment

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/monadle-chat.git
   cd monadle-chat
   ```

2. Install frontend dependencies:
   ```bash
   cd frontend
   pnpm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and server directories
   - Fill in the required environment variables

4. Start the development server:
   ```bash
   # Terminal 1 - Frontend
   cd frontend
   pnpm dev
   
   # Terminal 2 - Backend
   cd server
   deno task dev
   ```

## 🤝 Contributing

### AI-Assisted Development

Monadle Chat is designed to leverage AI-assisted development for efficient collaboration. Here's how to make the most of it:

#### Using Cursor Rules

Cursor rules provide context-aware guidance for development. They are located in the `.cursor/rules/` directory and contain project-specific conventions.

1. **Available Rules**:
   - `cursor-rules`: How to add or edit Cursor rules
   - `data-fetching`: Rules for frontend data fetching
   - `backend-structure`: Server structure and organization
   - `dependency-management`: Package management guidelines

2. **Viewing Rules**: When using Cursor IDE, you can access these rules by:
   - Typing `/rule` in the command palette
   - The AI will automatically apply relevant rules based on file context

#### MCP Servers

Managed Compute Platform (MCP) servers are used for Supabase integration. These allow:
- Project listing and management
- Database operations
- TypeScript type generation
- Branch management for safe feature development

### Development Workflow

1. **Create a branch** for your feature or bugfix
2. **Follow the project conventions** outlined in Cursor rules
3. **Use AI assistance** to help with code generation and understanding
4. **Test thoroughly** before submitting a PR
5. **Document your changes** in the PR description

### Code Guidelines

- Follow TypeScript best practices
- Use React hooks appropriately
- Follow the data fetching patterns from the `data-fetching` rule
- Ensure proper error handling
- Write clean, self-documenting code
