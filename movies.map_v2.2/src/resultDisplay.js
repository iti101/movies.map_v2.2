import { posterUrl, profileUrl } from './api/tmdb'

// normaliseert een search/discover resultaat voor de poster-grid
export function getResultDisplay(item) {
  // oude session-cache had alleen films zonder media_type
  const type = item.media_type || 'movie'

  if (type === 'movie') {
    return {
      title: item.title,
      info: item.release_date ? item.release_date.slice(0, 4) : '',
      image: posterUrl(item.poster_path),
      to: '/movie/' + item.id,
    }
  }

  if (type === 'tv') {
    return {
      title: item.name,
      info: item.first_air_date ? item.first_air_date.slice(0, 4) : '',
      image: posterUrl(item.poster_path),
      to: '/tv/' + item.id,
    }
  }

  // person (actor / actress / director, enzovoort)
  return {
    title: item.name,
    info: item.known_for_department || 'Person',
    image: profileUrl(item.profile_path),
    to: '/person/' + item.id,
  }
}
