import { toast } from 'sonner'

export const showToast = {
    success: (msg: string, desc?: string) =>
        toast.success(msg, { description: desc }),

    error: (msg: string) =>
        toast.error(msg),

    info: (msg: string) =>
        toast(msg, { icon: '💕' }),

    wishlistAdded: (productName: string) =>
        toast.success('Ditambahkan ke favorit! 💕', {
            description: productName,
            duration: 2000,
        }),

    wishlistRemoved: () =>
        toast.info('Dihapus dari favorit', { duration: 1500 }),

    linkCopied: () =>
        toast.success('Link berhasil disalin! 📋', { duration: 1500 }),
}
