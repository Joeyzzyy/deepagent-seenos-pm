import { NextRequest, NextResponse } from "next/server";

/**
 * API Proxy for OpenAI-compatible /models endpoint
 * This bypasses CORS restrictions by making requests from the server side
 */
export async function POST(request: NextRequest) {
  try {
    const { baseUrl, apiKey } = await request.json();

    if (!baseUrl || !apiKey) {
      return NextResponse.json(
        { error: "Base URL and API Key are required" },
        { status: 400 }
      );
    }

    // Normalize the base URL
    let normalizedUrl = baseUrl.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    if (normalizedUrl.endsWith("/")) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    // Make the request to the external API
    const response = await fetch(`${normalizedUrl}/models`, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `API error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Extract model IDs - compatible with OpenAI format
    const models = data.data
      ?.map((m: { id: string }) => m.id)
      .sort() || [];

    return NextResponse.json({ valid: true, models });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Proxy request failed" },
      { status: 500 }
    );
  }
}

