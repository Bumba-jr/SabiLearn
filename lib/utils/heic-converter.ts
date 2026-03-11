/**
 * HEIC to JPEG conversion utility
 * Converts Apple's HEIC/HEIF image format to browser-compatible JPEG
 */

import convert from 'heic-convert';

/**
 * Checks if a file is in HEIC/HEIF format
 */
export function isHeicFile(file: File): boolean {
    const fileName = file.name.toLowerCase();
    const isHeicExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif');

    // Check MIME type as well (though browsers may report it inconsistently)
    const isHeicMime = file.type.includes('heic') || file.type.includes('heif');

    return isHeicExtension || isHeicMime;
}

/**
 * Converts a HEIC/HEIF file to JPEG format
 * @param file - The HEIC file to convert
 * @returns A new File object containing the JPEG data
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
    try {
        console.log('🔄 Converting HEIC to JPEG:', file.name);

        // Read the file as ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const inputBuffer = Buffer.from(arrayBuffer);

        console.log('📦 Input buffer size:', inputBuffer.length, 'bytes');

        // Convert HEIC to JPEG
        const outputBuffer = await convert({
            buffer: inputBuffer,
            format: 'JPEG',
            quality: 0.9, // 90% quality - good balance between size and quality
        });

        console.log('✅ Conversion successful. Output size:', outputBuffer.length, 'bytes');

        // Create a new File object with JPEG data
        const jpegBlob = new Blob([outputBuffer], { type: 'image/jpeg' });
        const originalName = file.name.replace(/\.(heic|heif)$/i, '');
        const jpegFileName = `${originalName}.jpg`;

        const jpegFile = new File([jpegBlob], jpegFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });

        console.log('📸 Created JPEG file:', jpegFileName, 'Size:', jpegFile.size, 'bytes');

        return jpegFile;
    } catch (error) {
        console.error('❌ HEIC conversion failed:', error);
        throw new Error(
            `Failed to convert HEIC image: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
    }
}

/**
 * Converts a file to JPEG if it's in HEIC format, otherwise returns the original file
 * @param file - The file to potentially convert
 * @returns The converted JPEG file or the original file
 */
export async function convertHeicIfNeeded(file: File): Promise<File> {
    if (isHeicFile(file)) {
        console.log('🔍 HEIC file detected, converting to JPEG...');
        return await convertHeicToJpeg(file);
    }

    console.log('✅ File is not HEIC, no conversion needed');
    return file;
}
