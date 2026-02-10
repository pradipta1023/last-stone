export const botMove = (noOfSticks) => {
  if ((noOfSticks - 1) % 4 === 1) return 1;
  if ((noOfSticks - 2) % 4 === 1) return 2;
  if ((noOfSticks - 3) % 4 === 1) return 3;
  return 1;
};
