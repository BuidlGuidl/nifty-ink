export type Tuple<T, MaxLength extends number = 10, Current extends T[] = []> = Current["length"] extends MaxLength
  ? Current
  : Current | Tuple<T, MaxLength, [T, ...Current]>;

export const emojifyTop3 = (rank: number): string => {
  switch (rank) {
    case 1:
      return `${rank} 🏆`;
    case 2:
      return `${rank} 🥈`;
    case 3:
      return `${rank} 🥉`;
    default:
      return rank.toString();
  }
};
