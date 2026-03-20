'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploadProps {
    value: string
    onChange: (url: string) => void
    folder?: string
    aspectRatio?: '1:1' | '16:9' | 'auto'
    maxSizeMB?: number
    label?: string
}

export default function ImageUpload({
    value,
    onChange,
    folder = 'Roxy-lay/products',
    aspectRatio = 'auto',
    maxSizeMB = 5,
    label,
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [dragActive, setDragActive] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const aspectClass = {
        '1:1': 'aspect-square',
        '16:9': 'aspect-video',
        auto: 'min-h-[200px]',
    }

    const handleFile = useCallback(
        async (file: File) => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
            if (!allowedTypes.includes(file.type)) {
                toast.error('Format file harus JPG, PNG, atau WebP')
                return
            }

            if (file.size > maxSizeMB * 1024 * 1024) {
                toast.error(`Ukuran file maksimal ${maxSizeMB}MB`)
                return
            }

            setIsUploading(true)
            setProgress(10)

            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('folder', folder)

                // Simulate progress
                const progressInterval = setInterval(() => {
                    setProgress((prev) => Math.min(prev + 15, 85))
                }, 200)

                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                })

                clearInterval(progressInterval)

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || 'Gagal mengupload gambar')
                }

                const { url } = await res.json()
                setProgress(100)
                onChange(url)
                toast.success('Gambar berhasil diupload!')
            } catch (error) {
                toast.error(
                    error instanceof Error ? error.message : 'Gagal mengupload gambar'
                )
            } finally {
                setIsUploading(false)
                setProgress(0)
            }
        },
        [folder, maxSizeMB, onChange]
    )

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault()
            setDragActive(false)
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
        },
        [handleFile]
    )

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const handleRemove = () => {
        onChange('')
        if (inputRef.current) inputRef.current.value = ''
    }

    if (value) {
        return (
            <div className="space-y-2">
                {label && (
                    <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                        {label}
                    </p>
                )}
                <div className={cn('relative overflow-hidden rounded-lg border border-brand-border dark:border-dark-border', aspectClass[aspectRatio])}>
                    <Image
                        src={value}
                        alt="Preview"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <button
                        onClick={handleRemove}
                        className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white transition-opacity hover:bg-black/80"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {label && (
                <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                    {label}
                </p>
            )}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={cn(
                    'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
                    aspectClass[aspectRatio],
                    dragActive
                        ? 'border-brand-primary bg-brand-surface dark:bg-dark-surface'
                        : 'border-brand-border dark:border-dark-border hover:border-brand-primary hover:bg-brand-surface/50 dark:hover:bg-dark-surface/50',
                    isUploading && 'pointer-events-none'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleInputChange}
                    className="hidden"
                />

                {isUploading ? (
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                        <p className="text-sm text-brand-muted dark:text-dark-muted">
                            Mengupload... {progress}%
                        </p>
                        <div className="h-2 w-48 rounded-full bg-gray-200 dark:bg-dark-border">
                            <div
                                className="h-full rounded-full bg-brand-primary transition-all"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                        <Upload className="h-8 w-8 text-brand-muted dark:text-dark-muted" />
                        <p className="text-sm font-medium text-brand-text dark:text-dark-text">
                            Seret foto ke sini atau klik untuk pilih
                        </p>
                        <p className="text-xs text-brand-muted dark:text-dark-muted">
                            JPG, PNG, WebP • Maksimal {maxSizeMB}MB
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
