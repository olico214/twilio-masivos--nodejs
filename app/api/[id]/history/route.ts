import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Obtenemos los últimos 100 envíos ordenados por fecha
        const sql = `
            SELECT 
                id, clientName, phone, templateSid, status, errorMessage, sentAt 
            FROM message_history 
            WHERE userId = ? 
            ORDER BY sentAt DESC 
            LIMIT 100
        `;

        const history = await executeQuery({ query: sql, values: [id] });

        return NextResponse.json(history);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}