# Voice Agent - AI Sales Automation Platform

A real-time AI voice agent platform for sales automation and appointment booking, built with FastAPI backend and Next.js frontend.

## Features

- 🎙️ **Real-time Voice Conversations** - Using OpenAI's Realtime API for natural voice interactions
- 📅 **Calendar Integration** - Book meetings directly through Cal.com integration
- 🤖 **Customizable AI Agents** - Create and configure multiple agents with different personalities
- 🔧 **Live Testing** - Test your agents in real-time with the built-in testing panel
- 📝 **System Instructions Editor** - Easy-to-use interface for configuring agent behavior

## Project Structure

```
voice-agent/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # FastAPI application entry
│   │   ├── config.py       # Configuration management
│   │   ├── models.py       # Pydantic models
│   │   ├── routes/         # API routes
│   │   │   ├── agents.py   # Agent management endpoints
│   │   │   ├── calendar.py # Cal.com integration endpoints
│   │   │   └── realtime.py # WebSocket for real-time voice
│   │   └── services/       # Business logic
│   │       ├── agent.py    # Agent service
│   │       ├── calcom.py   # Cal.com API service
│   │       └── realtime.py # OpenAI Realtime service
│   └── requirements.txt
│
└── frontend/               # Next.js frontend
    └── src/
        ├── app/            # Next.js app router pages
        ├── components/     # React components
        ├── hooks/          # Custom React hooks
        └── lib/            # Utilities and API client
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key (with access to Realtime API)
- Cal.com API key (optional, for calendar integration)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

5. Configure your environment variables in `.env`:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   CALCOM_API_KEY=your_calcom_api_key_here
   CALCOM_EVENT_TYPE_ID=your_event_type_id
   ```

6. Start the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Agents

- `GET /api/agents/` - List all agents
- `POST /api/agents/` - Create a new agent
- `GET /api/agents/{id}` - Get agent details
- `PUT /api/agents/{id}` - Update an agent
- `DELETE /api/agents/{id}` - Delete an agent

### Sessions

- `POST /api/agents/{id}/sessions` - Create a new session
- `POST /api/agents/{id}/sessions/{session_id}/chat` - Send a chat message

### Calendar (Cal.com)

- `GET /api/calendar/availability` - Get available time slots
- `POST /api/calendar/bookings` - Create a booking
- `GET /api/calendar/bookings` - List bookings
- `DELETE /api/calendar/bookings/{id}` - Cancel a booking

### Realtime

- `WS /api/realtime/ws/{agent_id}` - WebSocket for real-time voice communication

## Agent Configuration

Agents are configured using system instructions in Markdown format. Here's an example:

```markdown
## Identity
You are a friendly sales support agent...

## Style Guardrails
- Be Concise
- Be Conversational
- Be Proactive

## Task
1. Greet the customer
2. Listen to their needs
3. Offer to book a meeting if needed
```

## Tools Available to Agents

- `check_availability` - Check calendar availability
- `book_meeting` - Book a meeting
- `transfer_to_human` - Transfer to human agent
- `end_call` - End the current call

## License

MIT
