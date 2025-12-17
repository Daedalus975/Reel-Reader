/**
 * Unified Metadata Search Service
 *
 * Provides per-type search with provider prioritization and lightweight caching.
 * - Movies/TV: OMDb primary; TMDB fallback (mapped to OMDb-like shape)
 * - Books: OpenLibrary
 * - Music: iTunes
 * - JAV: Aggregated via searchJAVAll
 * - Doujinshi: DLsite
 */

import { searchOMDb, type OMDbResult } from './omdb'
import { searchTMDB, isMovie, isShow, getPosterUrl as getTMDBPoster } from './tmdb'
import { searchBooks, type OpenLibraryDoc } from './books'
import { searchGoogleBooks } from './googleBooks'
import { searchMusic, type ITunesResult } from './music'
import { searchMusicBrainz } from './musicbrainz'
import { searchLastFm } from './lastfm'
import { searchJAVAll, type JAVResult } from './javmeta'
import { searchDoujinshi, type DlsiteWork } from './dlsite'
import { getCached, setCached } from './cache'

import type { MediaType } from '../types'

type MovieTVResult = OMDbResult
type BookResult = OpenLibraryDoc
type MusicResult = ITunesResult
type JAVAggResult = JAVResult
type DoujinResult = DlsiteWork

export type SearchResultByType<T extends MediaType> =
  T extends 'movie' | 'tv' ? MovieTVResult[]
  : T extends 'book' ? BookResult[]
  : T extends 'music' ? MusicResult[]
  : T extends 'jav' ? JAVAggResult[]
  : T extends 'doujinshi' ? DoujinResult[]
  : any[]

// Simple in-memory cache per (type, query)
const cache = new Map<string, any[]>()

function cacheKey(type: MediaType, query: string) {
  return `${type}::${query.trim().toLowerCase()}`
}

function mapTMDBMovieToOMDbLike(result: any): OMDbResult {
  // result is TMDB movie
  const year = (result?.release_date || '').split('-')[0]
  return {
    imdbID: `tmdb_movie_${result.id}`,
    Title: result.title || 'Unknown',
    Year: year || '',
    Type: 'movie',
    Poster: getTMDBPoster(result.poster_path) || 'N/A',
    Plot: result.overview || 'N/A',
    imdbRating: (result.vote_average ? String(result.vote_average) : 'N/A') as any,
    Runtime: 'N/A',
    Director: 'N/A',
    Genre: (result.genres || []).map((g: any) => g.name).join(', '),
    Actors: 'N/A',
  }
}

function mapTMDBShowToOMDbLike(result: any): OMDbResult {
  const year = (result?.first_air_date || '').split('-')[0]
  return {
    imdbID: `tmdb_tv_${result.id}`,
    Title: result.name || 'Unknown',
    Year: year || '',
    Type: 'series',
    Poster: getTMDBPoster(result.poster_path) || 'N/A',
    Plot: result.overview || 'N/A',
    imdbRating: (result.vote_average ? String(result.vote_average) : 'N/A') as any,
    Runtime: 'N/A',
    Director: 'N/A',
    Genre: (result.genres || []).map((g: any) => g.name).join(', '),
    Actors: 'N/A',
  }
}

async function searchMoviesFallback(query: string): Promise<OMDbResult[]> {
  // OMDb primary
  const omdb = await searchOMDb(query, 'movie')
  if (omdb && omdb.length) return omdb

  // TMDB fallback mapped to OMDb-like shape
  const tmdb = await searchTMDB(query, 'movie')
  return (tmdb || [])
    .filter(isMovie)
    .map((r: any) => mapTMDBMovieToOMDbLike(r))
}

async function searchTVFallback(query: string): Promise<OMDbResult[]> {
  const omdb = await searchOMDb(query, 'series')
  if (omdb && omdb.length) return omdb

  const tmdb = await searchTMDB(query, 'tv')
  return (tmdb || [])
    .filter(isShow)
    .map((r: any) => mapTMDBShowToOMDbLike(r))
}

export async function searchByType<T extends MediaType>(type: T, query: string): Promise<SearchResultByType<T>> {
  const key = cacheKey(type, query)
  if (cache.has(key)) return cache.get(key) as SearchResultByType<T>
  const persisted = await getCached(type, query)
  if (persisted) {
    cache.set(key, persisted)
    return persisted as SearchResultByType<T>
  }

  let results: any[] = []

  switch (type) {
    case 'movie':
      results = await searchMoviesFallback(query)
      break
    case 'tv':
      results = await searchTVFallback(query)
      break
    case 'book': {
      const ol = await searchBooks(query)
      results = ol && ol.length ? ol : await searchGoogleBooks(query)
      break
    }
    case 'music': {
      // Last.fm primary (best metadata & popularity), iTunes fallback, MusicBrainz last resort
      const lastfm = await searchLastFm(query)
      if (lastfm && lastfm.length) {
        results = lastfm
      } else {
        const it = await searchMusic(query)
        results = it && it.length ? it : await searchMusicBrainz(query)
      }
      break
    }
    case 'jav':
      results = await searchJAVAll(query)
      break
    case 'doujinshi':
      results = await searchDoujinshi(query)
      break
    default:
      results = []
  }

  cache.set(key, results)
  await setCached(type, query, results)
  return results as SearchResultByType<T>
}
