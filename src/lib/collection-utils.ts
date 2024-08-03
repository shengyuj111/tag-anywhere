import _ from "lodash";

export const hasDuplicates = (array: unknown[]) => {
  return _.some(array, function (elt, index) {
    return array.indexOf(elt) !== index;
  });
};

export const removeDuplicates = <T>(array: T[]) => {
  return _.uniq(array);
};

export const numMakeStep = (start: number, steps: number): number[] => {
  const stepValue = steps > 0 ? 1 : -1;
  return Array.from(
    { length: Math.abs(steps) },
    (_, i) => start + i * stepValue,
  );
};

declare global {
  interface Array<T> {
    addRange(items: T[]): void;
    end(): T | undefined;
  }
}

Array.prototype.addRange = function <T>(this: T[], items: T[]): void {
  for (const item of items) {
    this.push(item);
  }
};

Array.prototype.end = function <T>(this: T[]): T | undefined {
  return this[this.length - 1];
};
