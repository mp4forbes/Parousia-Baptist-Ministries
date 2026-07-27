import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { checkAdminAuth } from '@/lib/actions';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify Authentication
    const isAuthed = await checkAdminAuth();
    if (!isAuthed) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Multipart FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const assetDir = '/Users/mpforbes/GoogleCloud/Straight-Line-Churches/Parousie/assets';
    if (!fs.existsSync(assetDir)) {
      fs.mkdirSync(assetDir, { recursive: true });
    }

    // Generate a secure unique name using date and clean extension
    const ext = path.extname(file.name) || '.png';
    const base = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_]/g, '_');
    const cleanName = `${base}_${Date.now()}${ext}`;
    const filePath = path.join(assetDir, cleanName);

    fs.writeFileSync(filePath, buffer);

    // Return relative API path that Next.js will stream
    return NextResponse.json({ success: true, url: `/api/assets/${cleanName}` });
  } catch (error: any) {
    console.error('Error uploading asset:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
