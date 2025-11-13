import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { execSync, spawn } from "child_process";

let currentMPV: ReturnType<typeof spawn> | null = null;

export async function POST(req: NextRequest) {
  try {

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const volume = formData.get("volume");

  if (!file) {
    return NextResponse.json(
      { success: false, message: "No file uploaded" },
      { status: 400 }
    );
  }
  // Create temp folder if it doesn't exist
  const tempDir = path.join(process.cwd(), "public/mp3/temp");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Convert File → Buffer → Save
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const filePath = path.join(tempDir, file.name);
  fs.writeFileSync(filePath, buffer);

  // Define socket path (for IPC control)
  const socketPath = "/tmp/mpvsocket";

  try {
  // Kill any running mpv processes
  execSync("pkill -f mpv", { stdio: "ignore" });
  console.log("Killed any previous mpv instances");
} catch (e) {
  console.warn("No existing mpv processes to kill");
}

  // Kill old mpv if it exists
  if (currentMPV) {
    currentMPV.kill(); // stops previous mpv
    currentMPV = null;
  }

  // Kill old mpv instance if already running
  if (fs.existsSync(socketPath)) {
    try {
      fs.unlinkSync(socketPath);
    } catch (e) {
      console.error("Could not remove old mpv socket:", e);
    }
  }

  // Start mpv with IPC enabled
  // Spawn new mpv process
  currentMPV = spawn(
    "mpv",
    [
      "--no-video",
      `--input-ipc-server=${socketPath}`,
      `--volume=${Number(volume)}`,
      "--force-window=no",
      "--really-quiet",
      filePath,
    ],
    { detached: true, stdio: "ignore" }
  );
  currentMPV.unref();
  return NextResponse.json({
    success: true,
    message: "File uploaded and playing",
    file: file.name,
  });
      
  } catch (error) {
    console.log((error as Error).message);
   return NextResponse.json({ success: false, message: (error as Error).message }) 
  }
}
