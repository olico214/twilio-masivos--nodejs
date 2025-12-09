import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";

interface RouteParams {
    params: Promise<{ id: string }>;
}


// --- PUT: Editar categoría ---
export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name } = body;

        await executeQuery({
            query: "UPDATE categories SET name = ? WHERE id = ?",
            values: [name, id],
        });

        return NextResponse.json({ message: "Categoría actualizada" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- DELETE: Eliminar categoría ---
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        await executeQuery({
            query: "DELETE FROM categories WHERE id = ?",
            values: [id],
        });

        return NextResponse.json({ message: "Categoría eliminada" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}