import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { Product } from './product.entity';
import { ProductCacheService } from './product-cache.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly productCacheService: ProductCacheService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productsRepository.create({
      ...createProductDto,
      price: createProductDto.price.toFixed(2),
    });

    const savedProduct = await this.productsRepository.save(product);
    await this.productCacheService.deleteProductList();

    return savedProduct;
  }

  async findAll(): Promise<Product[]> {
    const cachedProducts = await this.productCacheService.getProductList();

    if (cachedProducts) {
      return cachedProducts;
    }

    const products = await this.productsRepository.find({
      order: { createdAt: 'DESC' },
    });

    await this.productCacheService.setProductList(products);

    return products;
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    product.stock = updateStockDto.stock;

    const savedProduct = await this.productsRepository.save(product);
    await this.productCacheService.deleteProductList();

    return savedProduct;
  }
}
