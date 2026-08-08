import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getAssetDir } from '@/lib/paths';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const assetDir = getAssetDir();
    const filePath = path.join(assetDir, filename);

    // Prevent directory traversal
    const relative = path.relative(assetDir, filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.mp4') contentType = 'video/mp4';
    else if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.txt') contentType = 'text/plain';

    const forceDownload = request.nextUrl.searchParams.get('download') === '1';
    const dispositionType = forceDownload || ext === '.pdf' || ext === '.txt' ? 'attachment' : 'inline';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `${dispositionType}; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('Error serving asset:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
