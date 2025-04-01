import express from "express";
import streak_routes from "routes/api/v2/streak";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use("/api", streak_routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
