import { GetObjectCommand } from "@aws-sdk/client-s3";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3 } from "../common/s3.js";
import { ddb } from "../common/dynamodb.js";
import { getUserId } from "../common/auth.js";

export const handler = async (event) => {
  try {
    const userId = getUserId(event);
    const { fileId } = JSON.parse(event.body);

    const result = await ddb.send(
      new GetItemCommand({
        TableName: process.env.FILES_TABLE,
        Key: { fileId: { S: fileId } },
      })
    );

    if (!result.Item || result.Item.userId.S !== userId) {
      return { statusCode: 403, body: "Access denied" };
    }

    const s3Key = result.Item.s3Key.S;

    const command = new GetObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
    });

    const downloadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ downloadUrl }),
    };
  } catch (err) {
    console.error("Download URL error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to generate download URL" }),
    };
  }
};
