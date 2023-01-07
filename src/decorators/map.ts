import { MapValue } from "../types";

export const map = new Map<object, MapValue>();

export const setTargetToMap = (target: any) => {
  if (!map.has(target)) {
    map.set(target, {});
  }
};

export const getDataFromMap = (target: any) => {
  setTargetToMap(target);
  return map.get(target)!;
};

export const addSelfToMap = (target: any, self: any) => {
  const data = getDataFromMap(target);
  data.self = self;
};
