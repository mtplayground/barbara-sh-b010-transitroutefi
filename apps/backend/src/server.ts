import { createApp } from "./app.js";
import { appConfig } from "./config/env.js";

const app = createApp();

app.listen(appConfig.port, appConfig.host, () => {
  console.log(`Backend listening on http://${appConfig.host}:${appConfig.port}`);
});
