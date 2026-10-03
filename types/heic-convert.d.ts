declare module 'heic-convert' {
    // heic-convert is an untyped CommonJS module; it converts a HEIC buffer
    // to another image format and resolves with the encoded bytes.
    function convert(options: {
        buffer: ArrayBuffer | Uint8Array;
        format: string;
        quality?: number;
    }): Promise<Uint8Array<ArrayBuffer>>;
    export default convert;
}
