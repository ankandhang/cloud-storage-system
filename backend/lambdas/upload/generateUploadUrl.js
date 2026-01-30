import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

import { s3 } from "../common/s3.js";
import { ddb } from "../common/dynamodb.js";
import { getUserId } from "../common/auth.js";

export const handler = async (event) => {
  try {
    const userId = getUserId(event);
    const body = JSON.parse(event.body);

    const { fileName, contentType, size } = body;

    const fileId = uuidv4();
    const s3Key = `${userId}/${fileId}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3, command, {
      expiresIn: 300,
    });

    await ddb.send(
      new PutItemCommand({
        TableName: process.env.FILES_TABLE,
        Item: {
          fileId: { S: fileId },
          userId: { S: userId },
          fileName: { S: fileName },
          s3Key: { S: s3Key },
          size: { N: String(size || 0) },
          createdAt: { S: new Date().toISOString() },
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        fileId,
        uploadUrl,
      }),
    };
  } catch (err) {
    console.error("Upload URL error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to generate upload URL" }),
    };
  }
};
