import React from 'react'
import { MediaTypePage } from './MediaTypePage'

export const Movies: React.FC = () => {
  return <MediaTypePage type="movie" title="Movies" pagePath="/movies" />
}
