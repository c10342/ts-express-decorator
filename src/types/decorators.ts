import { RequestHandler } from "express";

export interface RouteItem {
  name: string;
  url?: string;
  method?: "get" | "post";
  handler?: RequestHandler;
  middleware?: Array<RequestHandler>;
}

export interface MapValue {
  baseUrl?: string;
  routes?: Array<RouteItem>;
  middleware?: Array<RequestHandler>;
  self?: any;
}
