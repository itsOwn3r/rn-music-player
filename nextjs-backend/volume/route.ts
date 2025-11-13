import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import net from "net";

export async function POST(req: NextRequest) {
  try {
    const { volume } = await req.json();
    const socketPath = "/tmp/mpvsocket";

    if (typeof volume !== "number" || volume < 0 || volume > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid volume value" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(socketPath)) {
      console.log("mpv is not running" );
      return NextResponse.json(
        { success: false, message: "mpv is not running" },
        { status: 404 }
      );
    }

    // Connect to the socket
    return await new Promise<NextResponse>((resolve) => {
      const client = net.createConnection(socketPath);

      // Timeout if mpv doesn’t respond
      const timeout = setTimeout(() => {
        client.destroy();
        resolve(
          NextResponse.json(
            { success: false, message: "Timeout connecting to mpv" },
            { status: 504 }
          )
        );
      }, 2000);

      client.on("connect", () => {
        clearTimeout(timeout);
        const command = { command: ["set_property", "volume", volume] };
        client.write(JSON.stringify(command) + "\n");
        client.end();
        resolve(NextResponse.json({ success: true, volume }));
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
