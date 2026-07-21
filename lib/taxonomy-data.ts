export const defaultGenres = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Horror',
  'Anime',
  'Documentaries',
  'African Movies',
  'Hindi',
  'Rwandan Movies',
  'Kids',
]

export function slugifyTaxonomyName(name: string) {
  return name.toLowerCase().replaceAll(' ', '-')
}
