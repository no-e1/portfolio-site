import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import styles from "./TrexRunner.module.css";
import { TREX_SPRITE_2X } from "./trexSprite";

type GamePhase = "idle" | "running" | "gameOver";

type Obstacle = {
  x: number;
  width: number;
  height: number;
  kind: "small" | "large";
};

type GameState = {
  phase: GamePhase;
  dinoY: number;
  velocityY: number;
  isDucking: boolean;
  obstacles: Obstacle[];
  spawnIn: number;
  speed: number;
  score: number;
  elapsed: number;
  horizonOffset: number;
};

const CANVAS_HEIGHT = 180;
const DINO_X = 50;
const DINO_WIDTH = 44;
const DUCK_WIDTH = 59;
const DINO_HEIGHT = 47;
const DUCK_HEIGHT = 25;
const GRAVITY = 1850;
const JUMP_VELOCITY = -650;
const HIGH_SCORE_KEY = "portfolio-trex-high-score";

function getGroundY(height: number): number {
  return height - 10;
}

function getHorizonY(height: number): number {
  return height - 23;
}

function getCanvasPixelRatio(): number {
  return Math.max(2, window.devicePixelRatio || 1);
}

function createGameState(height = CANVAS_HEIGHT): GameState {
  return {
    phase: "idle",
    dinoY: getGroundY(height) - DINO_HEIGHT,
    velocityY: 0,
    isDucking: false,
    obstacles: [],
    spawnIn: 1.15,
    speed: 250,
    score: 0,
    elapsed: 0,
    horizonOffset: 0,
  };
}

function readHighScore(): number {
  try {
    const storedScore = Number(window.localStorage.getItem(HIGH_SCORE_KEY));
    return Number.isFinite(storedScore) && storedScore > 0
      ? Math.floor(storedScore)
      : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number): void {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // The game still works when storage is unavailable.
  }
}

function formatScore(score: number): string {
  return Math.max(0, Math.floor(score)).toString().padStart(5, "0");
}

function drawDino(
  context: CanvasRenderingContext2D,
  game: GameState,
  groundY: number,
  sprite: HTMLImageElement,
): void {
  const isGrounded = game.dinoY >= groundY - DINO_HEIGHT - 0.5;
  const legFrame = Math.floor(game.elapsed * 12) % 2;
  const ducking = game.isDucking && isGrounded;
  const frameOffset = game.phase === "gameOver"
    ? 220
    : ducking
      ? legFrame === 0 ? 264 : 323
      : !isGrounded || game.phase === "idle"
        ? 0
        : legFrame === 0 ? 88 : 132;
  const width = ducking ? DUCK_WIDTH : DINO_WIDTH;

  context.drawImage(
    sprite,
    1678 + frameOffset * 2,
    2,
    width * 2,
    DINO_HEIGHT * 2,
    DINO_X,
    Math.round(ducking ? groundY - DINO_HEIGHT : game.dinoY),
    width,
    DINO_HEIGHT,
  );
}

function drawObstacle(
  context: CanvasRenderingContext2D,
  obstacle: Obstacle,
  groundY: number,
  sprite: HTMLImageElement,
): void {
  const sourceX = obstacle.kind === "large" ? 652 : 446;

  context.drawImage(
    sprite,
    sourceX,
    2,
    obstacle.width * 2,
    obstacle.height * 2,
    Math.round(obstacle.x),
    groundY - obstacle.height,
    obstacle.width,
    obstacle.height,
  );
}

function drawHorizon(
  context: CanvasRenderingContext2D,
  sprite: HTMLImageElement,
  width: number,
  height: number,
  offset: number,
): void {
  const segmentWidth = 600;
  let x = -(offset % segmentWidth);

  while (x < width) {
    context.drawImage(
      sprite,
      2,
      104,
      segmentWidth * 2,
      24,
      Math.round(x),
      getHorizonY(height),
      segmentWidth,
      12,
    );
    x += segmentWidth;
  }
}

export function TrexRunner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const tickRef = useRef<(timestamp: number) => void>(() => undefined);
  const lastFrameRef = useRef(0);
  const dimensionsRef = useRef({ width: 720, height: CANVAS_HEIGHT });
  const gameRef = useRef<GameState>(createGameState());
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const backgroundColorRef = useRef("#0b0b17");
  const displayedScoreRef = useRef(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [spriteReady, setSpriteReady] = useState(false);
  const highScoreRef = useRef(readHighScore());

  const draw = useCallback(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const { width, height } = dimensionsRef.current;
    const game = gameRef.current;
    const groundY = getGroundY(height);
    const sprite = spriteRef.current;

    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const pixelRatio = getCanvasPixelRatio();
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.imageSmoothingEnabled = false;

    context.fillStyle = backgroundColorRef.current;
    context.fillRect(0, 0, width, height);
    context.filter = "invert(1)";

    if (sprite) {
      drawHorizon(context, sprite, width, height, game.horizonOffset);
      game.obstacles.forEach((obstacle) =>
        drawObstacle(context, obstacle, groundY, sprite),
      );
      drawDino(context, game, groundY, sprite);
    }

    context.fillStyle = "#535353";
    context.font = '700 13px "Courier New", Courier, monospace';
    context.textAlign = "right";
    context.textBaseline = "top";
    context.fillText(formatScore(game.score), width - 12, 12);

    if (highScoreRef.current > 0) {
      context.fillText(
        `HI ${formatScore(highScoreRef.current)}`,
        width - 90,
        12,
      );
    }

    context.filter = "none";
  }, []);

  const finishGame = useCallback(() => {
    const game = gameRef.current;
    const finalScore = Math.floor(game.score);
    game.phase = "gameOver";
    game.isDucking = false;
    setPhase("gameOver");

    if (finalScore > highScoreRef.current) {
      highScoreRef.current = finalScore;
      saveHighScore(finalScore);
    }
  }, []);

  const tick = useCallback(
    (timestamp: number) => {
      const game = gameRef.current;

      if (game.phase !== "running") {
        draw();
        return;
      }

      const deltaSeconds = Math.min(
        Math.max((timestamp - lastFrameRef.current) / 1000, 0),
        0.034,
      );
      lastFrameRef.current = timestamp;

      const { width, height } = dimensionsRef.current;
      const groundY = getGroundY(height);
      const groundedY = groundY - DINO_HEIGHT;

      game.elapsed += deltaSeconds;
      game.score += deltaSeconds * 10;
      game.speed = Math.min(
        Math.max(190, Math.min(285, width * 0.42)) + game.score * 0.16,
        390,
      );
      game.horizonOffset += game.speed * deltaSeconds;

      game.velocityY += GRAVITY * deltaSeconds;
      game.dinoY = Math.min(
        groundedY,
        game.dinoY + game.velocityY * deltaSeconds,
      );

      if (game.dinoY >= groundedY) {
        game.dinoY = groundedY;
        game.velocityY = 0;
      }

      game.spawnIn -= deltaSeconds;

      if (game.spawnIn <= 0) {
        const tallObstacle = Math.random() > 0.5;
        game.obstacles.push({
          x: width + 20,
          width: tallObstacle ? 25 : 17,
          height: tallObstacle ? 50 : 35,
          kind: tallObstacle ? "large" : "small",
        });
        game.spawnIn = Math.max(0.85, 1.45 - game.speed / 650) + Math.random() * 0.65;
      }

      game.obstacles.forEach((obstacle) => {
        obstacle.x -= game.speed * deltaSeconds;
      });
      game.obstacles = game.obstacles.filter(
        (obstacle) => obstacle.x + obstacle.width > -10,
      );

      const isGrounded = game.dinoY >= groundedY - 0.5;
      const dinoHeight = game.isDucking && isGrounded
        ? DUCK_HEIGHT
        : DINO_HEIGHT;
      const dinoWidth = game.isDucking && isGrounded
        ? DUCK_WIDTH
        : DINO_WIDTH;
      const dinoTop = game.isDucking && isGrounded
        ? groundY - DUCK_HEIGHT
        : game.dinoY;
      const collision = game.obstacles.some((obstacle) => {
        const horizontalHit =
          DINO_X + 7 < obstacle.x + obstacle.width - 2 &&
          DINO_X + dinoWidth - 5 > obstacle.x + 2;
        const verticalHit =
          dinoTop + 4 < groundY &&
          dinoTop + dinoHeight - 2 > groundY - obstacle.height + 3;
        return horizontalHit && verticalHit;
      });

      const nextScore = Math.floor(game.score);

      if (nextScore !== displayedScoreRef.current) {
        displayedScoreRef.current = nextScore;
        setScore(nextScore);
      }

      if (collision) {
        finishGame();
        draw();
        return;
      }

      draw();
      animationFrameRef.current = window.requestAnimationFrame((nextTimestamp) =>
        tickRef.current(nextTimestamp),
      );
    },
    [draw, finishGame],
  );

  const startOrJump = useCallback(() => {
    const canvas = canvasRef.current;
    const game = gameRef.current;

    if (!spriteRef.current) {
      return;
    }

    const groundY = getGroundY(dimensionsRef.current.height);
    const groundedY = groundY - DINO_HEIGHT;

    canvas?.focus({ preventScroll: true });

    if (game.phase !== "running") {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }

      const nextGame = createGameState(dimensionsRef.current.height);
      nextGame.phase = "running";
      nextGame.velocityY = JUMP_VELOCITY;
      gameRef.current = nextGame;
      displayedScoreRef.current = 0;
      setPhase("running");
      setScore(0);
      lastFrameRef.current = performance.now();
      draw();
      animationFrameRef.current = window.requestAnimationFrame((timestamp) =>
        tickRef.current(timestamp),
      );
      return;
    }

    if (game.dinoY >= groundedY - 0.5) {
      game.velocityY = JUMP_VELOCITY;
      game.isDucking = false;
    }
  }, [draw]);

  useEffect(() => {
    tickRef.current = tick;
  }, [tick]);

  useEffect(() => {
    const sprite = new Image();
    sprite.decoding = "async";
    sprite.src = TREX_SPRITE_2X;

    const handleLoad = () => {
      spriteRef.current = sprite;
      setSpriteReady(true);
      draw();
    };

    sprite.addEventListener("load", handleLoad);

    return () => sprite.removeEventListener("load", handleLoad);
  }, [draw]);

  useEffect(() => {
    const isInteractiveElement = (target: EventTarget | null) =>
      target instanceof HTMLElement &&
      (target.isContentEditable ||
        ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (isInteractiveElement(event.target) || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();

        if (!event.repeat) {
          startOrJump();
        }
        return;
      }

      if (event.code === "ArrowDown" && gameRef.current.phase === "running") {
        event.preventDefault();
        gameRef.current.isDucking = true;

        if (gameRef.current.velocityY < 0) {
          gameRef.current.velocityY = 260;
        }
      }
    };

    const handleKeyUp = (event: globalThis.KeyboardEvent) => {
      if (event.code === "ArrowDown") {
        gameRef.current.isDucking = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [startOrJump]);

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    startOrJump();
  };

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const resizeCanvas = () => {
      const rectangle = canvas.getBoundingClientRect();
      const pixelRatio = getCanvasPixelRatio();
      const previousGroundY = getGroundY(dimensionsRef.current.height);
      const nextWidth = Math.max(1, rectangle.width);
      const nextHeight = Math.max(1, rectangle.height);
      const nextGroundY = getGroundY(nextHeight);
      const game = gameRef.current;
      const wasGrounded =
        game.dinoY >= previousGroundY - DINO_HEIGHT - 0.5;

      dimensionsRef.current = { width: nextWidth, height: nextHeight };
      backgroundColorRef.current = getComputedStyle(document.body).backgroundColor;
      canvas.width = Math.round(nextWidth * pixelRatio);
      canvas.height = Math.round(nextHeight * pixelRatio);

      if (wasGrounded) {
        game.dinoY = nextGroundY - DINO_HEIGHT;
      } else {
        game.dinoY += nextGroundY - previousGroundY;
      }

      draw();
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);
    resizeCanvas();

    return () => resizeObserver.disconnect();
  }, [draw]);

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    },
    [],
  );

  const statusText = phase === "gameOver"
    ? "Game over"
    : phase === "running"
      ? "Läuft"
      : "Bereit";

  return (
    <section className={styles.runner} aria-labelledby="trex-runner-title">
      <header className={styles.header}>
        <h2 id="trex-runner-title">T-Rex Runner</h2>
        <span className={styles.status} aria-live="polite">
          {statusText}
        </span>
      </header>

      <div className={styles.gameShell}>
        <div className={styles.gameViewport}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            role="application"
            tabIndex={0}
            aria-label="T-Rex Runner. Mit Leertaste oder Pfeil nach oben springen und mit Pfeil nach unten ducken. Auf Touch-Geräten tippen."
            onPointerDown={handlePointerDown}
          />

          {phase !== "running" && (
            <div className={styles.overlay}>
              <p>{phase === "gameOver" ? `Punkte: ${score}` : "Bereit für eine Runde?"}</p>
              <button type="button" onClick={startOrJump} disabled={!spriteReady}>
                {phase === "gameOver" ? "noch einmal" : "Spiel starten"}
              </button>
            </div>
          )}
        </div>

      </div>

      <p className={styles.credit}>
        Inspiriert von{" "}
        <a
          href="https://github.com/wayou/t-rex-runner"
          target="_blank"
          rel="noreferrer"
        >
          wayou/t-rex-runner
        </a>
      </p>
    </section>
  );
}
