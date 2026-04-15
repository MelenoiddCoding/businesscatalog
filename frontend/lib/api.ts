type ApiHealth = {
  ok: boolean;
  message: string;
};

export type CategoryItem = {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
};

export type Pagination = {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
};

export type BusinessListItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  zone: string | null;
  address: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  whatsapp_number: string | null;
  is_open_now: boolean | null;
  distance_m: number | null;
  categories: string[];
  cover_image_url: string | null;
  location: {
    latitude: number;
    longitude: number;
  } | null;
  is_favorited: boolean;
};

export type BusinessesResponse = {
  items: BusinessListItem[];
  pagination: Pagination;
};

type BusinessSearchParams = {
  q?: string;
  category?: string;
  zone?: string;
  near_lat?: number;
  near_lng?: number;
  radius_m?: number;
  sort?: "relevance" | "distance" | "rating";
  page?: number;
  page_size?: number;
};

class ApiRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function normalizeApiUrl(apiUrl?: string): string | null {
  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
}

async function requestJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `La API respondio HTTP ${response.status}.`;

    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // Best effort parse; keep fallback message when body is not JSON.
    }

    throw new ApiRequestError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function getApiHealth(apiUrl?: string): Promise<ApiHealth> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_API_URL is not configured."
    };
  }

  try {
    const response = await fetch(`${baseUrl}/health`, {
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

export async function getCategories(apiUrl?: string): Promise<CategoryItem[]> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const data = await requestJson<{ items?: CategoryItem[] }>(`${baseUrl}/categories`);
  return Array.isArray(data.items) ? data.items : [];
}

export async function getBusinesses(
  apiUrl: string | undefined,
  params: BusinessSearchParams = {}
): Promise<BusinessesResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const searchParams = new URLSearchParams();

  const append = (key: string, value: string | number | undefined) => {
    if (value === undefined || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  };

  append("q", params.q);
  append("category", params.category);
  append("zone", params.zone);
  append("near_lat", params.near_lat);
  append("near_lng", params.near_lng);
  append("radius_m", params.radius_m);
  append("sort", params.sort);
  append("page", params.page);
  append("page_size", params.page_size);

  const endpoint = searchParams.toString()
    ? `${baseUrl}/businesses?${searchParams.toString()}`
    : `${baseUrl}/businesses`;

  const data = await requestJson<Partial<BusinessesResponse>>(endpoint);

  return {
    items: Array.isArray(data.items) ? data.items : [],
    pagination: data.pagination ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      total_items: 0,
      total_pages: 0
    }
  };
}
