import { getDataFromMap } from "./index";

export const Controller = (baseUrl?: string) => {
  return (target: any) => {
    if (baseUrl) {
      const data = getDataFromMap(target);
      data.baseUrl = baseUrl;
    }
  };
};
