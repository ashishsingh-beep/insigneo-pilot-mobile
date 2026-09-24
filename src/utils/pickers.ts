// ---------------------------------------------------------------------------
// Camera / photo library / document picking, shared by the chat composer and
// the project knowledge screen. Validates type and size the same way the web
// app does before anything is uploaded.
// ---------------------------------------------------------------------------

import { launchCamera, launchImageLibrary, type Asset, type PhotoQuality } from 'react-native-image-picker';
import { errorCodes, isErrorWithCode, pick, types } from '@react-native-documents/picker';
import { MAX_DOCUMENT_BYTES, MAX_IMAGE_BYTES } from '../config';
import { formatBytes, isAttachable, isImageUpload, mimeTypeOf } from './files';

export type PickedFile = {
  uri: string;
  name: string;
  type: string;
  size: number | null;
  isImage: boolean;
};

type Candidate = { uri: string; name: string; type: string | null; size: number | null };

export type PickResult = { files: PickedFile[]; error: string | null };

const SUPPORTED_MESSAGE =
  "can't be uploaded. Supported formats are PDF, Word (.docx), Excel (.xlsx), PowerPoint (.pptx), CSV, TXT, and images (PNG, JPG, GIF, WEBP).";

function validate(candidates: Candidate[]): PickResult {
  const files: PickedFile[] = [];
  let error: string | null = null;
  for (const c of candidates) {
    if (!isAttachable(c.name, c.type)) {
      error = `${c.name} ${SUPPORTED_MESSAGE}`;
      continue;
    }
    const image = isImageUpload(c.name, c.type);
    const limit = image ? MAX_IMAGE_BYTES : MAX_DOCUMENT_BYTES;
    if (c.size != null && c.size > limit) {
      error = `${c.name} is too large — ${image ? 'images' : 'files'} must be under ${formatBytes(limit)}.`;
      continue;
    }
    files.push({ uri: c.uri, name: c.name, type: c.type || mimeTypeOf(c.name), size: c.size, isImage: image });
  }
  return { files, error };
}

function fromImageAssets(assets: Asset[] | undefined): Candidate[] {
  return (assets || [])
    .filter((a) => a.uri)
    .map((a, i) => ({
      uri: a.uri!,
      name: a.fileName || `photo_${Date.now()}_${i}.jpg`,
      type: a.type || 'image/jpeg',
      size: a.fileSize ?? null,
    }));
}

// Phone photos are large; the backend downsizes to 1568px anyway, so a
// smaller upload loses nothing and saves the user's data.
const IMAGE_OPTIONS = { mediaType: 'photo' as const, maxWidth: 2048, maxHeight: 2048, quality: 0.8 as PhotoQuality };

export async function pickFromCamera(): Promise<PickResult> {
  const res = await launchCamera({ ...IMAGE_OPTIONS, saveToPhotos: false });
  if (res.errorCode) return { files: [], error: res.errorMessage || 'Could not open the camera.' };
  return validate(fromImageAssets(res.assets));
}

export async function pickFromPhotos(): Promise<PickResult> {
  const res = await launchImageLibrary({ ...IMAGE_OPTIONS, selectionLimit: 0 });
  if (res.errorCode) return { files: [], error: res.errorMessage || 'Could not open your photos.' };
  return validate(fromImageAssets(res.assets));
}

export async function pickDocuments(): Promise<PickResult> {
  try {
    const picked = await pick({
      allowMultiSelection: true,
      type: [types.pdf, types.docx, types.xlsx, types.pptx, types.csv, types.plainText, types.images],
    });
    return validate(picked.map((f) => ({ uri: f.uri, name: f.name || 'file', type: f.type, size: f.size })));
  } catch (err) {
    if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) return { files: [], error: null };
    return { files: [], error: 'Could not open the file picker.' };
  }
}
