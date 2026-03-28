import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
} from "@aws-sdk/client-s3";

function formatError(error) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const parts = [];
    if (typeof error.name === "string" && error.name) {
      parts.push(error.name);
    }
    if (typeof error.code === "string" && error.code) {
      parts.push(`(${error.code})`);
    }

    return parts.length > 0 ? parts.join(" ") : JSON.stringify(error);
  }

  return String(error);
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }

  return value;
}

function createClient() {
  return new S3Client({
    endpoint: getRequiredEnv("S3_ENDPOINT"),
    region: process.env.S3_REGION ?? "us-east-1",
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: getRequiredEnv("S3_ACCESS_KEY_ID"),
      secretAccessKey: getRequiredEnv("S3_SECRET_ACCESS_KEY"),
    },
  });
}

function isMissingBucket(error) {
  return (
    error?.name === "NotFound" ||
    error?.name === "NoSuchBucket" ||
    error?.$metadata?.httpStatusCode === 404
  );
}

async function main() {
  const bucket = getRequiredEnv("S3_BUCKET");
  const region = process.env.S3_REGION ?? "us-east-1";
  const client = createClient();

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket ${bucket} already exists.`);
    return;
  } catch (error) {
    if (!isMissingBucket(error)) {
      throw error;
    }
  }

  console.log(`Bucket ${bucket} is missing, creating it...`);
  const input = { Bucket: bucket };
  if (region !== "us-east-1") {
    input.CreateBucketConfiguration = {
      LocationConstraint: region,
    };
  }

  await client.send(new CreateBucketCommand(input));
  console.log(`Bucket ${bucket} is ready.`);
}

main().catch((error) => {
  console.error(formatError(error));
  process.exit(1);
});
