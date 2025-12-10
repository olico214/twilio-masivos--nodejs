import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql"; // Ajusta tu ruta
import twilio from "twilio";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { templateSid, audienceType, audienceIds } = body;

        if (!templateSid || !audienceIds || audienceIds.length === 0) {
            return NextResponse.json({ message: "Faltan datos de envío" }, { status: 400 });
        }

        // 1. Configuración Twilio
        const configResult: any = await executeQuery({
            query: "SELECT accountSid, authToken, phone FROM user_config WHERE userId = ?",
            values: [id]
        });

        if (configResult.length === 0) return NextResponse.json({ message: "Configuración no encontrada" }, { status: 404 });

        const { accountSid, authToken, phone: senderPhone } = configResult[0];

        // 2. Obtener Destinatarios
        let targets: any[] = [];
        let sql = "";

        if (audienceType === 'CLIENT') {
            sql = `SELECT id, name, phone FROM clients WHERE id IN (${audienceIds.join(',')}) AND userId = ?`;
            targets = await executeQuery({ query: sql, values: [id] }) as any[];
        } else if (audienceType === 'CATEGORY') {
            sql = `SELECT DISTINCT c.id, c.name, c.phone 
                   FROM clients c JOIN client_categories cc ON c.id = cc.clientId
                   WHERE cc.categoryId IN (${audienceIds.join(',')}) AND c.userId = ?`;
            targets = await executeQuery({ query: sql, values: [id] }) as any[];
        }

        if (targets.length === 0) return NextResponse.json({ message: "No destinatarios" }, { status: 400 });

        // 3. Inicializar Twilio
        const client = twilio(accountSid, authToken);
        const fromNumber = senderPhone.includes('whatsapp:') ? senderPhone : `whatsapp:${senderPhone}`;

        // 4. ENVÍO INTELIGENTE
        const results = { sent: 0, failed: 0 };

        await Promise.all(targets.map(async (target) => {
            const toNumber = target.phone.includes('whatsapp:') ? target.phone : `whatsapp:${target.phone}`;
            let status = 'SENT';
            let errorMsg = null;

            // --- LÓGICA DE NOMBRE SEGURO ---
            // Si no tiene nombre, usamos "Cliente" para que el template no se rompa ni se vea feo.
            const safeName = (target.name && target.name.trim() !== "") ? target.name : "Cliente";

            const variables = JSON.stringify({
                "1": safeName
            });

            try {
                // INTENTO 1: Enviar asumiendo que el template TIENE la variable {{1}}
                await client.messages.create({
                    contentSid: templateSid,
                    from: fromNumber,
                    to: toNumber,
                    contentVariables: variables
                });
                results.sent++;

            } catch (err: any) {
                // SI FALLA EL INTENTO 1...
                console.warn(`Intento 1 falló para ${target.phone}:`, err.message);

                // Verificamos si el error puede ser porque el template NO requiere variables
                // Twilio lanza errores como "Content variables check failed" o códigos específicos.
                // Intentamos un "Fallback" enviando SIN variables.

                try {
                    // INTENTO 2: Enviar SIN variables (Texto plano / Template estático)
                    await client.messages.create({
                        contentSid: templateSid,
                        from: fromNumber,
                        to: toNumber
                        // No enviamos contentVariables aquí
                    });
                    results.sent++; // ¡Éxito en el segundo intento!
                    errorMsg = null; // Limpiamos el error porque al final sí se envió

                } catch (err2: any) {
                    // SI FALLA EL INTENTO 2, entonces sí es un error real (número inválido, sin saldo, etc.)
                    console.error(`Error definitivo enviando a ${target.name}:`, err2);
                    status = 'FAILED';
                    errorMsg = err2.message || "Error desconocido";
                    results.failed++;
                }
            }

            // Guardar Historial
            try {
                await executeQuery({
                    query: `INSERT INTO message_history 
                            (userId, clientId, clientName, phone, templateSid, status, errorMessage, sentAt) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    values: [id, target.id, target.name, target.phone, templateSid, status, errorMsg]
                });
            } catch (dbError) { console.error("Error DB", dbError); }
        }));

        return NextResponse.json({ message: "Proceso finalizado", details: results });

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}