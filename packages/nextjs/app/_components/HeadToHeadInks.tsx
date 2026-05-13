"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@apollo/client";
import { HEAD_TO_HEAD_INKS_BY_IDS_QUERY, HEAD_TO_HEAD_POOL_QUERY } from "~~/apollo/queries";
import Loader from "~~/components/Loader";
import { getMetadata } from "~~/utils/helpers";
import { notification } from "~~/utils/scaffold-eth";

const TOP_ARTISTS = 25;
const INKS_PER_ARTIST = 80;
const PARAM_A = "a";
const PARAM_B = "b";

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

type SubgraphInkById = {
  id: string;
  inkNumber: string | number;
  jsonUrl: string;
  likeCount?: string;
  artist: { id: string; address: string; saleCount?: string };
};

function mapSubgraphInkToRow(ink: SubgraphInkById): HeadToHeadInkRow {
  const n = ink.inkNumber;
  return {
    id: ink.id,
    inkNumber: typeof n === "string" ? Number(n) : n,
    jsonUrl: ink.jsonUrl,
    likeCount: ink.likeCount as unknown as number | undefined,
    artist: ink.artist,
    artistSaleCount: ink.artist.saleCount ?? "0",
  };
}

type SideState = { ink: HeadToHeadInkRow; metadata: InkMetadata | null; error?: string };

const HeadToHeadInks = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const idA = searchParams.get(PARAM_A)?.trim() ?? "";
  const idB = searchParams.get(PARAM_B)?.trim() ?? "";
  const urlPairValid = Boolean(idA && idB && idA !== idB);

  const {
    data: poolData,
    loading: poolLoading,
    error: poolError,
  } = useQuery(HEAD_TO_HEAD_POOL_QUERY, {
    variables: { artistFirst: TOP_ARTISTS, inksPerArtist: INKS_PER_ARTIST },
  });

  const inkPool = useMemo(() => flattenInksFromArtists((poolData?.artists as ArtistRow[]) ?? []), [poolData]);

  const {
    data: pairGraphData,
    loading: pairGraphLoading,
    error: pairGraphError,
  } = useQuery(HEAD_TO_HEAD_INKS_BY_IDS_QUERY, {
    variables: { ids: [idA, idB] },
    skip: !urlPairValid,
  });

  const [left, setLeft] = useState<SideState | null>(null);
  const [right, setRight] = useState<SideState | null>(null);
  const [pairInvalid, setPairInvalid] = useState(false);
  const [pairLoading, setPairLoading] = useState(false);

  const replacePairInUrl = useCallback(
    (nextA: string, nextB: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(PARAM_A, nextA);
      params.set(PARAM_B, nextB);
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearPairParams = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(PARAM_A);
    params.delete(PARAM_B);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const seededRef = useRef(false);
  useEffect(() => {
    if (urlPairValid) {
      seededRef.current = false;
      return;
    }
    if (poolLoading || inkPool.length < 2) return;
    if (seededRef.current) return;
    seededRef.current = true;
    const picked = pickTwoDistinct(inkPool);
    if (!picked) return;
    replacePairInUrl(picked[0].id, picked[1].id);
  }, [poolLoading, inkPool, urlPairValid, replacePairInUrl]);

  useEffect(() => {
    if (!urlPairValid) {
      setLeft(null);
      setRight(null);
      setPairInvalid(false);
      return;
    }

    if (pairGraphLoading) {
      setPairInvalid(false);
      return;
    }

    if (pairGraphError) {
      setPairInvalid(true);
      setLeft(null);
      setRight(null);
      return;
    }

    const inks = pairGraphData?.inks as SubgraphInkById[] | undefined;
    if (!inks || inks.length < 2) {
      setPairInvalid(true);
      setLeft(null);
      setRight(null);
      return;
    }

    const rowL = inks.find(i => i.id === idA);
    const rowR = inks.find(i => i.id === idB);
    if (!rowL || !rowR) {
      setPairInvalid(true);
      setLeft(null);
      setRight(null);
      return;
    }

    setPairInvalid(false);
    const l = mapSubgraphInkToRow(rowL);
    const r = mapSubgraphInkToRow(rowR);
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
  }, [urlPairValid, idA, idB, pairGraphLoading, pairGraphError, pairGraphData]);

  const advance = useCallback(() => {
    if (inkPool.length < 2) return;
    const picked = pickTwoDistinct(inkPool);
    if (!picked) return;
    replacePairInUrl(picked[0].id, picked[1].id);
  }, [inkPool, replacePairInUrl]);

  const copyMatchupLink = useCallback(() => {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    void navigator.clipboard.writeText(url).then(
      () => {
        notification.success("Link copied to clipboard.", { duration: 2500 });
      },
      () => {
        notification.error("Could not copy link.");
      },
    );
  }, []);

  if (poolLoading && !poolData?.artists) {
    return <Loader />;
  }

  if (poolError) {
    return (
      <div className="max-w-xl mx-auto text-center space-y-3">
        <p className="text-error">Could not load artists from the subgraph.</p>
        <p className="text-sm text-base-content/70">{poolError.message}</p>
      </div>
    );
  }

  if (!poolData?.artists?.length) {
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

  const seedingUrl = !urlPairValid && inkPool.length >= 2;

  if (seedingUrl || (urlPairValid && pairGraphLoading)) {
    return <Loader />;
  }

  if (urlPairValid && pairInvalid) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4">
        <p className="text-error">This matchup link is invalid or those inks are not in the indexer.</p>
        <button type="button" className="btn btn-primary" onClick={clearPairParams}>
          Show a random matchup
        </button>
      </div>
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
      <p className="text-center text-base-content/80 max-w-lg mx-auto text-sm leading-relaxed">
        Pick the piece you&apos;d rather keep. Copy the link so a friend gets the same bout—or tap next for two new
        challengers from top artists.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <button type="button" className="btn btn-outline btn-sm" onClick={copyMatchupLink}>
          Copy matchup link
        </button>
        <button type="button" className="btn btn-ghost btn-sm" disabled={pairLoading} onClick={() => advance()}>
          Next random pair
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-4 md:gap-6">
        {renderSide(left)}
        {renderSide(right)}
      </div>
    </div>
  );
};

export default HeadToHeadInks;
