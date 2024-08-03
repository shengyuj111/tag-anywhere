export enum FileCoverAspectRatio {
  SQUARE = 1,
  Movie = 16 / 9,
  Book = 88 / 117,
}

export type RatioInfo = {
  label: string;
  ratio: number;
};

const FileCoverAspectRatioDetails: {
  [key in FileCoverAspectRatio]: RatioInfo;
} = {
  [FileCoverAspectRatio.SQUARE]: {
    label: "Square",
    ratio: FileCoverAspectRatio.SQUARE,
  },
  [FileCoverAspectRatio.Movie]: {
    label: "Movie",
    ratio: FileCoverAspectRatio.Movie,
  },
  [FileCoverAspectRatio.Book]: {
    label: "Book",
    ratio: FileCoverAspectRatio.Book,
  },
};

export const fileCoverAspectRatioDetailsList = Object.values(
  FileCoverAspectRatio,
)
  .filter((value) => typeof value === "number")
  .map((value) => ({
    fileCoverAspectRatio: value as FileCoverAspectRatio,
    ...FileCoverAspectRatioDetails[value as FileCoverAspectRatio],
  }));
