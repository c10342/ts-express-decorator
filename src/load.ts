import { Router, Express } from "express";
import fs from "fs";
import path from "path";
import { addSelfToMap, map } from "./decorators/index";

const register = (app: Express) => {
  map.forEach((item) => {
    const router = Router();
    if (item.middleware?.length) {
      // 一定要放在最前面
      // 中间件在前面的先执行
      router.use(...item.middleware);
    }
    // 获取所有路由
    const routes = item.routes ?? [];
    // 遍历每一个路由
    routes.forEach((route) => {
      // 路由url
      const url = route.url;
      if (!route.method || !url || !route.handler) {
        return;
      }
      // 中间件合并去重
      const middleware = [
        ...(route.middleware ?? []),
        route.handler.bind(item.self)
      ];
      // 创建路由
      router[route.method](url, ...(middleware as any));
    });

    const baseUrl = item.baseUrl;

    if (baseUrl) {
      app.use(baseUrl, router);
    } else {
      app.use(router);
    }
  });
};

const load = (app: Express) => {
  const dir = path.resolve(__dirname, "./controllers");
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const module = require(path.join(dir, file));
    const Constructor = module.default;
    const instance = new Constructor();
    addSelfToMap(Constructor, instance);
  });
  register(app);
};

export default load;
