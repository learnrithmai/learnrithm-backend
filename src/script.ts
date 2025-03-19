// Run this script to configure Payment service

import { syncProducts } from "./payment/paymentService";

(async () => {
  await syncProducts();
})();
