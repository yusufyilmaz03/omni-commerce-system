import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function getDatabaseConfig(prefix: string): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: process.env[`${prefix}_DB_HOST`] ?? 'localhost',
    port: Number(process.env[`${prefix}_DB_PORT`] ?? 5432),
    username: process.env[`${prefix}_DB_USERNAME`] ?? 'postgres',
    password: process.env[`${prefix}_DB_PASSWORD`] ?? 'postgres',
    database: process.env[`${prefix}_DB_NAME`] ?? 'postgres',
    autoLoadEntities: true,
    synchronize: true,
  };
}
