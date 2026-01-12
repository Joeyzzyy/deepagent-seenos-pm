import { NextResponse } from "next/server";
import { exec, spawn } from "child_process";
import { promisify } from "util";
import net from "net";

const execAsync = promisify(exec);

// Backend configuration
const BACKEND_PORT = 2024;
const BACKEND_DIR = process.env.BACKEND_DIR || "/Users/zhuhe/Cursor/deepagents";
const VENV_PATH = `${BACKEND_DIR}/.venv/bin`;

/**
 * Check if a port is in use
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(port, "127.0.0.1");
  });
}

/**
 * Wait for backend to start
 */
async function waitForBackend(maxWaitSeconds: number = 30): Promise<boolean> {
  for (let i = 0; i < maxWaitSeconds; i++) {
    if (await isPortInUse(BACKEND_PORT)) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return false;
}

/**
 * Kill process on port
 */
async function killProcessOnPort(port: number): Promise<void> {
  try {
    // Find and kill process using the port
    await execAsync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    // Also try to kill langgraph specifically
    await execAsync(`pkill -f "langgraph dev" 2>/dev/null || true`);
    // Wait for process to die
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch (error) {
    // Ignore errors - process might not exist
  }
}

export async function POST() {
  try {
    const wasRunning = await isPortInUse(BACKEND_PORT);
    
    if (wasRunning) {
      console.log("[RESTART] Backend is running, killing it first...");
      await killProcessOnPort(BACKEND_PORT);
    }
    
    // Start the backend
    console.log("[RESTART] Starting langgraph dev...");
    
    // Use the venv's langgraph
    const langgraphPath = `${VENV_PATH}/langgraph`;
    
    // Spawn the process detached so it survives the API request
    const child = spawn(langgraphPath, ["dev", "--port", String(BACKEND_PORT)], {
      cwd: BACKEND_DIR,
      detached: true,
      stdio: "ignore",
      env: {
        ...process.env,
        PATH: `${VENV_PATH}:${process.env.PATH}`,
      },
    });
    
    // Unref so the parent process can exit
    child.unref();
    
    // Wait for backend to start (max 15 seconds)
    const started = await waitForBackend(15);
    
    if (started) {
      const action = wasRunning ? "restarted" : "started";
      console.log(`[RESTART] Backend ${action} successfully`);
      return NextResponse.json({
        success: true,
        message: `Backend ${action} successfully.`,
        action,
      });
    } else {
      console.log("[RESTART] Backend failed to start within timeout");
      return NextResponse.json({
        success: false,
        message: "Backend failed to start. Check terminal for errors.",
        command: `cd ${BACKEND_DIR} && source .venv/bin/activate && langgraph dev --port ${BACKEND_PORT}`,
      });
    }
  } catch (error) {
    console.error("[RESTART] Error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Could not start backend. Please start manually.",
      command: `cd ${BACKEND_DIR} && source .venv/bin/activate && langgraph dev --port ${BACKEND_PORT}`,
    }, { status: 500 });
  }
}

export async function GET() {
  const isRunning = await isPortInUse(BACKEND_PORT);
  return NextResponse.json({
    running: isRunning,
    port: BACKEND_PORT,
    backendDir: BACKEND_DIR,
  });
}

