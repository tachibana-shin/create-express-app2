import Metalsmith from "metalsmith"
import match from "minimatch"

import { evaluate } from "../utils/evaluate"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filter(
  files: Metalsmith.Files,
  filters: Record<string, string>,
  data: any
) {
  const fileNames = Object.keys(files)
  Object.keys(filters).forEach((glob) => {
    fileNames.forEach((file) => {
      if (match(file, glob, { dot: true })) {
        const condition = filters[glob]
        if (!evaluate(condition, data)) {
          // eslint-disable-next-line functional/immutable-data
          delete files[file]
        }
      }
    })
  })
}
