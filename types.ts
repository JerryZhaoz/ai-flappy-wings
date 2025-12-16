export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface GameConfig {
  gravity: number;
  jumpStrength: number;
  pipeSpeed: number;
  pipeSpawnRate: number;
  pipeGap: number;
}

export interface BirdSkin {
  id: string;
  name: string;
  price: number;
  colors: {
    body: string;
    wing: string;
    eye: string;
    beak: string;
  };
}

export interface PlayerData {
  highScore: number;
  coins: number;
  unlockedSkinIds: string[];
  selectedSkinId: string;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  isPlayer: boolean;
}