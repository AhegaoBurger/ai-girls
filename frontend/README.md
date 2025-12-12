# AI Girls Frontend

React frontend for AI Girls web application with Grok-style chat interface.

## Features

- **Chat Interface**: Text input overlay on full-screen avatar canvas
- **Real-time Updates**: WebSocket connection for avatar state sync
- **Responsive Design**: Tailwind CSS with shadcn/ui components
- **TypeScript**: Full type safety across the application

## Setup

### Install Dependencies

```bash
npm install
```

## Development

```bash
npm run dev
```

Frontend will start on `http://localhost:5173` with proxy to backend on port 3000.

## Production Build

```bash
npm run build
```

Output will be in `dist/` directory.

## Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── card.tsx
│   ├── AvatarCanvas.tsx       # Godot iframe wrapper
│   ├── ChatInterface.tsx      # Main chat UI
│   └── MessageList.tsx        # Message display
├── hooks/
│   └── useChat.ts             # Chat state management
├── lib/
│   ├── api.ts                 # Backend API client
│   └── utils.ts               # Utility functions
├── types/
│   └── index.ts               # TypeScript types
├── App.tsx                    # Main app component
├── main.tsx                   # Entry point
└── index.css                  # Global styles
```

## Environment Variables

- `VITE_API_URL`: Backend API URL (default: empty for same-origin)

## Technologies

- **Vite**: Build tool and dev server
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Accessible UI components
- **Lucide React**: Icon library

## License

MIT
