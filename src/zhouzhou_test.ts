/* Test of Payment Routes */
// Zhouzhou, backend intern team

/* Usage */

import express, { Request, Response } from "express";
import PaymentRouter from "./routes/api/v1/payment";

const app: express.Application = express();
const port = process.env.PORT;

// Turn on JSON parser
app.use(express.json());

// Load the Router
app.use(PaymentRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
