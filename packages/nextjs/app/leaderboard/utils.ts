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
