import { RequestHandler } from "express";
import { createRoute, getDataFromMap } from "./index";

export const Middleware = (...args: Array<RequestHandler>) => {
  return (target: any, name?: string) => {
    const data = name
      ? createRoute(target.constructor, name)
      : getDataFromMap(target);

    if (!data.middleware) {
      data.middleware = [];
    }
    args.forEach((item) => {
      // 去重
      const res = data.middleware?.find((i) => i === item);
      if (!res) {
        data.middleware?.push(item);
      }
    });
  };
};
