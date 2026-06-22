import { Client } from '@elastic/elasticsearch';

let esClient: Client;

const connectElasticsearch = async (): Promise<void> => {
  const node = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';

  esClient = new Client({ node });

  // Verify connection
  await esClient.ping();
};

export const getElastic = (): Client => {
  if (!esClient) throw new Error('Elasticsearch not initialized. Call connectElasticsearch() first.');
  return esClient;
};

export default connectElasticsearch;
