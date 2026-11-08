function skipGifSubBlocks(content, initialOffset) {
  let offset = initialOffset;
  while (offset < content.length) {
    const blockLength = content[offset];
    offset += 1;
    if (blockLength === 0) {
      return offset;
    }
    if (offset + blockLength > content.length) {
      throw new Error("truncated data sub-block");
    }
    offset += blockLength;
  }
  throw new Error("unterminated data sub-block");
}

export function gifMetadata(content) {
  if (!Buffer.isBuffer(content) || content.length < 14) {
    throw new Error("file is too short");
  }

  const signature = content.subarray(0, 6).toString("ascii");
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new Error("invalid signature");
  }

  const width = content.readUInt16LE(6);
  const height = content.readUInt16LE(8);
  const logicalScreenPacked = content[10];
  let offset = 13;

  if ((logicalScreenPacked & 0x80) !== 0) {
    offset += 3 * 2 ** ((logicalScreenPacked & 0x07) + 1);
  }

  let durationCentiseconds = 0;
  let frameCount = 0;
  let hasTrailer = false;
  const comments = [];

  while (offset < content.length) {
    const marker = content[offset];
    offset += 1;

    if (marker === 0x3b) {
      hasTrailer = true;
      break;
    }

    if (marker === 0x21) {
      if (offset >= content.length) {
        throw new Error("truncated extension");
      }
      const extensionLabel = content[offset];
      offset += 1;

      if (extensionLabel === 0xf9) {
        if (content[offset] !== 4 || offset + 5 >= content.length) {
          throw new Error("invalid graphic control extension");
        }
        durationCentiseconds += content.readUInt16LE(offset + 2);
        offset += 5;
        if (content[offset] !== 0) {
          throw new Error("unterminated graphic control extension");
        }
        offset += 1;
      } else {
        if (extensionLabel === 0xfe) {
          const chunks = [];
          let cursor = offset;
          while (cursor < content.length && content[cursor] !== 0) {
            const size = content[cursor];
            chunks.push(content.subarray(cursor + 1, cursor + 1 + size));
            cursor += size + 1;
          }
          comments.push(Buffer.concat(chunks).toString("utf8"));
        }
        offset = skipGifSubBlocks(content, offset);
      }
      continue;
    }

    if (marker === 0x2c) {
      if (offset + 9 > content.length) {
        throw new Error("truncated image descriptor");
      }
      const imagePacked = content[offset + 8];
      offset += 9;
      if ((imagePacked & 0x80) !== 0) {
        offset += 3 * 2 ** ((imagePacked & 0x07) + 1);
      }
      if (offset >= content.length) {
        throw new Error("missing image data");
      }
      offset += 1;
      offset = skipGifSubBlocks(content, offset);
      frameCount += 1;
      continue;
    }

    throw new Error(`unexpected block marker 0x${marker.toString(16)}`);
  }

  if (!hasTrailer || frameCount === 0) {
    throw new Error("incomplete animation");
  }

  return {
    width,
    height,
    frameCount,
    durationMs: durationCentiseconds * 10,
    comments,
  };
}
