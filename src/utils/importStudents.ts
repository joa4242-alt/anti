/**
 * 엑셀(.xlsx) / CSV 파일에서 학생 이름 목록을 뽑아냅니다. (PRD 4장 Excel 업로드)
 * 파일은 브라우저 안에서만 읽으며 서버로 보내지 않습니다.
 */

type Cell = string | number | boolean | Date | null | undefined | object;
type Table = Cell[][];

const HEADER_PATTERN = /^(이름|성명|학생|학생명|학생\s*이름|name|student)$/i;

const cellText = (cell: Cell): string =>
  typeof cell === 'string' ? cell.trim() : typeof cell === 'number' ? String(cell) : '';

// 이름처럼 보이는 칸: 글자이고, 숫자만으로 되어 있지 않고, 너무 길지 않음
const looksLikeName = (text: string) =>
  text.length >= 2 && text.length <= 20 && !/^[\d\s.,\-/]+$/.test(text) && !HEADER_PATTERN.test(text);

/**
 * 표에서 이름 열을 찾아 이름 목록을 반환합니다.
 * 1) 앞쪽 5줄 안에 "이름/성명" 같은 제목이 있으면 그 열을 사용
 * 2) 없으면 이름처럼 보이는 칸이 가장 많은 열을 사용
 */
export const extractNames = (table: Table): string[] => {
  for (let r = 0; r < Math.min(5, table.length); r++) {
    const c = table[r].findIndex((cell) => HEADER_PATTERN.test(cellText(cell)));
    if (c !== -1) {
      return table
        .slice(r + 1)
        .map((row) => cellText(row[c]))
        .filter(looksLikeName);
    }
  }

  const columnCount = Math.max(0, ...table.map((row) => row.length));
  let bestCol = -1;
  let bestCount = 0;
  for (let c = 0; c < columnCount; c++) {
    const count = table.filter((row) => looksLikeName(cellText(row[c]))).length;
    if (count > bestCount) {
      bestCol = c;
      bestCount = count;
    }
  }
  if (bestCol === -1) return [];
  return table.map((row) => cellText(row[bestCol])).filter(looksLikeName);
};

// 따옴표를 지원하는 간단한 CSV 파서
export const parseCsv = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',' || ch === '\t') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

// 한국어 엑셀에서 저장한 CSV는 EUC-KR(CP949)인 경우가 많다
const decodeText = (buffer: ArrayBuffer): string => {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
  } catch {
    return new TextDecoder('euc-kr').decode(buffer);
  }
};

export const readStudentNamesFromFile = async (file: File): Promise<string[]> => {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith('.csv') || lowerName.endsWith('.txt')) {
    return extractNames(parseCsv(decodeText(await file.arrayBuffer())));
  }

  if (lowerName.endsWith('.xlsx')) {
    // 엑셀 라이브러리는 필요할 때만 불러온다 (첫 화면 로딩을 가볍게)
    const { readSheet } = await import('read-excel-file/browser');
    const table = (await readSheet(file)) as Table;
    return extractNames(table);
  }

  if (lowerName.endsWith('.xls')) {
    throw new Error(
      '예전 엑셀 형식(.xls)은 읽을 수 없어요. 엑셀에서 "다른 이름으로 저장" → "Excel 통합 문서(.xlsx)"로 저장한 뒤 다시 올려 주세요.'
    );
  }

  throw new Error('엑셀(.xlsx) 또는 CSV(.csv) 파일만 불러올 수 있어요.');
};
