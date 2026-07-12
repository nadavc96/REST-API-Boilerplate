import "dotenv/config";
import { env } from "./config/env";
import app from "./app";
import logger from "./config/logger";

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
