import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";
interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params; // userId
        const body = await req.json();
        const { clients, categoryIds } = body;
        // clients = [{name: 'Juan', phone: '521...'}, ...]
        // categoryIds = [1, 3]

        if (!Array.isArray(clients) || clients.length === 0) {
            return NextResponse.json({ message: "No hay datos para importar" }, { status: 400 });
        }

        let successCount = 0;
        let errorCount = 0;

        // Procesamos en paralelo (o podrías hacer un INSERT masivo si prefieres)
        // Usamos un bucle para manejar las relaciones de categorías individualmente de forma segura
        await Promise.all(clients.map(async (client: any) => {
            try {
                // 1. Insertar Cliente (Ignorar si el teléfono ya existe para evitar duplicados estrictos si tu DB lo tiene configurado)
                // Usamos INSERT normal.
                const res: any = await executeQuery({
                    query: "INSERT INTO clients (userId, name, phone) VALUES (?, ?, ?)",
                    values: [id, client.name, client.phone]
                });

                const newClientId = res.insertId;

                // 2. Asignar Categorías (Si se seleccionaron)
                if (categoryIds && categoryIds.length > 0) {
                    const placeholders = categoryIds.map(() => "(?, ?)").join(", ");
                    const values = categoryIds.flatMap((catId: number) => [newClientId, catId]);

                    await executeQuery({
                        query: `INSERT INTO client_categories (clientId, categoryId) VALUES ${placeholders}`,
                        values: values
                    });
                }
                successCount++;
            } catch (err) {
                console.error("Error importando fila:", client, err);
                errorCount++;
            }
        }));

        return NextResponse.json({
            message: "Importación finalizada",
            stats: { success: successCount, errors: errorCount }
        });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}