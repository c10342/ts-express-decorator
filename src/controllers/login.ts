import Express, { RequestHandler } from "express";
import { Controller, Get, Middleware } from "../decorators";

const createMiddleware =
  (message: string): RequestHandler =>
  (req, res, next) => {
    console.log("login--" + message);
    next();
  };

@Controller("/login")
@Middleware(createMiddleware("全局中间件"), createMiddleware("全局中间件2"))
class LoginController {
  @Get("/test")
  @Middleware(createMiddleware("局部中间件"), createMiddleware("局部中间件2"))
  test(req: Express.Request, res: Express.Response) {
    res.send("LoginController");
  }
}

export default LoginController;
