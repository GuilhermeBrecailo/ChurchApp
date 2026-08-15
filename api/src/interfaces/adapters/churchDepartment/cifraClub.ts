import { DomainError } from "../../../domain/value-objects/utils/DomainError";
import { normalizeSongKey } from "../../../application/Services/Department/SongKey";

export const CIFRA_CLUB_BASE_URL = "https://www.cifraclub.com.br";

export function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function stripHtml(value: string) {
  return decodeHtmlEntities(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, ""),
  );
}

export function normalizeTextBlock(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, "  ")
    .split("\n")
    .map((line) => line.replace(/\s+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function slugifyCifraClubPart(value: string) {
  return value
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isCifraClubUrl(value: string) {
  try {
    const url = new URL(value);
    return url.hostname === "www.cifraclub.com.br" || url.hostname === "cifraclub.com.br";
  } catch {
    return false;
  }
}

export function resolveCifraClubUrl(input: { url?: string; artist?: string; title?: string }) {
  const rawUrl = input.url?.trim();

  if (rawUrl) {
    if (!isCifraClubUrl(rawUrl)) {
      throw new DomainError("Informe um link valido do Cifra Club");
    }

    return rawUrl;
  }

  const artist = input.artist?.trim();
  const title = input.title?.trim();

  if (!artist || !title) {
    throw new DomainError("Informe artista e titulo ou cole o link do Cifra Club");
  }

  return `${CIFRA_CLUB_BASE_URL}/${slugifyCifraClubPart(artist)}/${slugifyCifraClubPart(title)}/`;
}

export function extractHtmlAttribute(html: string, pattern: RegExp) {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtmlEntities(match[1]).trim() : "";
}

export function extractCifraClubText(html: string) {
  const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
  if (preMatch?.[1]) {
    return normalizeTextBlock(stripHtml(preMatch[1]));
  }

  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
  if (articleMatch?.[1]) {
    return normalizeTextBlock(stripHtml(articleMatch[1]));
  }

  return "";
}

function looksLikeChordLine(line: string) {
  const cleaned = line.trim();
  if (!cleaned) return false;
  if (/^\[[^\]]+\]$/.test(cleaned)) return false;

  const chordToken = /\b[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d*(?:\/[A-G](?:#|b)?)?\b/;
  const onlyChordSymbols = /^[\sA-G#bmmajindugsadto/()0-9+\-.|:]+$/i;

  return chordToken.test(cleaned) && onlyChordSymbols.test(cleaned);
}

export function deriveLyricsFromChords(chords: string) {
  return normalizeTextBlock(
    chords
      .split("\n")
      .filter((line) => !looksLikeChordLine(line))
      .join("\n"),
  );
}

export function parseCifraClubTitle(html: string, fallbackTitle: string, fallbackArtist: string) {
  const pageTitle = stripHtml(extractHtmlAttribute(html, /<title[^>]*>([\s\S]*?)<\/title>/i));
  const cleanTitle = pageTitle
    .replace(/\s*-\s*Cifra Club\s*$/i, "")
    .replace(/\s*Cifra Club\s*$/i, "")
    .trim();

  if (!cleanTitle) {
    return { title: fallbackTitle, artist: fallbackArtist };
  }

  const parts = cleanTitle.split(" - ").map((part) => part.trim()).filter(Boolean);

  if (parts.length >= 2) {
    return {
      title: fallbackTitle || parts[0],
      artist: fallbackArtist || parts.slice(1).join(" - "),
    };
  }

  return { title: fallbackTitle || cleanTitle, artist: fallbackArtist };
}

export function extractCifraClubKey(html: string) {
  const patterns = [
    /id=["']cifra_tom["'][^>]*>\s*(?:<[^>]+>\s*)*([A-G][#b]?m?)\b/i,
    /class=["'][^"']*\btom\b[^"']*["'][^>]*>\s*(?:<[^>]+>\s*)*([A-G][#b]?m?)\b/i,
    /"tom"\s*:\s*"([A-G][#b]?m?)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const normalized = match?.[1] ? normalizeSongKey(match[1]) : null;

    if (normalized) return normalized;
  }

  return "";
}
