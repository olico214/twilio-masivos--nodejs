import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";
import twilio from "twilio";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params; // userId
        const body = await req.json();

        const { templateSid, audienceType, audienceIds } = body;

        // Validaciones
        if (!templateSid || !audienceIds || audienceIds.length === 0) {
            return NextResponse.json({ message: "Faltan datos de envío" }, { status: 400 });
        }

        // 1. Configuración Twilio
        const configResult: any = await executeQuery({
            query: "SELECT accountSid, authToken, phone FROM user_config WHERE userId = ?",
            values: [id]
        });

        if (configResult.length === 0) {
            return NextResponse.json({ message: "Configuración no encontrada" }, { status: 404 });
        }

        const { accountSid, authToken, phone: senderPhone } = configResult[0];

        // 2. Obtener Destinatarios (ID, Nombre y Teléfono)
        let targets: any[] = [];
        let sql = "";

        if (audienceType === 'CLIENT') {
            // Clientes específicos
            sql = `SELECT id, name, phone FROM clients WHERE id IN (${audienceIds.join(',')}) AND userId = ?`;
            targets = await executeQuery({ query: sql, values: [id] }) as any[];

        } else if (audienceType === 'CATEGORY') {
            // Clientes por categoría (evitando duplicados con DISTINCT)
            sql = `
                SELECT DISTINCT c.id, c.name, c.phone 
                FROM clients c
                JOIN client_categories cc ON c.id = cc.clientId
                WHERE cc.categoryId IN (${audienceIds.join(',')}) AND c.userId = ?
            `;
            targets = await executeQuery({ query: sql, values: [id] }) as any[];
        }

        if (targets.length === 0) {
            return NextResponse.json({ message: "No se encontraron destinatarios válidos." }, { status: 400 });
        }

        // 3. Inicializar Twilio
        const client = twilio(accountSid, authToken);
        const fromNumber = senderPhone.includes('whatsapp:') ? senderPhone : `whatsapp:${senderPhone}`;

        // 4. Enviar y Guardar Historial (Procesamiento en Paralelo)
        const results = { sent: 0, failed: 0 };

        await Promise.all(targets.map(async (target) => {
            const toNumber = target.phone.includes('whatsapp:') ? target.phone : `whatsapp:${target.phone}`;
            let status = 'SENT';
            let errorMsg = null;

            try {
                // A. Intentar enviar mensaje
                await client.messages.create({
                    contentSid: templateSid,
                    from: fromNumber,
                    to: toNumber
                });
                results.sent++;

            } catch (err: any) {
                // B. Si falla, capturar error
                console.error(`Error enviando a ${target.name}:`, err);
                status = 'FAILED';
                errorMsg = err.message || "Error desconocido";
                results.failed++;
            }

            // C. GUARDAR EN BASE DE DATOS (HISTORIAL)
            // Se guarda independientemente de si falló o no, para tener el registro
            try {
                await executeQuery({
                    query: `INSERT INTO message_history 
                            (userId, clientId, clientName, phone, templateSid, status, errorMessage, sentAt) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    values: [
                        id,
                        target.id,
                        target.name,
                        target.phone,
                        templateSid,
                        status,
                        errorMsg
                    ]
                });
            } catch (dbError) {
                console.error("Error guardando historial DB:", dbError);
            }
        }));

        return NextResponse.json({
            message: "Proceso finalizado",
            details: results
        });

    } catch (error: any) {
        console.error("Error general:", error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}