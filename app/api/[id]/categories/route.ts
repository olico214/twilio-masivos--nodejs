import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";
interface RouteParams {
    params: Promise<{ id: string }>;
}

// --- GET: Obtener todas las categorías de un usuario ---
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params; // userId

        const result = await executeQuery({
            query: "SELECT * FROM categories WHERE userId = ? ORDER BY id DESC",
            values: [id],
        });

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- POST: Crear nueva categoría ---
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params; // userId obtenido de la URL
        const body = await req.json();
        const { name } = body;

        if (!name) {
            return NextResponse.json({ message: "El nombre es obligatorio" }, { status: 400 });
        }

        const result: any = await executeQuery({
            query: "INSERT INTO categories (userId, name) VALUES (?, ?)",
            values: [id, name],
        });

        // Devolvemos el objeto creado con su nuevo ID
        return NextResponse.json({
            id: result.insertId,
            name,
            userId: id
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}