import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { getAssetDir } from './paths';

const BORDER_COLOR = 'FF94A3B8';
const OUTER_BORDER_COLOR = 'FF1E3A5F';

const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD9E8F5' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 11,
  color: { argb: 'FF1E3A5F' },
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  bold: true,
  size: 16,
  color: { argb: 'FF1E3A5F' },
};

const SUBTITLE_FONT: Partial<ExcelJS.Font> = {
  size: 11,
  color: { argb: 'FF475569' },
};

function thinBorder(): Partial<ExcelJS.Border> {
  return { style: 'thin', color: { argb: BORDER_COLOR } };
}

function mediumBorder(): Partial<ExcelJS.Border> {
  return { style: 'medium', color: { argb: OUTER_BORDER_COLOR } };
}

function allThinBorders(): Partial<ExcelJS.Borders> {
  const border = thinBorder();
  return {
    top: border,
    left: border,
    bottom: border,
    right: border,
  };
}

function applyOuterReportBorder(
  sheet: ExcelJS.Worksheet,
  topRow: number,
  bottomRow: number,
  leftCol: number,
  rightCol: number
): void {
  for (let row = topRow; row <= bottomRow; row++) {
    for (let col = leftCol; col <= rightCol; col++) {
      const cell = sheet.getCell(row, col);
      const existing = cell.border || {};
      cell.border = {
        top: row === topRow ? mediumBorder() : existing.top || thinBorder(),
        bottom: row === bottomRow ? mediumBorder() : existing.bottom || thinBorder(),
        left: col === leftCol ? mediumBorder() : existing.left || thinBorder(),
        right: col === rightCol ? mediumBorder() : existing.right || thinBorder(),
      };
    }
  }
}

async function resolveLogoImage(logoUrl?: string): Promise<{ buffer: Buffer; extension: 'png' | 'jpeg' } | null> {
  const candidates: string[] = [];
  const url = logoUrl?.trim() || '';

  if (url.includes('/api/assets/')) {
    const filename = decodeURIComponent(url.split('/api/assets/')[1] || '');
    if (filename) {
      candidates.push(path.join(getAssetDir(), filename));
    }
  } else if (url.startsWith('/')) {
    candidates.push(path.join(process.cwd(), 'public', url.slice(1)));
    candidates.push(path.join(process.cwd(), 'src/app', url.slice(1)));
  }

  candidates.push(path.join(process.cwd(), 'src/app/icon.png'));
  candidates.push(path.join(getAssetDir(), 'logo_1779287428274.png'));

  for (const filePath of candidates) {
    if (!fs.existsSync(filePath)) continue;
    const ext = path.extname(filePath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg'].includes(ext)) continue;
    return {
      buffer: fs.readFileSync(filePath),
      extension: ext === '.jpg' || ext === '.jpeg' ? 'jpeg' : 'png',
    };
  }

  return null;
}

export async function buildAdminSpreadsheet(options: {
  sheetTitle: string;
  headers: string[];
  rows: string[][];
  logoUrl?: string;
  sheetName?: string;
}): Promise<Buffer> {
  const { sheetTitle, headers, rows, logoUrl, sheetName = 'Export' } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Parousia Baptist Ministries';
  workbook.created = new Date();

  const lastCol = Math.max(headers.length, 6);
  const headerRowNumber = 5;
  const lastDataRow = headerRowNumber + rows.length;

  const sheet = workbook.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: headerRowNumber }],
  });

  sheet.mergeCells(1, 1, 3, lastCol);
  const headerBlock = sheet.getCell(1, 1);
  headerBlock.value = {
    richText: [
      { text: 'Parousia Baptist Ministries\n', font: TITLE_FONT },
      { text: `${sheetTitle}\n`, font: { bold: true, size: 13, color: { argb: 'FF1E3A5F' } } },
      {
        text: `Exported ${new Date().toLocaleString()} · ${rows.length} record${rows.length === 1 ? '' : 's'}`,
        font: SUBTITLE_FONT,
      },
    ],
  };
  headerBlock.alignment = {
    vertical: 'middle',
    horizontal: 'left',
    wrapText: true,
    indent: 11,
  };
  headerBlock.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF8FBFD' },
  };
  headerBlock.border = allThinBorders();

  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 24;
  sheet.getRow(3).height = 22;

  const logo = await resolveLogoImage(logoUrl);
  if (logo) {
    const imageId = workbook.addImage({
      buffer: logo.buffer as unknown as ExcelJS.Buffer,
      extension: logo.extension,
    });
    sheet.addImage(imageId, {
      tl: { col: 0.2, row: 0.15 },
      ext: { width: 68, height: 68 },
    });
  }

  const headerRow = sheet.getRow(headerRowNumber);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = HEADER_FONT;
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    cell.border = allThinBorders();
  });
  headerRow.height = 22;

  rows.forEach((rowValues, rowIndex) => {
    const row = sheet.getRow(headerRowNumber + 1 + rowIndex);
    rowValues.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.alignment = { vertical: 'top', wrapText: true };
      cell.border = allThinBorders();
      if (rowIndex % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FBFD' },
        };
      }
    });

    for (let col = rowValues.length + 1; col <= lastCol; col++) {
      const cell = row.getCell(col);
      cell.border = allThinBorders();
    }
  });

  for (let col = headers.length + 1; col <= lastCol; col++) {
    const cell = headerRow.getCell(col);
    cell.border = allThinBorders();
    cell.fill = HEADER_FILL;
  }

  applyOuterReportBorder(sheet, 1, lastDataRow, 1, lastCol);

  headers.forEach((header, index) => {
    const column = sheet.getColumn(index + 1);
    const maxDataLength = rows.reduce((max, row) => Math.max(max, (row[index] || '').length), 0);
    column.width = Math.min(48, Math.max(header.length + 2, maxDataLength + 2, 14));
  });

  for (let col = headers.length + 1; col <= lastCol; col++) {
    sheet.getColumn(col).width = 14;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
