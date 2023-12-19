// Copyright (c) Meta Platforms, Inc. and affiliates.
// All rights reserved.

// This source code is licensed under the license found in the
// LICENSE file in the root directory of this source tree.
import { deflate, inflate } from "pako";
// Convert the onnx model mask prediction to ImageData
export function arrayToImageData(input: any, width: number, height: number) {
	const [r, g, b, a] = [0, 114, 189, 255]; // the masks's blue color
	const arr = new Uint8ClampedArray(4 * width * height).fill(0);
	for (let i = 0; i < input.length; i++) {
		// Threshold the onnx model mask prediction at 0.0
		// This is equivalent to thresholding the mask using predictor.model.mask_threshold
		// in python
		if (input[i] > 0.0) {
			arr[4 * i + 0] = r;
			arr[4 * i + 1] = g;
			arr[4 * i + 2] = b;
			arr[4 * i + 3] = a;
		}
	}
	return new ImageData(arr, height, width);
}

// Use a Canvas element to produce an image from ImageData
export function imageDataToImage(imageData: ImageData) {
	const canvas = imageDataToCanvas(imageData);
	const image = new Image();
	image.src = canvas.toDataURL();
	return image;
}

// Canvas elements can be created from ImageData
function imageDataToCanvas(imageData: ImageData) {
	const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	canvas.width = imageData.width;
	canvas.height = imageData.height;
	ctx?.putImageData(imageData, 0, 0);
	return canvas;
}

// Convert the onnx model mask output to an HTMLImageElement
export function onnxMaskToImage(input: any, width: number, height: number) {
	return imageDataToImage(arrayToImageData(input, width, height));
}
function arrayToBase64(byteArray) {
	let binaryString = "";
	for (let i = 0; i < byteArray.byteLength; i++) {
		binaryString += String.fromCharCode(byteArray[i]);
	}
	return btoa(binaryString);
}

function toBase64(compressedData) {
	return btoa(String.fromCharCode.apply(null, new Uint8Array(compressedData)));
}

function fromBase64(base64String) {
	const binaryString = atob(base64String);
	const bytes = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

// Assuming you have the pako library included
function compressString(str) {
	return deflate(str);
}
function rleCompress(str) {
	let compressed = "";
	let count = 1;
	for (let i = 0; i < str.length; i++) {
		if (str[i] === str[i + 1]) {
			count++;
		} else {
			// Use a delimiter (e.g., "|") between the character and the count
			compressed += str[i] + "|" + count + "|";
			count = 1;
		}
	}
	return compressed;
}

export function compressor(byteArray) {
	// Apply RLE Compression
	const base64String = arrayToBase64(byteArray);
	const rleCompressed = rleCompress(base64String);
	const compressed = compressString(rleCompressed);
	const base64Compressed = toBase64(compressed);
	return base64Compressed;
}

function rleDecompress(compressed) {
	let decompressed = "";
	// Split the compressed string at the delimiters
	const parts = compressed.split("|");

	// Iterate through the parts array in steps of 2 (character, count)
	for (let i = 0; i < parts.length - 1; i += 2) {
		const character = parts[i];
		const count = parseInt(parts[i + 1], 10);
		decompressed += character.repeat(count);
	}

	return decompressed;
}

function decompressString(str) {
	const buffer = base64ToArray(str);
	return inflate(buffer, { to: "string" });
}
// Converts a Base64 string back to a Uint8ClampedArray
function base64ToArray(base64String) {
	const binaryString = atob(base64String);
	const length = binaryString.length;
	const bytes = new Uint8ClampedArray(length);
	for (let i = 0; i < length; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

export function decompressor(base64Compressed) {
	// Decompress the Base64 String
	const rleCompressed = decompressString(base64Compressed);
	// Apply RLE Decompression
	const base64String = rleDecompress(rleCompressed);
	// Convert from Base64 to ByteArray
	const byteArray = base64ToArray(base64String);

	return byteArray;
}
