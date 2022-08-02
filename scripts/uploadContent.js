const path = require('path');
const fs = require('fs');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const ShortUniqueId = require('short-unique-id');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_ACCESS_KEY,
  },
});

// Upload file to specified bucket.
const uploadToS3Bucket = async (sourceFilePath, s3BucketPath) => {
  const sourceFileStream = fs.createReadStream(sourceFilePath);
  const uploadParams = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3BucketPath,
    Body: sourceFileStream,
  };
  try {
    const data = await s3Client.send(new PutObjectCommand(uploadParams));
    return data; // For unit tests.
  } catch (err) {
    console.log('Error', err);
  }
};

const getUploadContentPromises = (sourceFileBasePath, s3BucketBasePath) => {
  const uploadContentPromises = [];
  const locales = fs.readdirSync(path.resolve('./', sourceFileBasePath));
  locales.forEach((locale) => {
    const sourceFilePath = `${sourceFileBasePath}/${locale}`;
    const s3BucketPath = `${s3BucketBasePath}/${locale}`;
    uploadContentPromises.push(uploadToS3Bucket(sourceFilePath, s3BucketPath));
  });
  return uploadContentPromises;
};

const prepareContentAndUpload = async () => {
  const uid = new ShortUniqueId({ length: 8 });
  const hashId = uid();
  console.log(`Content Manifest ID : ${hashId}`);
  const buildContentPath = './build_content';
  const s3UploadPath = `content/${hashId}`;
  // Parallel invoking of content upload to S3 bucket
  try {
    const uploadData = await getUploadContentPromises(
      buildContentPath,
      s3UploadPath
    );
    console.log('Successfully uploaded all content files to S3 bucket');
  } catch (err) {
    console.error('Error in uploading contents to S3 bucket.');
    console.error(err.message);
  }
};

prepareContentAndUpload();
