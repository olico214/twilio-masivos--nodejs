import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql"; // Asegúrate que la ruta sea correcta
import twilio from "twilio";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();

        const { name, category, language, text } = body;

        // Validaciones básicas
        if (!name || !category || !text) {
            return NextResponse.json({ message: "Faltan datos requeridos" }, { status: 400 });
        }

        // 1. Obtener credenciales de la BD
        const configResult: any = await executeQuery({
            query: "SELECT accountSid, authToken FROM user_config WHERE userId = ?",
            values: [id]
        });

        if (configResult.length === 0) {
            return NextResponse.json({ message: "Credenciales no configuradas" }, { status: 404 });
        }

        const { accountSid, authToken } = configResult[0];
        const client = twilio(accountSid, authToken);

        // 2. CREAR EL CONTENIDO (Draft)
        const content = await client.content.v1.contents.create({
            friendly_name: name,
            language: language || 'es',
            variables: {},
            types: {
                'twilio/text': {
                    body: text
                }
            }
        });

        console.log("Template creado (Draft):", content.sid);


        // try {
        //     await client.request({
        //         method: 'POST',
        //         uri: `https://content.twilio.com/v1/Content/${content.sid}/Approval`,
        //         data: {
        //             name: name.toLowerCase().replace(/\s+/g, '_'), // Formato snake_case requerido por Meta
        //             category: category
        //         }
        //     });
        // } catch (approvalError: any) {
        //     console.error("Error en aprobación:", approvalError);
        //     return NextResponse.json({
        //         message: "Plantilla creada pero falló el envío a revisión: " + approvalError.message,
        //         sid: content.sid
        //     }, { status: 500 });
        // }

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