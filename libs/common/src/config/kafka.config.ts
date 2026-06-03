import { Transport, KafkaOptions } from '@nestjs/microservices';

export const getKafkaConfig = (
  clientId: string,
  groupId: string,
): KafkaOptions => {
  return {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId,
        brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
      },
      consumer: {
        groupId,
      },
    },
  };
};
