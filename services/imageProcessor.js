/**
 * Image Processing Service
 * Handles image processing using Sharp library
 * Supports resizing, optimization, format conversion, and variant generation
 */
const sharp = require('sharp');
const CustomError = require('../utils/customError');

/**
 * Check if content type is an image
 * @param {string} contentType - MIME type
 * @returns {boolean} True if image type
 */
const isImageType = (contentType) => {
  return contentType && contentType.startsWith('image/');
};

/**
 * Get output format based on options and original format
 * @param {string} originalFormat - Original image format
 * @param {string} formatOption - Format option ('webp', 'original', 'auto')
 * @returns {string} Output format
 */
const getOutputFormat = (originalFormat, formatOption = 'webp') => {
  if (formatOption === 'original') {
    return originalFormat;
  }
  if (formatOption === 'webp' || formatOption === 'auto') {
    // Convert to WebP for better compression, except for GIF (keep animated)
    return originalFormat === 'gif' ? 'gif' : 'webp';
  }
  return formatOption;
};

/**
 * Get MIME type for format
 * @param {string} format - Image format
 * @returns {string} MIME type
 */
const getMimeType = (format) => {
  const mimeTypes = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    avif: 'image/avif',
    tiff: 'image/tiff',
  };
  return mimeTypes[format.toLowerCase()] || 'image/jpeg';
};

/**
 * Process a single image with Sharp
 * @param {Buffer|Stream} imageBuffer - Image buffer or stream
 * @param {Object} options - Processing options
 * @param {number} options.width - Target width
 * @param {number} options.height - Target height
 * @param {string} options.format - Output format ('webp', 'jpeg', 'png', etc.)
 * @param {number} options.quality - Quality (1-100, default: 85 for JPEG, 80 for WebP)
 * @param {boolean} options.optimize - Enable optimization (default: true)
 * @returns {Promise<Buffer>} Processed image buffer
 */
const processImage = async (imageBuffer, options = {}) => {
  try {
    const {
      width,
      height,
      format = 'webp',
      quality = format === 'webp' ? 80 : 85,
      optimize = true,
    } = options;

    let sharpInstance = sharp(imageBuffer);

    // Resize if dimensions provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Set format and quality
    const formatOptions = {};
    
    if (format === 'jpeg' || format === 'jpg') {
      formatOptions.quality = quality;
      if (optimize) {
        formatOptions.mozjpeg = true; // Use mozjpeg for better compression
      }
      sharpInstance = sharpInstance.jpeg(formatOptions);
    } else if (format === 'png') {
      if (optimize) {
        formatOptions.compressionLevel = 9;
        formatOptions.palette = true; // Use palette for better compression
      }
      sharpInstance = sharpInstance.png(formatOptions);
    } else if (format === 'webp') {
      formatOptions.quality = quality;
      if (optimize) {
        formatOptions.effort = 6; // Higher effort for better compression
      }
      sharpInstance = sharpInstance.webp(formatOptions);
    } else if (format === 'gif') {
      sharpInstance = sharpInstance.gif();
    } else {
      // Default to WebP
      formatOptions.quality = quality;
      sharpInstance = sharpInstance.webp(formatOptions);
    }

    return await sharpInstance.toBuffer();
  } catch (error) {
    throw new CustomError(
      `Image processing failed: ${error.message}`,
      500
    );
  }
};

/**
 * Generate multiple image variants (thumbnail, medium, large, original)
 * @param {Buffer|Stream} imageBuffer - Original image buffer
 * @param {Object} options - Processing options
 * @param {Object} options.sizes - Custom size definitions
 * @param {string} options.format - Output format ('webp', 'original', 'auto')
 * @param {number} options.quality - Quality setting
 * @param {boolean} options.optimize - Enable optimization
 * @returns {Promise<Array>} Array of processed images with metadata
 */
const generateImageVariants = async (imageBuffer, options = {}) => {
  try {
    const {
      sizes = {
        thumbnail: { width: 200, height: 200 },
        medium: { width: 800, height: 800 },
        large: { width: 1200, height: 1200 },
        original: { width: 2000, height: 2000 },
      },
      format = 'webp',
      quality = 85,
      optimize = true,
    } = options;

    // Get original image metadata
    const metadata = await sharp(imageBuffer).metadata();
    const originalFormat = metadata.format || 'jpeg';
    const outputFormat = getOutputFormat(originalFormat, format);

    const variants = [];

    // Process thumbnail
    if (sizes.thumbnail) {
      const thumbnailBuffer = await processImage(imageBuffer, {
        width: sizes.thumbnail.width,
        height: sizes.thumbnail.height,
        format: outputFormat,
        quality,
        optimize,
      });
      variants.push({
        size: 'thumbnail',
        buffer: thumbnailBuffer,
        width: sizes.thumbnail.width,
        height: sizes.thumbnail.height,
        format: outputFormat,
      });
    }

    // Process medium
    if (sizes.medium) {
      const mediumBuffer = await processImage(imageBuffer, {
        width: sizes.medium.width,
        height: sizes.medium.height,
        format: outputFormat,
        quality,
        optimize,
      });
      variants.push({
        size: 'medium',
        buffer: mediumBuffer,
        width: sizes.medium.width,
        height: sizes.medium.height,
        format: outputFormat,
      });
    }

    // Process large
    if (sizes.large) {
      const largeBuffer = await processImage(imageBuffer, {
        width: sizes.large.width,
        height: sizes.large.height,
        format: outputFormat,
        quality,
        optimize,
      });
      variants.push({
        size: 'large',
        buffer: largeBuffer,
        width: sizes.large.width,
        height: sizes.large.height,
        format: outputFormat,
      });
    }

    // Process optimized original
    if (sizes.original) {
      const originalBuffer = await processImage(imageBuffer, {
        width: sizes.original.width,
        height: sizes.original.height,
        format: outputFormat,
        quality,
        optimize,
      });
      variants.push({
        size: 'original',
        buffer: originalBuffer,
        width: sizes.original.width,
        height: sizes.original.height,
        format: outputFormat,
      });
    }

    return variants;
  } catch (error) {
    throw new CustomError(
      `Failed to generate image variants: ${error.message}`,
      500
    );
  }
};

module.exports = {
  isImageType,
  getOutputFormat,
  getMimeType,
  processImage,
  generateImageVariants,
};

