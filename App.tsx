import React, { useState, useEffect, useCallback } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameState, BirdSkin, PlayerData, LeaderboardEntry } from './types';
import { getGameOverCommentary } from './services/geminiService';
import { 
  PlayIcon, 
  ArrowPathIcon, 
  ShoppingBagIcon, 
  TrophyIcon, 
  XMarkIcon,
  CurrencyDollarIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/solid';

// Constants for Skins
const AVAILABLE_SKINS: BirdSkin[] = [
  { 
    id: 'default', 
    name: 'Classic Yellow', 
    price: 0, 
    colors: { body: '#FBBF24', wing: '#F59E0B', eye: 'black', beak: '#EF4444' } 
  },
  { 
    id: 'blue_jay', 
    name: 'Speedy Blue', 
    price: 10, 
    colors: { body: '#3B82F6', wing: '#1D4ED8', eye: 'black', beak: '#F59E0B' } 
  },
  { 
    id: 'cardinal', 
    name: 'Angry Red', 
    price: 30, 
    colors: { body: '#EF4444', wing: '#991B1B', eye: 'black', beak: '#FBBF24' } 
  },
  { 
    id: 'cyber', 
    name: 'Cyber Drone', 
    price: 100, 
    colors: { body: '#14B8A6', wing: '#0F766E', eye: '#F43F5E', beak: '#E2E8F0' } 
  },
  { 
    id: 'golden', 
    name: 'Golden God', 
    price: 500, 
    colors: { body: '#FCD34D', wing: '#FDE047', eye: '#78350F', beak: '#FFFFFF' } 
  }
];

const INITIAL_DATA: PlayerData = {
  highScore: 0,
  coins: 0,
  unlockedSkinIds: ['default'],
  selectedSkinId: 'default'
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [score, setScore] = useState(0);
  const [playerData, setPlayerData] = useState<PlayerData>(INITIAL_DATA);
  
  const [aiComment, setAiComment] = useState<string>('');
  const [isLoadingComment, setIsLoadingComment] = useState(false);
  const [triggerJump, setTriggerJump] = useState(0);

  // Modals state
  const [showShop, setShowShop] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);

  // Load Player Data
  useEffect(() => {
    const saved = localStorage.getItem('flappyData_v2');
    if (saved) {
      setPlayerData(JSON.parse(saved));
    }
  }, []);

  // Save Player Data
  useEffect(() => {
    localStorage.setItem('flappyData_v2', JSON.stringify(playerData));
  }, [playerData]);

  // Generate Mock Leaderboard
  const generateLeaderboard = useCallback(() => {
    const baseScores = [
      { name: "FlapMaster99", score: 120 },
      { name: "BirdBrain", score: 85 },
      { name: "SkyWalker", score: 45 },
      { name: "WingMan", score: 32 },
      { name: "NoobBird", score: 5 }
    ];
    
    // Mix in player's score
    const entries: LeaderboardEntry[] = [
      ...baseScores.map(s => ({ ...s, isPlayer: false, rank: 0 })),
      { name: "YOU", score: playerData.highScore, isPlayer: true, rank: 0 }
    ];

    // Add some randoms around player score to make it competitive
    for(let i=0; i<3; i++) {
        entries.push({
            name: `Player_${Math.floor(Math.random()*999)}`,
            score: Math.max(0, playerData.highScore + Math.floor(Math.random() * 20) - 10),
            isPlayer: false,
            rank: 0
        });
    }

    // Sort and Rank
    entries.sort((a, b) => b.score - a.score);
    const rankedEntries = entries.slice(0, 10).map((entry, index) => ({
      ...entry,
      rank: index + 1
    }));
    
    setLeaderboardData(rankedEntries);
  }, [playerData.highScore]);

  // Handle Game Over
  useEffect(() => {
    if (gameState === GameState.GAME_OVER) {
      // Update coins and high score
      setPlayerData(prev => ({
        ...prev,
        coins: prev.coins + score,
        highScore: Math.max(prev.highScore, score)
      }));

      const fetchCommentary = async () => {
        setIsLoadingComment(true);
        const comment = await getGameOverCommentary(score);
        setAiComment(comment);
        setIsLoadingComment(false);
      };
      fetchCommentary();
    }
  }, [gameState]); // Only trigger when state changes to GAME_OVER

  const handleStart = () => {
    setAiComment('');
    setGameState(GameState.PLAYING);
    setTriggerJump(prev => prev + 1);
  };

  const handleRestart = () => {
    setGameState(GameState.START);
  };

  const handleBuySkin = (skin: BirdSkin) => {
    if (playerData.unlockedSkinIds.includes(skin.id)) {
      setPlayerData(prev => ({ ...prev, selectedSkinId: skin.id }));
    } else if (playerData.coins >= skin.price) {
      setPlayerData(prev => ({
        ...prev,
        coins: prev.coins - skin.price,
        unlockedSkinIds: [...prev.unlockedSkinIds, skin.id],
        selectedSkinId: skin.id
      }));
    }
  };

  const handleGlobalClick = useCallback((e: KeyboardEvent) => {
      // Don't jump if modals are open
      if (showShop || showLeaderboard) {
          if (e.code === 'Escape') {
            setShowShop(false);
            setShowLeaderboard(false);
          }
          return;
      }

      if (e.code === 'Space' || e.code === 'ArrowUp') {
          if (gameState === GameState.START) handleStart();
          else if (gameState === GameState.PLAYING) setTriggerJump(prev => prev + 1);
          else if (gameState === GameState.GAME_OVER) handleRestart();
      }
  }, [gameState, showShop, showLeaderboard]);

  useEffect(() => {
      window.addEventListener('keydown', handleGlobalClick);
      return () => window.removeEventListener('keydown', handleGlobalClick);
  }, [handleGlobalClick]);

  const currentSkin = AVAILABLE_SKINS.find(s => s.id === playerData.selectedSkinId) || AVAILABLE_SKINS[0];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      {/* Header */}
      <div className="absolute top-4 w-full max-w-md flex justify-between px-4 z-10 text-white drop-shadow-md pointer-events-none">
        <div className="flex flex-col">
          <span className="text-xs text-slate-300">SCORE</span>
          <span className="text-2xl font-bold">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1">
             <CurrencyDollarIcon className="h-4 w-4 text-yellow-400" />
             <span className="text-lg font-bold text-yellow-400">{playerData.coins}</span>
          </div>
          <span className="text-xs text-slate-300 mt-1">BEST: {playerData.highScore}</span>
        </div>
      </div>

      <div className="relative w-full max-w-md aspect-[2/3] border-4 border-slate-700 rounded-xl overflow-hidden bg-sky-300">
        
        <GameCanvas 
            gameState={gameState} 
            setGameState={setGameState} 
            setScore={setScore}
            triggerJump={triggerJump}
            skin={currentSkin}
        />

        {/* Start Screen Overlay */}
        {gameState === GameState.START && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-20">
            <h1 className="text-4xl font-black text-white mb-2 text-center drop-shadow-[0_4px_0_rgba(0,0,0,0.5)] tracking-tighter">
              AI FLAPPY<br/>WINGS
            </h1>
            
            <div className="flex gap-4 mb-6">
                 <button 
                    onClick={() => setShowShop(true)}
                    className="flex flex-col items-center gap-1 group"
                 >
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors border border-white/20">
                        <ShoppingBagIcon className="h-6 w-6 text-yellow-300" />
                    </div>
                    <span className="text-[10px] text-white font-bold">SHOP</span>
                 </button>
                 
                 <button 
                    onClick={() => { generateLeaderboard(); setShowLeaderboard(true); }}
                    className="flex flex-col items-center gap-1 group"
                 >
                    <div className="p-3 bg-white/10 rounded-full group-hover:bg-white/20 transition-colors border border-white/20">
                        <TrophyIcon className="h-6 w-6 text-purple-300" />
                    </div>
                    <span className="text-[10px] text-white font-bold">RANK</span>
                 </button>
            </div>

            <button
              onClick={handleStart}
              className="bg-yellow-400 hover:bg-yellow-300 text-black border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 font-bold py-4 px-12 rounded-full text-xl transition-all flex items-center gap-2 shadow-lg"
            >
              <PlayIcon className="h-6 w-6" />
              FLY
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState === GameState.GAME_OVER && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md z-20 p-6 text-center animate-in fade-in zoom-in duration-300">
            <h2 className="text-3xl font-bold text-red-500 mb-2 drop-shadow-md">GAME OVER</h2>
            
            <div className="bg-white/10 p-4 rounded-lg border border-white/20 mb-4 w-full">
              <div className="flex justify-between items-end mb-2 border-b border-white/10 pb-2">
                <span className="text-slate-300 text-sm">Score</span>
                <span className="text-3xl text-white">{score}</span>
              </div>
              <div className="flex justify-between items-center">
                 <span className="text-slate-300 text-sm">Coins Earned</span>
                 <div className="flex items-center gap-1">
                    <span className="text-xl text-yellow-400">+{score}</span>
                    <CurrencyDollarIcon className="h-5 w-5 text-yellow-400" />
                 </div>
              </div>
            </div>

            {/* AI Commentary Section */}
            <div className="bg-slate-800 w-full p-4 rounded-lg border-2 border-slate-600 mb-6 relative">
                <div className="absolute -top-3 left-4 bg-slate-600 text-xs px-2 py-0.5 rounded text-white">
                    AI Commentator
                </div>
                {isLoadingComment ? (
                    <div className="flex justify-center items-center py-2 space-x-2">
                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                         <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-200 italic leading-relaxed">
                        "{aiComment}"
                    </p>
                )}
            </div>

            <div className="flex gap-3">
                <button
                onClick={() => { setGameState(GameState.START); }}
                className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-full"
                >
                <ShoppingBagIcon className="h-5 w-5" />
                </button>
                <button
                onClick={handleRestart}
                className="bg-green-500 hover:bg-green-400 text-white border-b-4 border-green-700 active:border-b-0 active:translate-y-1 font-bold py-3 px-8 rounded-full text-lg transition-all flex items-center gap-2 flex-1 justify-center"
                >
                <ArrowPathIcon className="h-5 w-5" />
                RETRY
                </button>
            </div>
          </div>
        )}

        {/* Shop Modal */}
        {showShop && (
            <div className="absolute inset-0 bg-slate-900 z-30 flex flex-col p-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <ShoppingBagIcon className="h-6 w-6 text-yellow-400"/> SHOP
                    </h2>
                    <button onClick={() => setShowShop(false)} className="text-slate-400 hover:text-white">
                        <XMarkIcon className="h-8 w-8" />
                    </button>
                </div>
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg mb-4">
                    <span className="text-slate-300">Your Balance</span>
                    <span className="text-yellow-400 font-bold flex items-center gap-1">
                        <CurrencyDollarIcon className="h-5 w-5"/> {playerData.coins}
                    </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {AVAILABLE_SKINS.map(skin => {
                        const isUnlocked = playerData.unlockedSkinIds.includes(skin.id);
                        const isSelected = playerData.selectedSkinId === skin.id;
                        const canAfford = playerData.coins >= skin.price;

                        return (
                            <div key={skin.id} 
                                onClick={() => handleBuySkin(skin)}
                                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                    isSelected ? 'bg-indigo-900 border-indigo-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: skin.colors.body }}>
                                        <div className="absolute right-0 top-3 w-4 h-3 rounded-l-full" style={{ backgroundColor: skin.colors.wing }}></div>
                                        <div className="absolute right-[-2px] top-1 w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white text-sm">{skin.name}</span>
                                        {!isUnlocked && <span className="text-xs text-yellow-400 flex items-center"><CurrencyDollarIcon className="h-3 w-3 mr-0.5"/>{skin.price}</span>}
                                        {isUnlocked && <span className="text-xs text-green-400">Owned</span>}
                                    </div>
                                </div>
                                <div>
                                    {isSelected ? (
                                        <CheckBadgeIcon className="h-6 w-6 text-indigo-400" />
                                    ) : isUnlocked ? (
                                        <button className="text-xs bg-slate-700 px-3 py-1 rounded text-white">Equip</button>
                                    ) : (
                                        <button className={`text-xs px-3 py-1 rounded font-bold ${canAfford ? 'bg-yellow-500 text-black' : 'bg-slate-700 text-slate-500'}`}>
                                            Buy
                                        </button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

        {/* Leaderboard Modal */}
        {showLeaderboard && (
            <div className="absolute inset-0 bg-slate-900 z-30 flex flex-col p-4 animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <TrophyIcon className="h-6 w-6 text-purple-400"/> RANKING
                    </h2>
                    <button onClick={() => setShowLeaderboard(false)} className="text-slate-400 hover:text-white">
                        <XMarkIcon className="h-8 w-8" />
                    </button>
                </div>
                
                <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700">
                    <table className="w-full text-left">
                        <thead className="bg-slate-700 text-slate-300 text-xs uppercase">
                            <tr>
                                <th className="p-3">#</th>
                                <th className="p-3">Player</th>
                                <th className="p-3 text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {leaderboardData.map((entry) => (
                                <tr key={entry.rank} className={`${entry.isPlayer ? 'bg-indigo-900/50 text-white font-bold' : 'text-slate-300 border-b border-slate-700/50'}`}>
                                    <td className="p-3">
                                        {entry.rank === 1 && <span className="text-yellow-400">🥇</span>}
                                        {entry.rank === 2 && <span className="text-gray-300">🥈</span>}
                                        {entry.rank === 3 && <span className="text-orange-400">🥉</span>}
                                        {entry.rank > 3 && entry.rank}
                                    </td>
                                    <td className="p-3">{entry.name}</td>
                                    <td className="p-3 text-right">{entry.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-center text-xs text-slate-500 mt-4">Top 10 Worldwide</p>
            </div>
        )}

      </div>
      
      <div className="mt-4 text-slate-500 text-xs max-w-md text-center">
        Powered by React, Tailwind & Google Gemini
      </div>
    </div>
  );
};

export default App;