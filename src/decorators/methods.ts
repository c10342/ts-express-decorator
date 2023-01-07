import { createRoute } from "./index";

const createMethod = (method: "get" | "post") => {
  return (url?: string) => {
    return (target: any, name: string) => {
      const requestUrl = url ? url : `/${name}`;
      const route = createRoute(target.constructor, name);
      route.url = requestUrl;
      route.method = method;
      route.handler = target[name];
    };
  };
};

export const Get = createMethod("get");

export const Post = createMethod("post");
