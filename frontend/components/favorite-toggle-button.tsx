"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Heart } from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ApiRequestError, addFavorite, removeFavorite } from "@/lib/api";
import { buildRedirectPath } from "@/lib/auth-redirect";

type FavoriteToggleButtonProps = {
  businessId: string;
  businessName: string;
  initialIsFavorited: boolean;
  compact?: boolean;
  onChange?: (nextValue: boolean) => void;
};

export function FavoriteToggleButton({
  businessId,
  businessName,
  initialIsFavorited,
  compact = false,
  onChange
}: FavoriteToggleButtonProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, isAuthenticated, runWithSession } = useAuth();

  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [initialIsFavorited, businessId]);

  const getRedirectPath = () => {
    if (typeof window !== "undefined") {
      return buildRedirectPath(
        window.location.pathname,
        window.location.search ? window.location.search.slice(1) : undefined
      );
    }

    return buildRedirectPath(pathname);
  };

  const handleToggle = async () => {
    if (isBusy) {
      return;
    }

    const redirectPath = getRedirectPath();

    if (!isReady || !isAuthenticated) {
      router.push(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);

    try {
      if (isFavorited) {
        await runWithSession((accessToken) => removeFavorite(apiUrl, businessId, accessToken));
        setIsFavorited(false);
        onChange?.(false);
      } else {
        await runWithSession((accessToken) => addFavorite(apiUrl, businessId, accessToken));
        setIsFavorited(true);
        onChange?.(true);
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        setIsFavorited(true);
        onChange?.(true);
      } else if (error instanceof ApiRequestError && error.status === 401) {
        const redirectPath = getRedirectPath();
        router.push(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("No pudimos actualizar favoritos en este momento.");
      }
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size={compact ? "sm" : "default"}
        variant={isFavorited ? "default" : "secondary"}
        onClick={handleToggle}
        disabled={isBusy}
        aria-label={`${isFavorited ? "Quitar" : "Guardar"} ${businessName} de favoritos`}
      >
        <Heart className={isFavorited ? "h-4 w-4 fill-current" : "h-4 w-4"} />
        {compact ? null : isFavorited ? "Guardado" : "Guardar"}
      </Button>
      {errorMessage ? <p className="text-xs text-rose-700">{errorMessage}</p> : null}
    </div>
  );
}
