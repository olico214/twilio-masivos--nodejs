import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


export async function executeQuery({ query, values = [] }: { query: string; values?: any[] }) {
    try {
        const [results] = await pool.execute(query, values);
        return results;
    } catch (error: any) {
        throw new Error(error.message);
    }
}