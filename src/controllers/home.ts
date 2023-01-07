import Express, { RequestHandler } from "express";
import { Controller, Get, Middleware } from "../decorators";

const createMiddleware =
  (message: string): RequestHandler =>
  (req, res, next) => {
    console.log(message);
    next();
  };

@Controller("/home")
@Middleware(createMiddleware("全局中间件"), createMiddleware("全局中间件2"))
class HomeController {
  private userName = "张三";

  @Get("/test")
  @Middleware(createMiddleware("局部中间件"), createMiddleware("局部中间件2"))
  test(req: Express.Request, res: Express.Response) {
    res.send("success" + this.userName);
  }
}

export default HomeController;
