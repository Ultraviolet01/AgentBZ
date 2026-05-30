import { NextResponse } from "next/server";
import { verifyMessage } from "ethers";

export async function POST(req: Request) {
  try {
    const { address, message, signature } = await req.json();

    if (!address || !message || !signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Normalize line endings to prevent mismatches between Windows/Unix
    const normalizedMessage = message.replace(/\r\n/g, "\n");

    const recoveredAddress = verifyMessage(normalizedMessage, signature);
    const verified = recoveredAddress.toLowerCase() === address.toLowerCase();

    return NextResponse.json({ verified });
  } catch (error: any) {
    console.error("Signature verification error:", error);
    return NextResponse.json({ error: "Failed to verify signature", verified: false }, { status: 500 });
  }
}
