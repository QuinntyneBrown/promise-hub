import { type Locator } from '@playwright/test';
import { BasePage } from './base.page';

/** A message (mock: message): delivery counts, the delivery by household and the text as sent. */
export class MessagePage extends BasePage {
  get heading(): Locator {
    return this.page.getByRole('heading', { level: 1 });
  }

  kpi(label: 'Delivered' | 'Failed' | 'Paused'): Locator {
    return this.page.getByTestId(`kpi-${label}`).getByTestId('stat-value');
  }

  get deliveryRows(): Locator {
    return this.page.getByRole('table', { name: 'Delivery by household' }).locator('tbody tr');
  }

  delivery(household: string): Locator {
    return this.deliveryRows.filter({ hasText: household });
  }

  get smsText(): Locator {
    return this.page.getByTestId('sms-text');
  }
}
