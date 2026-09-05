/**
 * services/googleDriveMovies.ts
 * Catálogo sincronizado automáticamente de películas alojadas en Google Drive
 * Generado con metadatos en español de TMDB, trailers oficiales y posters Full HD.
 */

export interface DriveMovie {
  id: string;
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  releaseDate: string;
  year: number;
  posterUrl: string | null;
  backdropUrl: string | null;
  genres: { id: number; name: string }[];
  voteAverage: string;
  runtime: number;
  youtubeTrailerId: string | null;
  quality: string;
  driveFileId: string;
  driveFileName: string;
}

export const DRIVE_MOVIES_FOLDER_ID = '1q_Jh0Ijw425S-8jcuJ7ILb6dmcRLcj9_';
export const DRIVE_MOVIES_FOLDER_URL = 'https://drive.google.com/drive/folders/1q_Jh0Ijw425S-8jcuJ7ILb6dmcRLcj9_';

export const DRIVE_MOVIES: DriveMovie[] = [
  {
    "id": "movie-931285",
    "tmdbId": 931285,
    "title": "Mortal Kombat II",
    "originalTitle": "Mortal Kombat II",
    "overview": "Los campeones favoritos de los fans —ahora acompañados por el mismísimo Johnny Cage— se enfrentan entre sí en la batalla definitiva, sangrienta y sin reglas, para derrotar el oscuro dominio de Shao Kahn, que amenaza con destruir el Reino de la Tierra y a sus defensores.",
    "releaseDate": "2026-05-06",
    "year": 2026,
    "posterUrl": "https://image.tmdb.org/t/p/w500/niXSl8jLAZu9fL1ywfNyLGCRXLh.jpg",
    "backdropUrl": "https://image.tmdb.org/t/p/w1280/4EAAwpylq313qrDqpCxulUrXBNF.jpg",
    "genres": [
      {
        "id": 28,
        "name": "Acción"
      },
      {
        "id": 14,
        "name": "Fantasía"
      },
      {
        "id": 12,
        "name": "Aventura"
      }
    ],
    "voteAverage": "7.8",
    "runtime": 110,
    "youtubeTrailerId": "_5RFjYeWSls",
    "quality": "1080p Dual Latino / Inglés",
    "driveFileId": "1Sad8bQZKBO0dMMpmw9yUQgwSMd4GjAR6",
    "driveFileName": "Mortal.Kombat.Ii.2026.1080P-Dual-Lat.mkv"
  }
];

export function getMovieById(id: string): DriveMovie | undefined {
  return DRIVE_MOVIES.find((m) => m.id === id || String(m.tmdbId) === id || m.driveFileId === id);
}
