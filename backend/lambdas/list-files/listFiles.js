import { QueryCommand } from "@aws-sdk/client-dynamodb";
import { ddb } from "../common/dynamodb.js";
import { getUserId } from "../common/auth.js";

export const handler = async (event) => {
  try {
    const userId = getUserId(event);

    const result = await ddb.send(
      new QueryCommand({
        TableName: process.env.FILES_TABLE,
        IndexName: "userId-index",   // GSI REQUIRED
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": { S: userId },
        },
      })
    );

    const files = (result.Items || []).map((item) => ({
      fileId: item.fileId.S,
      fileName: item.fileName.S,
      size: item.size?.N,
      createdAt: item.createdAt.S,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ files }),
    };
  } catch (err) {
    console.error("List files error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to list files" }),
    };
  }
};
