import {
  createLemonUser,
  createProduct,
  createTransaction,
  fetchProducts,
  LemonSq,
  lemonWebhook,
  searchProduct,
  updateProduct,
} from "./payment/paymentService";

// createProduct({
//   name: "pro",
//   nameId: "0002",
//   variant: "monthly",
//   variantId: "0001",
//   freeTrailAmount: 7,
// });

// createTransaction({
//   email: "test@test.com",
//   duration: "30",
//   subscriptionStart: new Date(),
//   subscriptionEnd: new Date(),
//   orderName: "plus",
//   orderVariant: "monthly",
//   refunded: false,
//   freeTrial: true,
// });

// console.log(await searchProduct("plus", "monthly"));

// console.log(
//   await updateProduct({
//     name: "plus",
//     nameId: "466564",
//     variant: "monthly",
//     variantId: "721891",
//     freeTrailAmount: 14,
//   })
// );

//LemonSq();

//console.log(await createLemonUser("zhou", "test@testtest.com"));

//console.log(await lemonWebhook());

console.log(await fetchProducts("721891"));
