// app/api/seek/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import net from "net";

export async function POST(req: NextRequest) {
  const { position } = await req.json();
  const socketPath = "/tmp/mpvsocket";

  if (typeof position !== "number" || isNaN(position)) {
    return NextResponse.json(
      { success: false, message: "Invalid 'position' value" },
      { status: 400 }
    );
  }

  if (!fs.existsSync(socketPath)) {
    return NextResponse.json(
      { success: false, message: "No active player socket found" },
      { status: 404 }
    );
  }

  return new Promise((resolve) => {
    const client = net.createConnection(socketPath, () => {
      const command = {
        command: ["set_property", "time-pos", position],
      };
      client.write(JSON.stringify(command) + "\n");
      client.end();
      resolve(
        NextResponse.json({
          success: true,
          message: `Moved to second ${position}`,
        })
      );
    });

    client.on("error", (err) => {
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
}
