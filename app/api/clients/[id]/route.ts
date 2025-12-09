import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";

// Definimos el tipo para los params de la URL
interface RouteParams {
    params: {
        id: string;
    };
}



export async function PUT(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { name, phone, categoryIds } = body;

        // 1. Validaciones de seguridad
        if (isNaN(id)) {
            return NextResponse.json({ message: "ID de cliente inválido" }, { status: 400 });
        }

        // 2. Verificar que el cliente EXISTA antes de intentar nada
        const checkClient: any = await executeQuery({
            query: "SELECT id FROM clients WHERE id = ?",
            values: [id]
        });

        if (checkClient.length === 0) {
            return NextResponse.json({ message: "El cliente no existe en la base de datos" }, { status: 404 });
        }

        // 3. Actualizar datos básicos
        await executeQuery({
            query: "UPDATE clients SET name = ?, phone = ? WHERE id = ?",
            values: [name, phone, id]
        });

        // 4. Actualizar Categorías
        // Paso A: Limpiar relaciones anteriores
        await executeQuery({
            query: "DELETE FROM client_categories WHERE clientId = ?",
            values: [id]
        });

        // Paso B: Insertar nuevas (Solo si hay IDs válidos)
        if (Array.isArray(categoryIds) && categoryIds.length > 0) {

            // Asegurarnos de que todos los IDs de categorías sean números puros
            const cleanCategoryIds = categoryIds.map(c => Number(c)).filter(n => !isNaN(n) && n > 0);

            if (cleanCategoryIds.length > 0) {
                // Generar placeholders: (?, ?), (?, ?)
                const placeholders = cleanCategoryIds.map(() => "(?, ?)").join(", ");

                // Generar valores planos: [clientId, cat1, clientId, cat2]
                const values = cleanCategoryIds.flatMap((catId) => [id, catId]);

                console.log("Insertando relaciones:", values);

                await executeQuery({
                    query: `INSERT INTO client_categories (clientId, categoryId) VALUES ${placeholders}`,
                    values: values
                });
            }
        }

        return NextResponse.json({ message: "Cliente actualizado correctamente" });

    } catch (error: any) {
        console.error("ERROR CRÍTICO EN PUT:", error);
        return NextResponse.json({
            message: "Error de base de datos",
            error: error.message
        }, { status: 500 });
    }
}
// --- DELETE: Eliminar Cliente ---
export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        // Al borrar el cliente, MySQL borrará automáticamente las relaciones en client_categories
        // gracias al ON DELETE CASCADE definido en la tabla.
        await executeQuery({
            query: "DELETE FROM clients WHERE id = ?",
            values: [id]
        });

        return NextResponse.json({ message: "Cliente eliminado" });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}