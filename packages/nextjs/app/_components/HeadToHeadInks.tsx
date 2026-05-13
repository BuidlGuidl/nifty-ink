"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@apollo/client";
import { HEAD_TO_HEAD_POOL_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { getMetadata } from "~~/utils/helpers";

const TOP_ARTISTS = 25;
const INKS_PER_ARTIST = 80;

function pickTwoDistinct<T>(items: T[]): [T, T] | null {
  if (items.length < 2) return null;
  const a = Math.floor(Math.random() * items.length);
  let b = Math.floor(Math.random() * items.length);
  while (b === a) {
    b = Math.floor(Math.random() * items.length);
  }
  return [items[a], items[b]];
}

type ArtistRow = {
  id: string;
  address: string;
  saleCount?: string;
  inks?: Pick<Ink, "id" | "inkNumber" | "jsonUrl" | "likeCount" | "artist">[];
};

type HeadToHeadInkRow = Pick<Ink, "id" | "inkNumber" | "jsonUrl" | "likeCount" | "artist"> & {
  /** Parent artist's total sale count (ranking uses the same subgraph field). */
  artistSaleCount: string;
};

function flattenInksFromArtists(artists: ArtistRow[]): HeadToHeadInkRow[] {
  const byId = new Map<string, HeadToHeadInkRow>();
  for (const artist of artists) {
    const asc = artist.saleCount ?? "0";
    for (const ink of artist.inks ?? []) {
      if (!byId.has(ink.id)) {
        byId.set(ink.id, { ...ink, artistSaleCount: asc });
      }
    }
  }
  return Array.from(byId.values());
}

type SideState = { ink: HeadToHeadInkRow; metadata: InkMetadata | null; error?: string };

const HeadToHeadInks = () => {
  const { data, loading, error } = useQuery(HEAD_TO_HEAD_POOL_QUERY, {
    variables: { artistFirst: TOP_ARTISTS, inksPerArtist: INKS_PER_ARTIST },
  });
  const [round, setRound] = useState(0);
  const [left, setLeft] = useState<SideState | null>(null);
  const [right, setRight] = useState<SideState | null>(null);
  const [pairLoading, setPairLoading] = useState(false);

  const inkPool = useMemo(() => flattenInksFromArtists((data?.artists as ArtistRow[]) ?? []), [data]);

  const advance = useCallback(() => {
    setRound(r => r + 1);
  }, []);

  useEffect(() => {
    if (inkPool.length < 2) {
      setLeft(null);
      setRight(null);
      return;
    }

    const picked = pickTwoDistinct(inkPool);
    if (!picked) {
      setLeft(null);
      setRight(null);
      return;
    }

    const [l, r] = picked;
    setLeft({ ink: l, metadata: null });
    setRight({ ink: r, metadata: null });
    setPairLoading(true);

    let cancelled = false;

    (async () => {
      try {
        const [lm, rm] = await Promise.all([getMetadata(l.jsonUrl), getMetadata(r.jsonUrl)]);
        if (cancelled) return;
        setLeft({ ink: l, metadata: lm });
        setRight({ ink: r, metadata: rm });
      } catch (e) {
        console.error(e);
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load metadata";
        setLeft({ ink: l, metadata: null, error: msg });
        setRight({ ink: r, metadata: null, error: msg });
      } finally {
        if (!cancelled) setPairLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [inkPool, round]);

  if (loading && !data?.artists) {
    return <Loader />;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-3">
        <p className="text-error">Could not load artists from the subgraph.</p>
        <p className="text-sm text-base-content/70">{error.message}</p>
      </div>
    );
  }

  if (!data?.artists?.length) {
    return <p className="text-center text-base-content/70">No artists returned for the head-to-head pool.</p>;
  }

  if (inkPool.length < 2) {
    return (
      <p className="text-center text-base-content/70 max-w-md mx-auto">
        Not enough inks in the pool (top {TOP_ARTISTS} artists, up to {INKS_PER_ARTIST} recent inks each). Try again
        later or raise the per-artist ink limit in code.
      </p>
    );
  }

  if (!left || !right) {
    return <Loader />;
  }

  const renderSide = (side: SideState) => {
    const img = side.metadata?.image;
    const name = side.metadata?.name ?? `Ink ${side.ink.inkNumber}`;
    const artistSales = Number(side.ink.artistSaleCount).toLocaleString();
    const shortArtist =
      side.ink.artist?.address && side.ink.artist.address.length > 12
        ? `${side.ink.artist.address.slice(0, 6)}…${side.ink.artist.address.slice(-4)}`
        : side.ink.artist?.address ?? "";

    return (
      <div className="flex flex-col items-center border-2 rounded-xl p-4 md:p-6 bg-base-200/50 border-base-300">
        <Link href={`/ink/${side.ink.id}`} className="block relative w-full max-w-[280px] aspect-square mb-4">
          {img && !side.error ? (
            <Image
              src={img}
              alt={name}
              fill
              className="object-contain rounded-lg border border-base-300 bg-base-100"
              sizes="(max-width: 768px) 100vw, 280px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center rounded-lg border border-dashed border-base-300 bg-base-100 text-sm text-base-content/60">
              {pairLoading ? "Loading…" : side.error ?? "No preview"}
            </div>
          )}
        </Link>
        <h2 className="text-lg font-semibold text-center mb-1 line-clamp-2">{name}</h2>
        <p className="text-xs text-base-content/60 mb-1 text-center">
          Artist {shortArtist} · {artistSales} sales (all inks)
        </p>
        <p className="text-xs text-base-content/50 mb-4 text-center">
          {Number(side.ink.likeCount ?? 0).toLocaleString()} likes on this ink
        </p>
        <button
          type="button"
          className="btn btn-primary w-full max-w-xs"
          disabled={pairLoading}
          onClick={() => advance()}
        >
          This one wins
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-base-content/80 max-w-lg mx-auto">
        Each matchup picks two random inks from the latest work of the top {TOP_ARTISTS} artists by on-chain sale count
        (up to {INKS_PER_ARTIST} most recent inks per artist). Pick the piece you prefer; we rotate to a new random
        pair.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-4 md:gap-6">
        {renderSide(left)}
        {renderSide(right)}
      </div>
      <div className="flex justify-center">
        <button type="button" className="btn btn-ghost btn-sm" disabled={pairLoading} onClick={() => advance()}>
          Next random pair
        </button>
      </div>
    </div>
  );
};

export default HeadToHeadInks;
