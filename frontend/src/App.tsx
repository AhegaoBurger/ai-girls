import { ChatInterface } from './components/ChatInterface';
import { AvatarCanvas } from './components/AvatarCanvas';

function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Godot Canvas (Full Screen Background) */}
      <AvatarCanvas />

      {/* Chat Interface Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="h-full w-full flex items-end justify-center p-6">
          <div className="pointer-events-auto w-full max-w-2xl">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
