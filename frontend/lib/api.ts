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

export type BusinessDetailCategory = {
  slug: string;
  name: string;
};

export type BusinessImage = {
  url: string;
  kind: string;
  position: number;
};

export type BusinessProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  currency: string | null;
  is_featured: boolean;
};

export type BusinessDetail = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  zone: string | null;
  rating_avg: number | null;
  rating_count: number | null;
  is_verified: boolean;
  categories: BusinessDetailCategory[];
  location: {
    latitude: number;
    longitude: number;
  } | null;
  opening_hours: Record<string, Array<{ open: string; close: string }>>;
  images: BusinessImage[];
  products: BusinessProduct[];
  is_favorited: boolean;
};

export type BusinessReview = {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  visited_at: string | null;
  created_at: string;
  author: {
    name: string | null;
    avatar_url: string | null;
  };
};

export type BusinessReviewsResponse = {
  items: BusinessReview[];
  summary: {
    rating_avg: number;
    rating_count: number;
  };
  pagination: Pagination;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
};

export type AuthSessionResponse = {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
};

export type RefreshSessionResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  phone?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
};

export type FavoriteItem = {
  business_id: string;
  slug: string;
  name: string;
  zone: string | null;
  cover_image_url: string | null;
  created_at: string;
};

export type FavoritesResponse = {
  items: FavoriteItem[];
};

type RequestMethod = "GET" | "POST" | "DELETE";

type RequestOptions = {
  method?: RequestMethod;
  body?: unknown;
  accessToken?: string;
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

type ReviewsQueryParams = {
  page?: number;
  page_size?: number;
};

export class ApiRequestError extends Error {
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

async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method: options.method ?? "GET",
    cache: "no-store",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    let message = `La API respondio HTTP ${response.status}.`;

    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // Keep fallback message when body is not JSON.
    }

    throw new ApiRequestError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function requestNoContent(url: string, options: RequestOptions = {}): Promise<void> {
  await requestJson<void>(url, options);
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

export async function getCategories(
  apiUrl?: string,
  accessToken?: string
): Promise<CategoryItem[]> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const data = await requestJson<{ items?: CategoryItem[] }>(`${baseUrl}/categories`, {
    accessToken
  });
  return Array.isArray(data.items) ? data.items : [];
}

export async function getBusinesses(
  apiUrl: string | undefined,
  params: BusinessSearchParams = {},
  accessToken?: string
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

  const data = await requestJson<Partial<BusinessesResponse>>(endpoint, {
    accessToken
  });

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

export async function getBusinessDetail(
  apiUrl: string | undefined,
  slug: string,
  accessToken?: string
): Promise<BusinessDetail> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestJson<BusinessDetail>(`${baseUrl}/businesses/${encodeURIComponent(slug)}`, {
    accessToken
  });
}

export async function getBusinessReviews(
  apiUrl: string | undefined,
  slug: string,
  params: ReviewsQueryParams = {},
  accessToken?: string
): Promise<BusinessReviewsResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }

  if (params.page_size !== undefined) {
    searchParams.set("page_size", String(params.page_size));
  }

  const endpoint = searchParams.toString()
    ? `${baseUrl}/businesses/${encodeURIComponent(slug)}/reviews?${searchParams.toString()}`
    : `${baseUrl}/businesses/${encodeURIComponent(slug)}/reviews`;

  const data = await requestJson<Partial<BusinessReviewsResponse>>(endpoint, {
    accessToken
  });

  return {
    items: Array.isArray(data.items) ? data.items : [],
    summary: data.summary ?? {
      rating_avg: 0,
      rating_count: 0
    },
    pagination: data.pagination ?? {
      page: params.page ?? 1,
      page_size: params.page_size ?? 20,
      total_items: 0,
      total_pages: 0
    }
  };
}

export async function registerUser(
  apiUrl: string | undefined,
  payload: RegisterPayload
): Promise<AuthSessionResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestJson<AuthSessionResponse>(`${baseUrl}/auth/register`, {
    method: "POST",
    body: payload
  });
}

export async function loginUser(
  apiUrl: string | undefined,
  payload: LoginPayload
): Promise<AuthSessionResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestJson<AuthSessionResponse>(`${baseUrl}/auth/login`, {
    method: "POST",
    body: payload
  });
}

export async function refreshSession(
  apiUrl: string | undefined,
  refreshToken: string
): Promise<RefreshSessionResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestJson<RefreshSessionResponse>(`${baseUrl}/auth/refresh`, {
    method: "POST",
    body: { refresh_token: refreshToken }
  });
}

export async function logoutUser(apiUrl: string | undefined, accessToken: string): Promise<void> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestNoContent(`${baseUrl}/auth/logout`, {
    method: "POST",
    accessToken
  });
}

export async function getMyProfile(apiUrl: string | undefined, accessToken: string): Promise<UserProfile> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestJson<UserProfile>(`${baseUrl}/me`, {
    accessToken
  });
}

export async function getFavorites(apiUrl: string | undefined, accessToken: string): Promise<FavoritesResponse> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const data = await requestJson<Partial<FavoritesResponse>>(`${baseUrl}/favorites`, {
    accessToken
  });

  return {
    items: Array.isArray(data.items) ? data.items : []
  };
}

export async function addFavorite(
  apiUrl: string | undefined,
  businessId: string,
  accessToken: string
): Promise<{ business_id: string; created_at: string }> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestJson<{ business_id: string; created_at: string }>(
    `${baseUrl}/favorites/${encodeURIComponent(businessId)}`,
    {
      method: "POST",
      accessToken
    }
  );
}

export async function removeFavorite(
  apiUrl: string | undefined,
  businessId: string,
  accessToken: string
): Promise<void> {
  const baseUrl = normalizeApiUrl(apiUrl);
  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  return requestNoContent(`${baseUrl}/favorites/${encodeURIComponent(businessId)}`, {
    method: "DELETE",
    accessToken
  });
}
