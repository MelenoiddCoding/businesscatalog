"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { FavoriteToggleButton } from "@/components/favorite-toggle-button";
import { getFavorites } from "@/lib/api";

type BusinessDetailFavoriteButtonProps = {
  businessId: string;
  businessName: string;
  initialIsFavorited: boolean;
};

export function BusinessDetailFavoriteButton({
  businessId,
  businessName,
  initialIsFavorited
}: BusinessDetailFavoriteButtonProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const { isReady, isAuthenticated, runWithSession } = useAuth();
  const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

  useEffect(() => {
    setIsFavorited(initialIsFavorited);
  }, [businessId, initialIsFavorited]);

  useEffect(() => {
    let cancelled = false;

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      setIsFavorited(initialIsFavorited);
      return;
    }

    runWithSession((accessToken) => getFavorites(apiUrl, accessToken))
      .then((response) => {
        if (cancelled) {
          return;
        }

        const exists = response.items.some((item) => item.business_id === businessId);
        setIsFavorited(exists);
      })
      .catch(() => {
        if (!cancelled) {
          setIsFavorited(initialIsFavorited);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl, businessId, initialIsFavorited, isAuthenticated, isReady, runWithSession]);

  return (
    <FavoriteToggleButton
      businessId={businessId}
      businessName={businessName}
      initialIsFavorited={isFavorited}
      onChange={setIsFavorited}
    />
  );
}
