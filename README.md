# Synapse - Your Visual Memory

Synapse is a personal knowledge management system that captures, understands, and visually organizes your thoughts—no matter where they originate. Whether it's a screenshot of a design, a quote from a research paper, a product you love, or a handwritten note, Synapse transforms fragmented inputs into a coherent, searchable memory.

## Features

### 🧠 Intelligent Content Capture
- **Browser Extension**: Capture content from any website with one click
- **Smart Classification**: Automatically categorizes content as quotes, todos, products, articles, etc.
- **Multiple Capture Methods**: Text selection, screenshots, URL saving, and voice notes
- **Keyboard Shortcuts**: Quick capture with Ctrl+Shift+S (Cmd+Shift+S on Mac)

### 🔍 Semantic Search
- **Natural Language Queries**: Search like "AI articles from last month" or "black leather shoes under $300"
- **AI-Powered Understanding**: Uses Claude AI to understand search intent
- **Hybrid Search**: Combines vector search with metadata filtering for best results
- **Smart Suggestions**: Query suggestions and autocomplete as you type

### 📊 Visual Memory Interface
- **Content-Type Cards**: Beautiful, specialized cards for different content types
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Collections**: Organize thoughts into custom collections
- **Favorites & Archive**: Save important thoughts and archive old ones

### 🤖 Claude AI Integration
- **Content Classification**: Automatically categorize and tag captured content
- **Query Understanding**: Convert natural language to structured searches
- **Smart Summaries**: Generate concise summaries of long articles
- **Metadata Extraction**: Extract authors, publications, prices, and more

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker & Docker Compose

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd synapse
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development environment**
   ```bash
   # Start databases with Docker
   docker-compose up -d

   # Run database migrations
   npm run db:migrate

   # Start development servers
   npm run dev
   ```

5. **Load browser extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select `apps/extension/dist`
   - The extension will be built automatically when you run `npm run dev`

### Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL=postgresql://synapse:synapse_dev_password@localhost:5432/synapse

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# LiteLLM Proxy for Claude
LITELLM_PROXY_URL=http://localhost:4000
LITELLM_PROXY_API_KEY=your-litellm-api-key

# Vector Database
VECTOR_DB_API_KEY=your-vector-db-key
VECTOR_DB_ENVIRONMENT=your-vector-db-environment
```

## Development

### Project Structure

```
synapse/
├── apps/
│   ├── web/                 # Next.js web application
│   ├── extension/           # Browser extension
│   └── api/                 # Backend API (if separated)
├── packages/
│   ├── database/            # Database schema and migrations
│   ├── shared-types/        # Shared TypeScript types
│   ├── ui/                  # Shared UI components
│   └── utils/               # Shared utilities
├── docker/
│   ├── litellm/             # LiteLLM proxy configuration
│   └── postgres/            # PostgreSQL setup
└── docs/                    # Documentation
```

### Scripts

```bash
# Development
npm run dev              # Start all development servers
npm run dev:web          # Start only web app
npm run dev:extension    # Build and watch extension

# Building
npm run build            # Build all packages
npm run build:web        # Build web app
npm run build:extension  # Build extension

# Database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:reset         # Reset database

# Testing
npm run test             # Run all tests
npm run lint             # Lint all packages
npm run type-check       # Type check all packages
```

## Browser Extension Development

### Building the Extension

```bash
# Development build with hot reload
npm run dev:extension

# Production build
npm run build:extension
```

### Loading for Testing

1. Build the extension: `npm run build:extension`
2. Open Chrome: `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `apps/extension/dist` directory

### Testing Capture Functionality

1. Navigate to any webpage
2. Select some text
3. Use the floating button or press Ctrl+Shift+S
4. Choose how to save the content
5. Verify it appears in your Synapse dashboard

## API Documentation

### Authentication

All API endpoints require authentication via NextAuth session.

### Capture Endpoints

#### POST /api/capture/text
Capture selected text with automatic classification.

#### POST /api/capture/screenshot
Capture and store screenshots.

#### POST /api/capture/url
Save URL with metadata extraction.

#### POST /api/search
Semantic search with natural language processing.

---

Built by the Abhishek Sharma. Transform your fragmented thoughts into a coherent, searchable memory.
