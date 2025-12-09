import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/app/libs/mysql";

// Definimos el tipo para los params de la URL
interface RouteParams {
  params: Promise<{ id: string }>;
}

// --- GET: Leer la configuración del usuario ---
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const result: any = await executeQuery({
      query: "SELECT accountSid, authToken, phone FROM user_config WHERE userId = ?",
      values: [id],
    });

    // Si no existe configuración, devolvemos un 404 o un JSON vacío
    // En este caso, devolvemos null para que el frontend sepa que está limpio
    if (result.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(result[0]);

  } catch (error: any) {
    console.error("Error obteniendo configuración:", error);
    return NextResponse.json(
      { message: "Error al obtener datos" },
      { status: 500 }
    );
  }
}

// --- POST: Crear o Actualizar (Upsert) ---
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params; // Tomamos el ID de la URL para mayor seguridad
    const body = await req.json();
    const { accountSid, authToken, phone } = body;
    // 1. Validar datos requeridos
    if (!accountSid || !authToken || !phone) {
      return NextResponse.json(
        { message: "Todos los campos (accountSid, authToken, phone) son obligatorios" },
        { status: 400 }
      );
    }

    const sql = `
            INSERT INTO user_config (userId, accountSid, authToken, phone)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                accountSid = VALUES(accountSid),
                authToken = VALUES(authToken),
                phone = VALUES(phone)
        `;

    await executeQuery({
      query: sql,
      values: [id, accountSid, authToken, phone],
    });

    return NextResponse.json({ message: "Configuración guardada exitosamente" });

  } catch (error: any) {
    console.error("Error guardando configuración:", error);
    return NextResponse.json(
      { message: "Error interno del servidor", error: error.message },
      { status: 500 }
    );
  }
}