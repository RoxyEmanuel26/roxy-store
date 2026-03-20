'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'

interface ContactFormProps {
    waNumber: string
}

export default function ContactForm({ waNumber }: ContactFormProps) {
    const [name, setName] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim() || message.trim().length < 10) return

        const text = encodeURIComponent(
            `Halo Roxy Store! Nama saya ${name}. Saya ingin bertanya: ${message}`
        )
        window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank')
    }

    return (
        <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-brand-text dark:text-dark-text mb-4">
                Kirim Pesan via WhatsApp
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="contact-name">Nama Kamu *</Label>
                    <Input
                        id="contact-name"
                        placeholder="Masukkan namamu"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contact-message">Pesan *</Label>
                    <Textarea
                        id="contact-message"
                        placeholder="Tuliskan pertanyaan atau pesanmu..."
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        minLength={10}
                    />
                    <p className="text-xs text-brand-muted dark:text-dark-muted">Minimal 10 karakter</p>
                </div>
                <Button
                    type="submit"
                    disabled={!name.trim() || message.trim().length < 10}
                    className="w-full bg-[#25D366] hover:bg-[#1fba57] text-white font-bold"
                >
                    <Send className="h-4 w-4 mr-2" />
                    Kirim via WhatsApp
                </Button>
            </form>
        </div>
    )
}
