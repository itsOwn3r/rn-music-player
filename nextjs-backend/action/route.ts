import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import net from "net";

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json(); // expect "play" or "pause"
    const socketPath = "/tmp/mpvsocket";

    if (!action || (action !== "play" && action !== "pause")) {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'play' or 'pause'." },
        { status: 400 }
      );
    }

    if (!fs.existsSync(socketPath)) {
      console.log("mpv is not running");
      return NextResponse.json(
        { success: false, message: "mpv is not running" },
        { status: 404 }
      );
    }

    const pauseState = action === "pause"; // true for pause, false for play

    return await new Promise<NextResponse>((resolve) => {
      const client = net.createConnection(socketPath);

      const timeout = setTimeout(() => {
        client.destroy();
        resolve(
          NextResponse.json(
            { success: false, message: "Timeout connecting to mpv" },
            { status: 504 }
          )
        );
      }, 5000);

      client.on("connect", () => {
        clearTimeout(timeout);
        const command = { command: ["set_property", "pause", pauseState] };
        client.write(JSON.stringify(command) + "\n");
        client.end();
        resolve(NextResponse.json({ success: true, action }));
      });

      client.on("error", (err) => {
        clearTimeout(timeout);
        resolve(
          NextResponse.json(
            {
              success: false,
              message: "Failed to connect to mpv",
              error: err.message,
            },
            { status: 500 }
          )
        );
      });
    });
  } catch (err) {
    console.log((err as Error).message);
    return NextResponse.json(
      {
        success: false,
        message: "Unexpected error",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
