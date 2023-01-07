import { getDataFromMap } from "./index";

export const createRoute = (target: any, name: string) => {
  const data = getDataFromMap(target)!;
  if (!data.routes) {
    data.routes = [];
  }
  let route = data.routes.find((item) => item.name === name);
  if (!route) {
    route = { name };
    data.routes.push(route);
  }
  return route;
};
