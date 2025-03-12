/* Test of Payment Routes */
// Zhouzhou, backend intern team

/* Usage */
// 1. Add Product to the database manully (using mongosh), a proudct is unqiue with
// its name and variant.
// e.g: "name": "plus", "variant": "monthly"
// 2. Send POST request to "/test", the message format is TransactionData
// 3. Search for this user
// 4. If user exists, update the user's transaction
// 5. If user doesn't exist, create a user's transaction
// 6. Search for this product
// 7. If product doesn't exist, error
// 8. If product does exist, successful

import express, { Request, Response } from "express";
import PaymentRouter from "./routes/api/v1/payment";

const app: express.Application = express();
const port = process.env.PORT;

// Turn on JSON parser
app.use(express.json());

// Load the Router
app.use(PaymentRouter);

// Index page
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Index page" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at ${port}`);
});
