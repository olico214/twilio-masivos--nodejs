import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";
import twilio from "twilio";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        // Nota: El uso de 'await params' es correcto para Next.js 15+
        const { id } = await params;
        const body = await req.json();

        const { name, category, language, text } = body;

        if (!name || !category || !text) {
            return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 });
        }

        const configResult: any = await executeQuery({
            query: "SELECT accountSid, authToken FROM user_config WHERE userId = ?",
            values: [id]
        });

        if (configResult.length === 0) {
            return NextResponse.json({ message: "Credenciales no configuradas" }, { status: 404 });
        }

        const { accountSid, authToken } = configResult[0];
        const client = twilio(accountSid, authToken);

        // --- BLOQUE CORREGIDO ---
        const content = await client.content.v1.contents.create({
            friendlyName: name,
            language: language || 'es',
            variables: {},
            types: {
                "twilio/text": {
                    body: text
                }
            } as any
        });
        // ------------------------

        console.log("Template creado (Draft):", content.sid);

        return NextResponse.json({
            message: "Plantilla creada y enviada a revisión",
            sid: content.sid,
            status: "pending"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error Twilio:", error);
        return NextResponse.json({ message: error.message || "Error al crear plantilla" }, { status: 500 });
    }
}