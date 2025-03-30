import logger from "./chalkLogger";

type dataType = {
  email?: string;
  trialEndsAt?: string;
  cardBrand?: string;
  cardLastFour?: string;
  subscriptionStartAt?: string;
  subscriptionRenewsAt?: string;
  status?: string;
}

export async function logPaymentMsg(data: dataType, type: string): Promise<void> {
  switch (type) {
    case 'subscription_created':
      logger.success(
        type,
        `New subscription successfully created for user ${data.email}.
- Trial period ends: ${data.trialEndsAt}
- Payment method: ${data.cardBrand} (ending in ${data.cardLastFour})
- Subscription start: ${data.subscriptionStartAt}
- Next renewal scheduled at: ${data.subscriptionRenewsAt}`
      );
      break;

    case 'subscription_updated':
      logger.info(
        type,
        `Subscription for user ${data.email} has been updated.
- Updated status: ${data.status}
- Trial period now ends: ${data.trialEndsAt}
- Upcoming renewal: ${data.subscriptionRenewsAt}`
      );
      break;

    case 'subscription_cancelled':
      logger.warning(
        type,
        `Subscription for user ${data.email} has been cancelled.
Please verify the cancellation details and ensure appropriate follow-up if necessary.`
      );
      break;

    case 'subscription_expired':
      logger.warning(
        type,
        `Subscription for user ${data.email} has expired.
The subscription period concluded on ${data.trialEndsAt}. Consider reaching out to the user for possible renewal options.`
      );
      break;

    case 'subscription_payment_success':
      logger.success(
        type,
        `Payment processed successfully for user ${data.email}.
The subscription has been renewed without issues.`
      );
      break;

    case 'subscription_payment_failed':
      logger.error(
        type,
        `Payment failure detected for user ${data.email}.
Please review the payment method and notify the user to update their billing details.`
      );
      break;

    case 'subscription_payment_refunded':
      logger.info(
        type,
        `Payment refund issued for user ${data.email}.
The refunded amount has been processed and reversed accordingly.`
      );
      break;

    default:
      logger.debug(
        'logPaymentMsg',
        `Unhandled event type: ${type}. Received data: ${JSON.stringify(data)}`
      );
      break;
  }
}
