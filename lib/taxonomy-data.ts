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
  'Science Fiction',
  'Fantasy',
  'Romance',
  'Animation',
  'Family',
  'Musical',
  'Biography',
  'Historical',
  'Sports',
  'Superhero',
]

export function slugifyTaxonomyName(name: string) {
  return name.toLowerCase().replaceAll(' ', '-')
}
