import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";
import twilio from "twilio";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 1. Obtener credenciales de Twilio desde tu BD MySQL
        const configResult: any = await executeQuery({
            query: "SELECT accountSid, authToken FROM user_config WHERE userId = ?",
            values: [id]
        });

        if (configResult.length === 0) {
            return NextResponse.json(
                { message: "No se encontró configuración de Twilio para este usuario." },
                { status: 404 }
            );
        }

        const { accountSid, authToken } = configResult[0];

        // 2. Conectar con Twilio
        const client = twilio(accountSid, authToken);

        // 3. Obtener Templates (Usando Content API)
        // La Content API es el nuevo estándar para manejar templates de WhatsApp
        const contents = await client.content.v1.contents.list({
            limit: 20 // Traemos los últimos 20
        });

        // 4. Formatear la data para el frontend
        // Twilio devuelve mucha info técnica, simplificamos:
        const templates = contents.map((c: any) => {
            // Intentamos extraer el cuerpo del mensaje de las variables
            const body = c.types?.['twilio/text']?.body ||
                c.types?.['twilio/media']?.body ||
                "Plantilla compleja (Media/Buttons)";

            return {
                sid: c.sid,
                friendlyName: c.friendlyName,
                language: c.language,
                variables: c.variables,
                body: body,
                types: Object.keys(c.types) // Ej: twilio/text, twilio/quick-reply
            };
        });

        return NextResponse.json(templates);

    } catch (error: any) {
        console.error("Error Twilio:", error);

        // Manejo de error específico de credenciales
        if (error.code === 20404 || error.status === 401) {
            return NextResponse.json(
                { message: "Credenciales de Twilio inválidas o expiradas." },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { message: "Error al obtener templates de Twilio", error: error.message },
            { status: 500 }
        );
    }
}



export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        // 1. Obtener el ID del template (templateSid) del cuerpo de la petición
        const body = await req.json();
        const { templateSid } = body;

        if (!templateSid) {
            return NextResponse.json(
                { message: "Es necesario proporcionar el templateSid." },
                { status: 400 }
            );
        }

        // 2. Obtener credenciales de Twilio desde tu BD MySQL (Igual que en el GET)
        const configResult: any = await executeQuery({
            query: "SELECT accountSid, authToken FROM user_config WHERE userId = ?",
            values: [id]
        });

        if (configResult.length === 0) {
            return NextResponse.json(
                { message: "No se encontró configuración de Twilio para este usuario." },
                { status: 404 }
            );
        }

        const { accountSid, authToken } = configResult[0];

        // 3. Conectar con Twilio
        const client = twilio(accountSid, authToken);

        // 4. Eliminar el Template en Twilio
        // Usamos .remove() pasando el SID del contenido
        await client.content.v1.contents(templateSid).remove();

        return NextResponse.json({
            success: true,
            message: "Proyecto eliminado correctamente de Twilio."
        });

    } catch (error: any) {
        console.error("Error Twilio DELETE:", error);

        // Manejo de error si el template no existe o ya fue borrado (404 en Twilio)
        if (error.code === 20404 || error.status === 404) {
            return NextResponse.json(
                { message: "El template no existe o ya fue eliminado." },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { message: "Error al eliminar el template de Twilio", error: error.message },
            { status: 500 }
        );
    }
}