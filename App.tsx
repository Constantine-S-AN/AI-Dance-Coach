import React, { useState, useEffect, useCallback } from 'react';
import CameraFeed from './components/CameraFeed';
import DanceStage from './components/DanceStage';
import { GeminiLiveService } from './services/geminiLiveService';
import { Landmark, GameState, PoseResults } from './types';
import { DANCER_COLORS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [landmarks, setLandmarks] = useState<Landmark[] | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiLiveService | null>(null);
  const [volume, setVolume] = useState(0);

  // Initialize Gemini Service on mount
  useEffect(() => {
    const service = new GeminiLiveService((vol) => setVolume(vol));
    setGeminiService(service);

    return () => {
      service.disconnect();
    };
  }, []);

  const handleStart = async () => {
    if (!geminiService) return;
    setGameState(GameState.LOADING);
    try {
      await geminiService.connect();
      setGameState(GameState.ACTIVE);
    } catch (error) {
      console.error("Failed to start:", error);
      setGameState(GameState.ERROR);
    }
  };

  const handleStop = () => {
    if (geminiService) {
      geminiService.disconnect();
    }
    setGameState(GameState.IDLE);
    setLandmarks(null);
  };

  const onPoseResults = useCallback((results: PoseResults) => {
    if (results.poseLandmarks) {
      setLandmarks(results.poseLandmarks);
    }
  }, []);

  const onFrameCapture = useCallback((base64: string) => {
    if (gameState === GameState.ACTIVE && geminiService) {
      geminiService.sendVideoFrame(base64);
    }
  }, [gameState, geminiService]);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center font-sans">
      {/* Header */}
      <header className="w-full p-4 flex justify-between items-center bg-black/80 backdrop-blur-md border-b border-cyan-900/50 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)]">
             <div className="w-6 h-6 bg-black rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
             </div>
          </div>
          <h1 className="text-2xl brand-font text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">NOVA DANCE AI</h1>
        </div>
        
        {gameState === GameState.ACTIVE && (
          <div className="flex items-center gap-6">
            {/* Visualizer for Gemini Voice */}
            <div className="flex items-end gap-1 h-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  className="w-1 bg-cyan-400/80 rounded-t transition-all duration-75"
                  style={{ height: `${Math.min(100, Math.max(10, volume * 100 * (Math.random() + 0.5)))}%` }}
                />
              ))}
            </div>
            <button 
              onClick={handleStop}
              className="bg-transparent border border-red-500 text-red-500 hover:bg-red-500 hover:text-white px-6 py-2 rounded uppercase text-sm tracking-widest font-bold transition-all duration-300"
            >
              Terminate
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl p-4 md:p-8 flex flex-col md:flex-row gap-8 relative">
        
        {/* Welcome Screen Overlay */}
        {gameState === GameState.IDLE && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-md rounded-3xl m-4 md:m-8">
            <div className="text-center p-12 max-w-xl relative">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-purple-500"></div>
              
              <h2 className="text-5xl brand-font text-white mb-2 tracking-tighter">INITIATE <span className="text-cyan-400">DANCE</span></h2>
              <p className="text-gray-400 mb-10 text-lg font-light tracking-wide">
                Activate your camera feed. <span className="text-purple-400 font-bold">NOVA</span> will synchronize with your movement patterns.
              </p>
              <button 
                onClick={handleStart}
                className="group relative px-10 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xl transition-all clip-path-polygon"
                style={{ clipPath: 'polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%)' }}
              >
                START SYSTEM
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {gameState === GameState.LOADING && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/90 backdrop-blur-sm">
             <div className="flex flex-col items-center gap-4">
               <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
               <div className="text-cyan-500 brand-font text-sm animate-pulse">CONNECTING TO NEURAL NET...</div>
             </div>
          </div>
        )}

        {/* Camera Feed (Left) */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-cyan-600 rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
           <div className="relative h-full bg-black rounded-2xl overflow-hidden border border-gray-800">
             <CameraFeed 
               isActive={gameState === GameState.ACTIVE} 
               onPoseResults={onPoseResults}
               onFrameCapture={onFrameCapture}
             />
             {gameState === GameState.ACTIVE && (
               <div className="absolute bottom-4 right-4 flex gap-2">
                 <div className="px-2 py-1 bg-black/80 border border-green-500/50 text-green-500 text-xs font-mono rounded">
                   CAM: ACTIVE
                 </div>
                 <div className="px-2 py-1 bg-black/80 border border-green-500/50 text-green-500 text-xs font-mono rounded">
                   AI: ONLINE
                 </div>
               </div>
             )}
           </div>
        </div>

        {/* 3D Stage (Right) */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-auto relative group">
           <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-purple-600 rounded-2xl opacity-50 blur group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
           <div className="relative h-full">
              <DanceStage landmarks={landmarks} />
           </div>
        </div>

      </main>

      {/* Footer Instructions */}
      <footer className="w-full p-4 flex justify-between px-8 text-gray-600 text-xs uppercase tracking-wider">
        <span>System Status: Optimal</span>
        <span>Powered by Gemini Live API</span>
      </footer>
    </div>
  );
};

export default App;