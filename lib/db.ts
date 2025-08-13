// lib/db.ts
import mysql, { RowDataPacket } from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

export async function query(sql: string, values?: any[]): Promise<RowDataPacket[]> {
  const [rows] = await pool.execute(sql, values);
  return rows as RowDataPacket[];
}

// El resto del archivo (creación de tabla) permanece igual. Ejecuta la creación de tabla manualmente en tu MySQL.