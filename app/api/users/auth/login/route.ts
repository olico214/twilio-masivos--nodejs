import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { executeQuery } from "@/app/libs/mysql";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        // 1. Validar entrada
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email y contraseña requeridos" },
                { status: 400 }
            );
        }

        // 2. Buscar usuario por EMAIL
        const result: any = await executeQuery({
            query: "SELECT * FROM users WHERE email = ? AND active = 1",
            values: [email],
        });

        if (result.length === 0) {
            return NextResponse.json(
                { message: "Credenciales inválidas" },
                { status: 401 }
            );
        }

        const user = result[0];

        // 3. Comparar contraseña
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: "Credenciales inválidas" },
                { status: 401 }
            );
        }

        // 4. Éxito (quitamos el password de la respuesta)
        const { password: _, ...userData } = user;

        return NextResponse.json({
            message: "Login correcto",
            user: userData,
        });

    } catch (error: any) {
        console.error("Error login:", error);
        return NextResponse.json(
            { message: "Error interno del servidor" },
            { status: 500 }
        );
    }
}