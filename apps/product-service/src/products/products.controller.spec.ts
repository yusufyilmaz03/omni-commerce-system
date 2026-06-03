import { CreateProductDto } from './dto/create-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Product } from './product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<
    Pick<ProductsService, 'create' | 'findAll' | 'findOne' | 'updateStock'>
  >;

  const product: Product = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    description: 'Mechanical keyboard',
    id: 'product-1',
    name: 'Keyboard',
    price: '99.99',
    stock: 10,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    productsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      updateStock: jest.fn(),
    };

    controller = new ProductsController(
      productsService as unknown as ProductsService,
    );
  });

  it('delegates product creation to the service', async () => {
    const dto: CreateProductDto = {
      description: product.description,
      name: product.name,
      price: 99.99,
      stock: product.stock,
    };

    productsService.create.mockResolvedValue(product);

    await expect(controller.create(dto)).resolves.toBe(product);
    expect(productsService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates product listing to the service', async () => {
    productsService.findAll.mockResolvedValue([product]);

    await expect(controller.findAll()).resolves.toEqual([product]);
    expect(productsService.findAll).toHaveBeenCalledTimes(1);
  });

  it('delegates finding one product to the service', async () => {
    productsService.findOne.mockResolvedValue(product);

    await expect(controller.findOne(product.id)).resolves.toBe(product);
    expect(productsService.findOne).toHaveBeenCalledWith(product.id);
  });

  it('delegates stock updates to the service', async () => {
    const dto: UpdateStockDto = { stock: 5 };
    const updatedProduct = { ...product, stock: dto.stock };

    productsService.updateStock.mockResolvedValue(updatedProduct);

    await expect(controller.updateStock(product.id, dto)).resolves.toBe(
      updatedProduct,
    );
    expect(productsService.updateStock).toHaveBeenCalledWith(product.id, dto);
  });
});
