export interface TransactionData {
  email: string;
  duration: string;
  subscriptionStart: Date;
  subscriptionEnd: Date;
  orderName: string;
  orderVariant: string;
  refunded: boolean;
  freeTrial: boolean;
}
