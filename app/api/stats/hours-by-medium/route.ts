import { fetchProtected } from "@/lib/api/protected";

type TimeSpentPayload = {
  totalMinutes?: number;
  totalHours?: number;
  animeMinutes?: number;
  seriesMinutes?: number;
  movieMinutes?: number;
  gamesCompleted?: number;
  mangaChaptersRead?: number;
};

type OverviewPayload = {
  game?: { total?: number; completed?: number };
  series?: { total?: number; completed?: number };
  movie?: { total?: number; completed?: number };
  anime?: { total?: number; completed?: number };
  manga?: { total?: number; completed?: number };
};

export async function GET() {
  const upstream = await fetchProtected("/me/stats/hours-by-medium");
  if (upstream.ok) {
    return upstream;
  }

  // Fallback if backend does not have /me/stats/hours-by-medium endpoint:
  // compute breakdown from /me/stats/time-spent and /me/stats/overview
  const [timeSpentRes, overviewRes] = await Promise.all([
    fetchProtected("/me/stats/time-spent"),
    fetchProtected("/me/stats/overview"),
  ]);

  if (!timeSpentRes.ok && !overviewRes.ok) {
    return upstream;
  }

  const timeSpent = (timeSpentRes.ok
    ? await timeSpentRes.json().catch(() => null)
    : null) as TimeSpentPayload | null;

  const overview = (overviewRes.ok
    ? await overviewRes.json().catch(() => null)
    : null) as OverviewPayload | null;

  const animeMinutes = Number(timeSpent?.animeMinutes ?? 0);
  const seriesMinutes = Number(timeSpent?.seriesMinutes ?? 0);
  const movieMinutes = Number(timeSpent?.movieMinutes ?? 0);
  const mangaChapters = Number(timeSpent?.mangaChaptersRead ?? 0);
  const gamesCompleted = Number(timeSpent?.gamesCompleted ?? 0);
  const totalHours = Number(timeSpent?.totalHours ?? 0);

  const animeHours = Math.round((animeMinutes / 60) * 10) / 10;
  const seriesHours = Math.round((seriesMinutes / 60) * 10) / 10;
  const filmHours = Math.round((movieMinutes / 60) * 10) / 10;
  const mangaHours = Math.round(((mangaChapters * 4) / 60) * 10) / 10;

  const accounted = animeHours + seriesHours + filmHours + mangaHours;
  let gameHours = Math.max(0, Math.round((totalHours - accounted) * 10) / 10);

  // If game hours is 0 but user has games and totalHours > 0 or games completed
  if (gameHours === 0 && (gamesCompleted > 0 || (totalHours > 0 && accounted === 0))) {
    const gameCount = (overview?.game?.total ?? 0) + (overview?.game?.completed ?? 0);
    const seriesCount = (overview?.series?.total ?? 0) + (overview?.series?.completed ?? 0);
    const movieCount = (overview?.movie?.total ?? 0) + (overview?.movie?.completed ?? 0);
    const animeCount = (overview?.anime?.total ?? 0) + (overview?.anime?.completed ?? 0);
    const mangaCount = (overview?.manga?.total ?? 0) + (overview?.manga?.completed ?? 0);

    const counts = [
      { key: "game", count: gameCount },
      { key: "series", count: seriesCount },
      { key: "film", count: movieCount },
      { key: "anime", count: animeCount },
      { key: "manga", count: mangaCount },
    ].sort((a, b) => b.count - a.count);

    if (counts[0]?.count > 0 && totalHours > 0) {
      if (counts[0].key === "game") gameHours = totalHours;
    }
  }

  return Response.json({
    game: gameHours,
    series: seriesHours,
    film: filmHours,
    anime: animeHours,
    manga: mangaHours,
  });
}
