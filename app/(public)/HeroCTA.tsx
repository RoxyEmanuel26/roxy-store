'use client'

import { ArrowRight, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function HeroCTA({ waNumber }: { waNumber: string }) {
    return (
        <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/products">
                <Button
                    size="lg"
                    className="bg-brand-primary hover:bg-brand-accent text-white px-8 h-12 text-base font-semibold shadow-lg shadow-brand-primary/30"
                >
                    Lihat Koleksi
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </Link>

            <Button
                size="lg"
                variant="outline"
                onClick={() => window.open(`https://wa.me/${waNumber}`, '_blank')}
                className="border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white h-12 text-base"
            >
                <MessageCircle className="mr-2 h-5 w-5" />
                Hubungi Kami
            </Button>
        </div>
    )
}
