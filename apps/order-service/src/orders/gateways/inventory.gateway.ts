import { Injectable } from '@nestjs/common';

import { OrderItem } from '../order.entity';

@Injectable()
export class InventoryGateway {
  checkStock(items: OrderItem[]): Promise<void> {
    const unavailableItem = items.find((item) => item.quantity <= 0);

    if (unavailableItem) {
      return Promise.reject(
        new Error(`Product ${unavailableItem.productId} is out of stock`),
      );
    }

    return Promise.resolve();
  }

  decreaseStock(items: OrderItem[]): Promise<void> {
    return this.checkStock(items);
  }
}
