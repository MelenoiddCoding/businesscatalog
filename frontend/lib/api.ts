type ApiHealth = {
  ok: boolean;
  message: string;
};

export async function getApiHealth(apiUrl?: string): Promise<ApiHealth> {
  if (!apiUrl) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_API_URL is not configured."
    };
  }

  try {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/health`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Health endpoint returned HTTP ${response.status}.`
      };
    }

    const data = (await response.json()) as {
      status?: string;
      app_name?: string;
      database_configured?: boolean;
    };

    return {
      ok: true,
      message: `${data.app_name ?? "Backend"} is online.`
    };
  } catch {
    return {
      ok: false,
      message: "Backend is not reachable yet."
    };
  }
}
