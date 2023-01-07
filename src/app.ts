import Express from "express";

import load from "./load";

const app = Express();

load(app);

app.listen(3000, () => {
  console.log("http://localhost:3000");
});
