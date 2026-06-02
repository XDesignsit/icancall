import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'comparison-chart.html');
    const htmlContent = await fs.readFile(filePath, 'utf8');

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
  } catch (error) {
    return new Response('File not found', { status: 404 });
  }
}
