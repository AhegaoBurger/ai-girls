import { useEffect, useState } from 'react';

export function AvatarCanvas() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
          <div className="text-white text-xl animate-pulse">Loading avatar...</div>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-xl mb-2">Avatar unavailable</p>
            <p className="text-sm opacity-70">Please export Godot project to godot-web-build/</p>
          </div>
        </div>
      ) : (
        <iframe
          src="/godot/index.html"
          className="w-full h-full border-none"
          title="AI Avatar"
          onError={() => setHasError(true)}
        />
      )}
    </div>
  );
}
