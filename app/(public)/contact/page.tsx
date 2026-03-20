import { getSiteSettings } from '@/lib/site-settings'
import ContactForm from './ContactForm'

import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
    title: 'Kontak',
    description: 'Punya pertanyaan atau ingin komplain? Hubungi Roxy Store melalui WhatsApp untuk bantuan secepatnya.',
    path: '/contact',
})

function formatWaNumber(wa: string): string {
    if (!wa || wa.length < 10) return wa
    const clean = wa.replace(/^62/, '+62 ')
    return clean.replace(/(\+62 )(\d{3})(\d{4})(\d+)/, '$1$2-$3-$4')
}

export default async function ContactPage() {
    const settings = await getSiteSettings()

    return (
        <div className="container mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-brand-text dark:text-dark-text">
                    Hubungi Kami 💬
                </h1>
                <p className="text-brand-muted dark:text-dark-muted mt-2 text-lg">
                    Kami siap membantu pertanyaanmu
                </p>
            </div>

            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* WhatsApp Card */}
                <div className="rounded-2xl overflow-hidden shadow-lg">
                    <div className="bg-gradient-to-br from-[#25D366] to-[#128C7E] p-8 text-white text-center">
                        <svg className="w-16 h-16 mx-auto mb-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818c-2.168 0-4.19-.592-5.929-1.622l-.42-.248-2.747.869.882-2.681-.276-.437A9.77 9.77 0 012.182 12 9.818 9.818 0 0112 2.182 9.818 9.818 0 0121.818 12 9.818 9.818 0 0112 21.818z" />
                        </svg>
                        <h2 className="text-xl font-bold mb-2">Chat Langsung dengan Admin</h2>
                        <p className="text-white/80 text-sm mb-4">{formatWaNumber(settings.wa_number)}</p>
                        <a href={`https://wa.me/${settings.wa_number}?text=${encodeURIComponent('Halo Roxy Store!')}`} target="_blank" rel="noopener noreferrer">
                            <button className="bg-white text-[#25D366] font-bold px-6 py-3 rounded-xl hover:bg-green-50 transition-colors w-full">
                                Mulai Chat Sekarang
                            </button>
                        </a>
                    </div>
                    <div className="p-4 bg-white dark:bg-dark-surface">
                        <div className="space-y-2 text-sm text-brand-muted dark:text-dark-muted">
                            <p>⏰ Biasanya merespons dalam 1-2 jam</p>
                            <p>📅 Senin - Sabtu, 09.00 - 21.00 WIB</p>
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <ContactForm waNumber={settings.wa_number} />
            </div>
        </div>
    )
}
