
const { S3Client, PutObjectCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const CustomError = require('../utils/customError');
const { isImageType, getMimeType, generateImageVariants } = require('./imageProcessor');

const s3Client = new S3Client({
  endpoint: process.env.SUPABASE_S3_ENDPOINT || process.env.SUPABASE_URL?.replace('https://', 'https://') + '/storage/v1/s3',
  region: process.env.SUPABASE_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY || process.env.SUPABASE_ACCESS_KEY,
    secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY || process.env.SUPABASE_SECRET_KEY,
  },
  forcePathStyle: true,
});


const uploadFile = async (file, bucketName, filePath, contentType, metadata = {}) => {
  try {
    if (!bucketName || !filePath) {
      throw new CustomError('Bucket name and file path are required', 400);
    }

    const uploadCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: filePath,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    });

    await s3Client.send(uploadCommand);

    const baseUrl = process.env.SUPABASE_URL?.replace('/rest/v1', '') || '';
    const publicUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

    return {
      success: true,
      key: filePath,
      url: publicUrl,
      bucket: bucketName,
    };
  } catch (error) {
    throw new CustomError(
      `File upload failed: ${error.message}`,
      error.statusCode || 500
    );
  }
};

const uploadLargeFile = async (file, bucketName, filePath, contentType, options = {}) => {
  try {
    if (!bucketName || !filePath) {
      throw new CustomError('Bucket name and file path are required', 400);
    }

    const {
      partSize = 5 * 1024 * 1024, 
      queueSize = 4,  
      metadata = {},
    } = options;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: bucketName,
        Key: filePath,
        Body: file,
        ContentType: contentType,
        Metadata: metadata,
      },
      partSize,
      queueSize,
    });

    upload.on('httpUploadProgress', (progress) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`Upload progress: ${progress.loaded}/${progress.total} bytes`);
      }
    });

    await upload.done();

    const baseUrl = process.env.SUPABASE_URL?.replace('/rest/v1', '') || '';
    const publicUrl = `${baseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;

    return {
      success: true,
      key: filePath,
      url: publicUrl,
      bucket: bucketName,
    };
  } catch (error) {
    try {
      if (error.$metadata?.uploadId) {
        await s3Client.send(
          new AbortMultipartUploadCommand({
            Bucket: bucketName,
            Key: filePath,
            UploadId: error.$metadata.uploadId,
          })
        );
      }
    } catch (abortError) {
      console.error('Failed to abort multipart upload:', abortError);
    }

    throw new CustomError(
      `Large file upload failed: ${error.message}`,
      error.statusCode || 500
    );
  }
};

const uploadImageWithVariants = async (imageBuffer, bucketName, baseFilePath, contentType, options = {}) => {
  try {
    if (!bucketName || !baseFilePath) {
      throw new CustomError('Bucket name and file path are required', 400);
    }

    const {
      sizes,
      format,
      quality,
      optimize = true,
      multipartThreshold = 10 * 1024 * 1024,
      metadata = {},
      processImage: shouldProcess = true,
    } = options;

    const variants = await generateImageVariants(imageBuffer, {
      sizes,
      format,
      quality,
      optimize,
    });

    const uploadResults = {
      success: true,
      variants: [],
      thumbnail: null,
      medium: null,
      large: null,
      original: null,
    };

    const baseUrl = process.env.SUPABASE_URL?.replace('/rest/v1', '') || '';

    const pathParts = baseFilePath.split('/');
    const fileName = pathParts.pop();
    const folder = pathParts.join('/');
    
    const fileExtension = fileName.split('.').pop();
    const baseNameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const uniqueBaseName = baseNameWithoutExt.includes('-') && baseNameWithoutExt.match(/^\d+-[a-z0-9]+$/) 
      ? baseNameWithoutExt 
      : `${timestamp}-${randomString}`;

    for (const variant of variants) {
      const sizePrefix = variant.size === 'thumbnail' ? 'thumb_' :
                        variant.size === 'medium' ? 'medium_' :
                        variant.size === 'large' ? 'large_' : '';
      
      const variantExtension = variant.format === 'webp' ? 'webp' : fileExtension;
      const variantFileName = sizePrefix 
        ? `${sizePrefix}${uniqueBaseName}.${variantExtension}`
        : `${uniqueBaseName}.${variantExtension}`;
      const variantPath = folder ? `${folder}/${variantFileName}` : variantFileName;
      
      const variantMimeType = getMimeType(variant.format);
      
      const useMultipart = variant.buffer.length >= multipartThreshold;
      
      let uploadResult;
      if (useMultipart) {
        uploadResult = await uploadLargeFile(
          variant.buffer,
          bucketName,
          variantPath,
          variantMimeType,
          { metadata }
        );
      } else {
        uploadResult = await uploadFile(
          variant.buffer,
          bucketName,
          variantPath,
          variantMimeType,
          metadata
        );
      }

      const variantResult = {
        size: variant.size,
        key: uploadResult.key,
        url: uploadResult.url,
        width: variant.width,
        height: variant.height,
        format: variant.format,
      };

      uploadResults.variants.push(variantResult);

      if (variant.size === 'thumbnail') {
        uploadResults.thumbnail = variantResult;
      } else if (variant.size === 'medium') {
        uploadResults.medium = variantResult;
      } else if (variant.size === 'large') {
        uploadResults.large = variantResult;
      } else if (variant.size === 'original') {
        uploadResults.original = variantResult;
      }
    }

    return uploadResults;
  } catch (error) {
    throw new CustomError(
      `Image upload with variants failed: ${error.message}`,
      error.statusCode || 500
    );
  }
};

const smartUpload = async (file, bucketName, filePath, contentType, options = {}) => {
  const {
    multipartThreshold = 10 * 1024 * 1024,
    processImage: shouldProcess = true,
    ...uploadOptions
  } = options;

  if (isImageType(contentType) && shouldProcess && Buffer.isBuffer(file)) {
    return await uploadImageWithVariants(
      file,
      bucketName,
      filePath,
      contentType,
      {
        ...uploadOptions,
        multipartThreshold,
        processImage: true,
      }
    );
  }

  // For non-images or when processing is disabled, use standard upload
  // Determine file size
  let fileSize = 0;
  if (Buffer.isBuffer(file)) {
    fileSize = file.length;
  } else if (typeof file === 'string') {
    fileSize = multipartThreshold + 1; // Default to multipart for file paths
  } else {
    fileSize = multipartThreshold + 1;
  }

  if (fileSize >= multipartThreshold) {
    return await uploadLargeFile(file, bucketName, filePath, contentType, uploadOptions);
  } else {
    return await uploadFile(file, bucketName, filePath, contentType, uploadOptions.metadata || {});
  }
};


/**
 * Generate a unique file path with timestamp and random string
 * @param {string} originalFileName - Original name of the file
 * @param {string} folder - Optional folder path (e.g., 'products', 'users')
 * @param {string} sizePrefix - Optional size prefix (e.g., 'thumb_', 'medium_', 'large_')
 * @returns {string} Unique file path
 */
const generateFilePath = (originalFileName, folder = '', sizePrefix = '') => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = originalFileName.split('.').pop();
  const baseFileName = `${timestamp}-${randomString}`;
  const fileName = sizePrefix 
    ? `${sizePrefix}${baseFileName}.${fileExtension}` 
    : `${baseFileName}.${fileExtension}`;
  
  return folder ? `${folder}/${fileName}` : fileName;
};

module.exports = {
  uploadFile,
  uploadLargeFile,
  smartUpload,
  uploadImageWithVariants,
  generateFilePath,
  s3Client,
};

