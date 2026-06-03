import {
  ClientProviderOptions,
  KafkaOptions,
  Transport,
} from '@nestjs/microservices';

type KafkaClientOptions = KafkaOptions['options'];

export const getKafkaConfig = (
  clientId: string,
  groupId: string,
): KafkaOptions => {
  return {
    transport: Transport.KAFKA,
    options: getKafkaOptions(clientId, groupId),
  };
};

export const getKafkaClientConfig = (
  name: string | symbol,
  clientId: string,
  groupId: string,
): ClientProviderOptions => {
  return {
    name,
    transport: Transport.KAFKA,
    options: getKafkaOptions(clientId, groupId),
  };
};

function getKafkaOptions(
  clientId: string,
  groupId: string,
): KafkaClientOptions {
  return {
    client: {
      clientId,
      brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
    },
    consumer: {
      groupId,
    },
  };
}
