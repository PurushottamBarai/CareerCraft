import "dotenv/config.js";
import { app, dbConfig } from "./app.js";

const PORT = process.env.PORT;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${dbConfig.host}`);
});
