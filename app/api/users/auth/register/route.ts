import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { executeQuery } from "@/app/libs/mysql";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { fullname, email, password } = body;

        // 1. Validar campos
        if (!fullname || !email || !password) {
            return NextResponse.json(
                { message: "Nombre, email y contraseña son obligatorios" },
                { status: 400 }
            );
        }

        // 2. Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Insertar usuario (fullname, email, password)
        const result: any = await executeQuery({
            query: "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)",
            values: [fullname, email, hashedPassword]
        });

        return NextResponse.json({
            message: "Usuario registrado con éxito",
            userId: result.insertId
        }, { status: 201 });

    } catch (error: any) {
        // Manejo de error si el email ya existe (Código 1062 en MySQL)
        if (error.message.includes("Duplicate entry")) {
            return NextResponse.json(
                { message: "El correo electrónico ya está registrado" },
                { status: 409 } // 409 Conflict
            );
        }

        console.error("Error registro:", error);
        return NextResponse.json(
            { message: "Error al registrar usuario" },
            { status: 500 }
        );
    }
}