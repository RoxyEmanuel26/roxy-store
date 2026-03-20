const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const iconsDir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true })
}

sizes.forEach((size) => {
    const canvas = createCanvas(size, size)
    const ctx = canvas.getContext('2d')

    // Background pink
    ctx.fillStyle = '#FF6B9D'
    ctx.fillRect(0, 0, size, size)

    // Teks CL
    ctx.fillStyle = '#FFFFFF'
    ctx.font = `bold ${size * 0.4}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('CL', size / 2, size / 2)

    // Simpan
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer)
    console.log(`✅ Generated icon-${size}x${size}.png`)
})

// Generate OG default image (1200x630)
const ogCanvas = createCanvas(1200, 630)
const ogCtx = ogCanvas.getContext('2d')

// Gradient background
const gradient = ogCtx.createLinearGradient(0, 0, 1200, 630)
gradient.addColorStop(0, '#FF6B9D')
gradient.addColorStop(1, '#FF8DA1')
ogCtx.fillStyle = gradient
ogCtx.fillRect(0, 0, 1200, 630)

// Main Text
ogCtx.fillStyle = '#FFFFFF'
ogCtx.font = 'bold 120px Arial'
ogCtx.textAlign = 'center'
ogCtx.textBaseline = 'middle'
ogCtx.fillText('Roxy Lay', 600, 280)

// Sub Text
ogCtx.font = '40px Arial'
ogCtx.fillText('Aksesori Wanita Colorful', 600, 400)

const ogBuffer = ogCanvas.toBuffer('image/jpeg')
fs.writeFileSync(path.join(__dirname, '../public/og-default.jpg'), ogBuffer)
console.log('✅ Generated og-default.jpg')
