import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// This route serves static game files from /public/games/
// Needed because Next.js standalone mode doesn't automatically serve
// static files from subdirectories when accessed via route-like paths

export const dynamic = 'force-dynamic';

// Determine MIME type based on file extension
function getMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'woff': 'font/woff',
        'woff2': 'font/woff2',
        'ttf': 'font/ttf',
        'mp3': 'audio/mpeg',
        'wav': 'audio/wav',
        'ogg': 'audio/ogg',
        'webp': 'image/webp',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const { path } = await params;
    const pathSegments = path || [];

    // If no path segments or just the game name, serve index.html
    let filePath: string;
    if (pathSegments.length === 1) {
        filePath = join(process.cwd(), 'public', 'games', pathSegments[0], 'index.html');
    } else {
        filePath = join(process.cwd(), 'public', 'games', ...pathSegments);
    }

    // Security: Prevent directory traversal
    const normalizedPath = join(process.cwd(), 'public', 'games');
    if (!filePath.startsWith(normalizedPath)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
        // If file doesn't exist, try with index.html
        const indexPath = join(filePath, 'index.html');
        if (existsSync(indexPath)) {
            filePath = indexPath;
        } else {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }
    }

    try {
        const fileContent = await readFile(filePath);
        const mimeType = getMimeType(filePath);

        return new NextResponse(fileContent, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving game file:', error);
        return NextResponse.json({ error: 'Failed to read file' }, { status: 500 });
    }
}
