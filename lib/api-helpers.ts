import { z } from 'zod'
import { NextResponse } from 'next/server'

export async function parseAndValidate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): Promise<{ success: true; data: T } | { success: false; response: NextResponse }> {
    const result = schema.safeParse(data)

    if (!result.success) {
        const error = result.error as any
        const errors = error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
        }))
        return {
            success: false,
            response: NextResponse.json(
                { error: errors[0].message, errors },
                { status: 400 }
            ),
        }
    }

    return { success: true, data: result.data }
}
