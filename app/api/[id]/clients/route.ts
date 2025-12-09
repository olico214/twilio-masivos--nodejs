import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// --- GET: Traer clientes con sus categorías ---
export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // Query compleja para traer categorías agrupadas
        const sql = `
            SELECT 
                c.id, c.name, c.phone,
                GROUP_CONCAT(cat.id) as categoryIds,
                GROUP_CONCAT(cat.name SEPARATOR ', ') as categoryNames
            FROM clients c
            LEFT JOIN client_categories cc ON c.id = cc.clientId
            LEFT JOIN categories cat ON cc.categoryId = cat.id
            WHERE c.userId = ?
            GROUP BY c.id
            ORDER BY c.id DESC
        `;

        const results: any = await executeQuery({ query: sql, values: [id] });

        // Formateamos para que categoryIds sea un array real en el JSON
        const clients = results.map((client: any) => ({
            ...client,
            categoryIds: client.categoryIds ? client.categoryIds.split(',').map(Number) : [],
            categoryNames: client.categoryNames || ''
        }));

        return NextResponse.json(clients);
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

// --- POST: Crear Cliente y asignar categorías ---
export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params; // userId
        const body = await req.json();
        const { name, phone, categoryIds } = body; // categoryIds es un array ej: [1, 3]

        if (!name) return NextResponse.json({ message: "Nombre requerido" }, { status: 400 });

        // 1. Insertar Cliente
        const resultClient: any = await executeQuery({
            query: "INSERT INTO clients (userId, name, phone) VALUES (?, ?, ?)",
            values: [id, name, phone]
        });

        const newClientId = resultClient.insertId;

        // 2. Insertar Categorías en la tabla intermedia (si hay seleccionadas)
        if (categoryIds && categoryIds.length > 0) {
            // Generamos placeholders (?, ?), (?, ?) dinámicamente
            const placeholders = categoryIds.map(() => "(?, ?)").join(", ");
            const values = categoryIds.flatMap((catId: number) => [newClientId, catId]);

            await executeQuery({
                query: `INSERT INTO client_categories (clientId, categoryId) VALUES ${placeholders}`,
                values: values
            });
        }

        return NextResponse.json({ message: "Cliente creado" }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}