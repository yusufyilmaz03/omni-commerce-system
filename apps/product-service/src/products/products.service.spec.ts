import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Product } from './product.entity';
import { ProductCacheService } from './product-cache.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let productsRepository: jest.Mocked<
    Pick<Repository<Product>, 'create' | 'find' | 'findOne' | 'save'>
  >;
  let productCacheService: jest.Mocked<
    Pick<
      ProductCacheService,
      'deleteProductList' | 'getProductList' | 'setProductList'
    >
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
    productsRepository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    productCacheService = {
      deleteProductList: jest.fn(),
      getProductList: jest.fn(),
      setProductList: jest.fn(),
    };

    service = new ProductsService(
      productsRepository as unknown as Repository<Product>,
      productCacheService as unknown as ProductCacheService,
    );
  });

  it('creates a product and invalidates the list cache', async () => {
    productsRepository.create.mockReturnValue(product);
    productsRepository.save.mockResolvedValue(product);
    productCacheService.deleteProductList.mockResolvedValue(undefined);

    const result = await service.create({
      description: product.description,
      name: product.name,
      price: 99.99,
      stock: product.stock,
    });

    expect(productsRepository.create).toHaveBeenCalledWith({
      description: product.description,
      name: product.name,
      price: product.price,
      stock: product.stock,
    });
    expect(productsRepository.save).toHaveBeenCalledWith(product);
    expect(productCacheService.deleteProductList).toHaveBeenCalledTimes(1);
    expect(result).toBe(product);
  });

  it('returns cached products without querying the repository', async () => {
    productCacheService.getProductList.mockResolvedValue([product]);

    const result = await service.findAll();

    expect(result).toEqual([product]);
    expect(productsRepository.find).not.toHaveBeenCalled();
    expect(productCacheService.setProductList).not.toHaveBeenCalled();
  });

  it('loads products from the repository and caches them on cache miss', async () => {
    productCacheService.getProductList.mockResolvedValue(null);
    productsRepository.find.mockResolvedValue([product]);
    productCacheService.setProductList.mockResolvedValue(undefined);

    const result = await service.findAll();

    expect(productsRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
    expect(productCacheService.setProductList).toHaveBeenCalledWith([product]);
    expect(result).toEqual([product]);
  });

  it('finds a product by id', async () => {
    productsRepository.findOne.mockResolvedValue(product);

    await expect(service.findOne(product.id)).resolves.toBe(product);
    expect(productsRepository.findOne).toHaveBeenCalledWith({
      where: { id: product.id },
    });
  });

  it('throws when a product does not exist', async () => {
    productsRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-product')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('updates product stock and invalidates the list cache', async () => {
    const updatedProduct = { ...product, stock: 5 };

    productsRepository.findOne.mockResolvedValue(product);
    productsRepository.save.mockResolvedValue(updatedProduct);
    productCacheService.deleteProductList.mockResolvedValue(undefined);

    const result = await service.updateStock(product.id, { stock: 5 });

    expect(productsRepository.save).toHaveBeenCalledWith(updatedProduct);
    expect(productCacheService.deleteProductList).toHaveBeenCalledTimes(1);
    expect(result.stock).toBe(5);
  });
});
