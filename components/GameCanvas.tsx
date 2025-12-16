import React, { useRef, useEffect, useCallback } from 'react';
import { GameState, BirdSkin } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  setScore: (score: number) => void;
  triggerJump: number;
  skin: BirdSkin; // Receive selected skin
}

// Game Constants
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_RADIUS = 15;
const GRAVITY = 0.5;
const JUMP_STRENGTH = -8;
const PIPE_WIDTH = 50;
const PIPE_GAP = 160;
const PIPE_SPEED = 3;

interface Bird {
  y: number;
  velocity: number;
}

interface Pipe {
  x: number;
  topHeight: number;
  passed: boolean;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, setScore, triggerJump, skin }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refs for game loop state
  const birdRef = useRef<Bird>({ y: CANVAS_HEIGHT / 2, velocity: 0 });
  const pipesRef = useRef<Pipe[]>([]);
  const frameRef = useRef<number>(0);
  const scoreRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Initialize game
  const resetGame = useCallback(() => {
    birdRef.current = { y: CANVAS_HEIGHT / 2, velocity: 0 };
    pipesRef.current = [];
    scoreRef.current = 0;
    setScore(0);
  }, [setScore]);

  // Jump logic
  const jump = useCallback(() => {
    if (gameState === GameState.PLAYING) {
      birdRef.current.velocity = JUMP_STRENGTH;
    }
  }, [gameState]);

  // Handle external trigger
  useEffect(() => {
    if (triggerJump > 0) jump();
  }, [triggerJump, jump]);

  // Main Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper to draw bird with skin
    const drawBird = (y: number, rotation: number) => {
      ctx.save();
      ctx.translate(CANVAS_WIDTH / 3, y);
      ctx.rotate(Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (rotation * 0.1))));
      
      // Bird Body
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = skin.colors.body;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Eye
      ctx.beginPath();
      ctx.arc(8, -6, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(10, -6, 1.5, 0, Math.PI * 2);
      ctx.fillStyle = skin.colors.eye;
      ctx.fill();

      // Wing
      ctx.beginPath();
      ctx.ellipse(-5, 5, 8, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = skin.colors.wing;
      ctx.fill();

      // Beak
      ctx.beginPath();
      ctx.moveTo(8, 2);
      ctx.lineTo(18, 6);
      ctx.lineTo(8, 10);
      ctx.fillStyle = skin.colors.beak;
      ctx.fill();

      ctx.restore();
    };

    const drawPipe = (x: number, topH: number) => {
      ctx.fillStyle = '#22C55E'; // Green-500
      ctx.strokeStyle = '#14532D'; // Green-900
      ctx.lineWidth = 2;

      // Top Pipe
      ctx.fillRect(x, 0, PIPE_WIDTH, topH);
      ctx.strokeRect(x, 0, PIPE_WIDTH, topH);
      // Cap
      ctx.fillRect(x - 2, topH - 20, PIPE_WIDTH + 4, 20);
      ctx.strokeRect(x - 2, topH - 20, PIPE_WIDTH + 4, 20);

      // Bottom Pipe
      const bottomY = topH + PIPE_GAP;
      const bottomH = CANVAS_HEIGHT - bottomY;
      ctx.fillRect(x, bottomY, PIPE_WIDTH, bottomH);
      ctx.strokeRect(x, bottomY, PIPE_WIDTH, bottomH);
      // Cap
      ctx.fillRect(x - 2, bottomY, PIPE_WIDTH + 4, 20);
      ctx.strokeRect(x - 2, bottomY, PIPE_WIDTH + 4, 20);
    };

    const drawBackground = (offset: number) => {
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#38BDF8'); // Sky blue
        gradient.addColorStop(1, '#BAE6FD'); // Light blue
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        
        // Simple City/Cloud background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        // Clouds
        ctx.beginPath();
        ctx.arc((100 - offset * 0.5) % (CANVAS_WIDTH + 100), 100, 30, 0, Math.PI * 2);
        ctx.arc((300 - offset * 0.5) % (CANVAS_WIDTH + 100), 150, 40, 0, Math.PI * 2);
        ctx.fill();
    };

    const render = (time: number) => {
      lastTimeRef.current = time;

      // Clear
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      if (gameState === GameState.START) {
        drawBackground(time * 0.05);
        drawBird(CANVAS_HEIGHT / 2 + Math.sin(time / 300) * 10, 0);
        frameRef.current = requestAnimationFrame(render);
        return;
      }

      if (gameState === GameState.PLAYING) {
        // Physics
        birdRef.current.velocity += GRAVITY;
        birdRef.current.y += birdRef.current.velocity;

        // Pipe Management
        const lastPipe = pipesRef.current[pipesRef.current.length - 1];
        if (!lastPipe || (CANVAS_WIDTH - lastPipe.x) > 220) {
            const minPipeHeight = 50;
            const maxPipeHeight = CANVAS_HEIGHT - PIPE_GAP - minPipeHeight;
            const randomHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight;
            
            pipesRef.current.push({
                x: CANVAS_WIDTH,
                topHeight: randomHeight,
                passed: false
            });
        }

        // Move pipes & Remove offscreen
        pipesRef.current.forEach(p => p.x -= PIPE_SPEED);
        if (pipesRef.current.length > 0 && pipesRef.current[0].x < -PIPE_WIDTH) {
            pipesRef.current.shift();
        }

        // Collision & Scoring
        const birdX = CANVAS_WIDTH / 3;
        const birdY = birdRef.current.y;

        // Ground/Ceiling check
        if (birdY + BIRD_RADIUS >= CANVAS_HEIGHT || birdY - BIRD_RADIUS <= 0) {
            setGameState(GameState.GAME_OVER);
        }

        pipesRef.current.forEach(pipe => {
            // AABB Collision
            if (birdX + BIRD_RADIUS > pipe.x && birdX - BIRD_RADIUS < pipe.x + PIPE_WIDTH) {
                if ((birdY - BIRD_RADIUS < pipe.topHeight) || (birdY + BIRD_RADIUS > pipe.topHeight + PIPE_GAP)) {
                    setGameState(GameState.GAME_OVER);
                }
            }

            // Score update
            if (!pipe.passed && birdX > pipe.x + PIPE_WIDTH) {
                pipe.passed = true;
                scoreRef.current += 1;
                setScore(scoreRef.current);
            }
        });

        // Draw
        drawBackground(time * 0.1);
        pipesRef.current.forEach(p => drawPipe(p.x, p.topHeight));
        drawBird(birdY, birdRef.current.velocity);

        frameRef.current = requestAnimationFrame(render);
      } 
      
      if (gameState === GameState.GAME_OVER) {
         drawBackground(time * 0.01);
         pipesRef.current.forEach(p => drawPipe(p.x, p.topHeight));
         drawBird(birdRef.current.y, 10);
      }
    };

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [gameState, setGameState, setScore, skin]);

  // Reset logic listener
  useEffect(() => {
    if (gameState === GameState.START) {
      resetGame();
    }
  }, [gameState, resetGame]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full h-full max-w-md mx-auto shadow-2xl rounded-lg cursor-pointer bg-slate-800"
      onMouseDown={jump}
      onTouchStart={(e) => {
        e.preventDefault();
        jump();
      }}
    />
  );
};

export default GameCanvas;