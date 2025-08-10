import { Database } from 'bun:sqlite';

const dbPath = process.env.DB_PATH || '/app/db.sqlite';
const db = new Database(dbPath, { readonly: true });

export function runQuery(sql: string, maxRows = 1000, timeoutMs = 5000) {
  const start = Date.now();
  
  return new Promise<{ columns: string[], rows: any[], rowCount: number, elapsedMs: number, error: string | null }>((resolve) => {
    try {
      const timer = setTimeout(() => {
        resolve({ columns: [], rows: [], rowCount: 0, elapsedMs: timeoutMs, error: 'Query timeout' });
      }, timeoutMs);
      const result = db.query(sql).all();
      const columns = result.length > 0 ? Object.keys(result[0]) : [];
      const rows = result.map(row => Object.values(row));
      const rowCount = rows.length;

      clearTimeout(timer);
      
      if (rowCount > maxRows) {
        resolve({ 
          columns, 
          rows: rows.slice(0, maxRows), 
          rowCount: maxRows, 
          elapsedMs: Date.now() - start, 
          error: `Row limit (${maxRows}) exceeded` 
        });
      } else {
        resolve({ 
          columns, 
          rows, 
          rowCount, 
          elapsedMs: Date.now() - start, 
          error: null 
        });
      }
    } catch (err: any) {
      resolve({ columns: [], rows: [], rowCount: 0, elapsedMs: Date.now() - start, error: err.message });
    }
  });
}