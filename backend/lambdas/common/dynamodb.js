import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

export const ddb = new DynamoDBClient({
  region: process.env.AWS_REGION,
});
