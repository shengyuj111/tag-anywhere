export const guard = <T>(
  guardValue: unknown,
  randomFunction: () => T,
): T | undefined => {
  if (guardValue === undefined) return undefined;
  if (guardValue === null) return undefined;
  if (guardValue === false) return undefined;
  return randomFunction();
};
