# 基于 typescript 装饰器实现 express 路由

## 使用

我们先来看看原生的使用方式和使用装饰器实现的使用方式，这样子可以让我们更加直观的感受到区别

**原生的使用方式**

```typescript
import { Router } from "express";

const router = Router();

router.use((req, res, next) => {
  console.log("全局中间件");
  next();
});

router.get(
  "/test1",
  (req, res, next) => {
    console.log("局部中间件");
    next();
  },
  (req, res) => {
    res.send("get success");
  }
);

router.post("/test2", (req, res) => {
  res.send("post success");
});

app.use("/home", router);
```

**装饰器的使用方式**

```typescript
@Controller("/home")
@Middleware((req, res, next) => {
  console.log("全局中间件");
  next();
})
class HomeController {
  private userName = "张三";

  @Get("/test1")
  @Middleware((req, res, next) => {
    console.log("局部中间件");
    next();
  })
  test1(req: Express.Request, res: Express.Response) {
    res.send("get success" + this.userName);
  }

  @Post("/test2")
  test2(req: Express.Request, res: Express.Response) {
    res.send("post success" + this.userName);
  }
}
```

通过以上的对比，我们可以发现，装饰器的使用方式更加符合`OOP`的编程方式

## 装饰器分析

其实装饰器就是用来收集我们组装路由所需要的的数据

- Controller

`@Controller("/home")`最终会被转换为如下原生代码：

```typescript
const router = Router();

app.use("/home", router);
```

一个 `Controller` 表示一个`路由模块`

所以在 `Controller`装饰器中，我们需要收集的是`/home`作为该`路由模块`的前缀路径

- Get

如下使用方式：

```typescript
@Get("/test1")
test() {}
```

最终会被转换为如下原生代码：

```typescript
router.get("/test1", test);
```

所以在 `Get`装饰器中，我们需要收集的是`/test1`作为请求的 url 路径。`Post`装饰器同理

- Middleware

`@Middleware`作用在不同地方会有不同的效果

装饰在类上，如下：

```typescript
@Middleware((req, res, next) => {
  console.log("全局中间件");
  next();
})
class HomeController {}
```

最终会被转换为如下原生代码：

```typescript
router.use((req, res, next) => {
  console.log("全局中间件");
  next();
});
```

装饰在方法上，如下：

```typescript
@Get("/test1")
@Middleware((req, res, next) => {
console.log("局部中间件");
next();
})
test() {}
```

最终会被转换为如下原生代码：

```typescript
router.get(
  "/test1",
  (req, res, next) => {
    console.log("局部中间件");
    next();
  },
  test
);
```

所以在 `Middleware`装饰器中，我们需要收集的是传入的中间件，并且识别出该中间件是`路由模块`的全局中间件还是局部中间件

## 装饰器实现

通过上面的分析，我们期望在装饰器收集数据的时候，构造出如下的数据结构：

```typescript
const map = {
  HomeController: {
    // 路由模块前缀路径
    baseUrl: "/home",
    // 路由模块的全局中间件
    middleware: [
      (req, res, next) => {
        console.log("全局中间件");
        next();
      },
    ],
    // 路由
    routes: [
      {
        // 类中的方法名，作为每个路由的唯一标识
        name: "test1",
        // 路由请求的url
        url: "/test1",
        // 请求方法
        method: "get",
        // 请求处理函数
        handler: function test1() {},
        // 局部中间件
        middleware: [
          (req, res, next) => {
            console.log("局部中间件");
            next();
          },
        ],
      },
      {
        name: "test2",
        url: "/test2",
        method: "post",
        handler: function test2() {},
      },
    ],
    // Controller实例，通过bind(self)，将路由的请求处理函数的this绑定到实例上，以便路由的请求处理函数访问类中的其他属性和方法
    self: this,
  },
};
```

因为存储的时候`key`是一个对象类型，所以我们使用`Map`进行存储

```typescript
const map = new Map<object, MapValue>();

const setTargetToMap = (target: any) => {
  if (!map.has(target)) {
    map.set(target, {});
  }
};

const getTargetFromMap = (key: any) => {
  setTargetToMap(key);
  return map.get(key)!;
};

const addSelfToMap = (target: any, self: any) => {
  const data = getTargetFromMap(target);
  data.self = self;
};
```

- Controller

```typescript
const Controller = (baseUrl?: string) => {
  return (target: any) => {
    if (baseUrl) {
      const data = getTargetFromMap(target);
      // 收集前缀路径
      data.baseUrl = baseUrl;
    }
  };
};
```

- Get，Post

```typescript
// 创建路由数据
const createRoute = (target: any, name: string) => {
  const data = getTargetFromMap(target)!;
  if (!data.routes) {
    // 判空
    data.routes = [];
  }
  //   查询是否已经存在了对应的路由
  let route = data.routes.find((item) => item.name === name);
  if (!route) {
    // 没有则创建一个路由
    route = { name };
    data.routes.push(route);
  }
  //   返回路由
  return route;
};

const createMethod = (method: "get" | "post") => {
  return (url?: string) => {
    return (target: any, name: string) => {
      // 路由请求路径，url不存在，则使用方法名作为请求路径
      const requestUrl = url ? url : `/${name}`;
      //   创建路由数据
      const route = createRoute(target.constructor, name);
      //   路由请求的url
      route.url = requestUrl;
      //   路由请求方法
      route.method = method;
      //   路由请求处理函数
      route.handler = target[name];
    };
  };
};

const Get = createMethod("get");

const Post = createMethod("post");
```

- Middleware

```typescript
const Middleware = (...args: Array<RequestHandler>) => {
  return (target: any, name?: string) => {
    // name如果存在，则说明是装饰在类的方法上，否则就是装饰在类上
    const data = name
      ? createRoute(target.constructor, name)
      : getTargetFromMap(target);

    if (!data.middleware) {
      // 判空
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
```

- 注意事项

我们可以发现，在上面的装饰器中，频繁出现`target`。我们需要注意的是装饰在类上的`target`和装饰在方法的`target`是不一样的。

如下例子：

```typescript
class HomeController {}

const instance = new HomeController();
```

装饰在类上的`target`指的是类的本身，也就是`HomeController`

装饰在方法的`target`指的是类的实例对象，也就是`instance`。如果我们想通过实例对象的构造类，可通过`instance.constructor`获取

## 自动加载

当我们写好一个 `Controller` 的时候，我们希望可以自动进行加载，而不需要重复得进行引入和使用。这也是使用原生写法的一个弊端。

自动加载思路如下：

- 获取所有 `Controller` 的文件路径

- 通过`require`关键字进行动态加载

- 通过`new` 关键字初始化`Controller`

- 将初始化后的实例对象存储到数据结构中

- 根据存储的数据结构注册对应的路由

代码如下：

**load**

```typescript
const load = (app: Express) => {
  // 获取controllers存放的目录
  const dir = path.resolve(__dirname, "./controllers");
  //   获取目录下的所有文件名
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    // 动态加载模块
    const module = require(path.join(dir, file));
    // 模块是通过esmodule的格式导出的，所以需要通过default获取
    const Constructor = module.default;
    // 初始化Controller
    const instance = new Constructor();
    // 将实例对象存储到数据结构中
    addSelfToMap(Constructor, instance);
  });
  //   注册路由
  register(app);
};
```

**register**

```typescript
const register = (app: Express) => {
  // 遍历存储的数据结构
  map.forEach((item) => {
    // 初始化一个路由模块
    const router = Router();
    if (item.middleware?.length) {
      // 全局的路由模块中间件
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
        // 判空
        return;
      }
      // 中间件合并去重
      const middleware = [
        ...(route.middleware ?? []),
        // 请求处理函数绑定Controller实例，以便请求处理函数可以访问Controller实例的其他方法和属性
        route.handler.bind(item.self),
      ];
      // 创建路由
      router[route.method](url, ...(middleware as any));
    });

    const baseUrl = item.baseUrl;

    if (baseUrl) {
      // 设置路由模块前缀
      app.use(baseUrl, router);
    } else {
      app.use(router);
    }
  });
};
```

## 使用

```typescript
const app = Express();

load(app);

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
```

到此，我们已经完成装饰器实现 express 路由的功能。我们只需要在`controllers`目录下编写自己的`Controller`即可
