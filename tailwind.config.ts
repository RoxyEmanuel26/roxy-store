import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

const config: Config = {
	darkMode: 'class',
	content: [
		'./app/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
	],
	theme: {
		extend: {
			colors: {
				brand: {
				primary: '#38BDF8',
				secondary: '#BAE6FD',
				bg: '#FFFFFF',
				surface: '#F0F9FF',
				text: '#0C1A2E',
				muted: '#64748B',
				border: '#BAE6FD',
				accent: '#0EA5E9',
				shopee: '#EE4D2D',
				tokopedia: '#42B549',
				whatsapp: '#25D366'
			},
			dark: {
				bg: '#0C1A2E',
				surface: '#0F2744',
				primary: '#38BDF8',
				secondary: '#7DD3FC',
				text: '#E0F2FE',
				muted: '#94A3B8',
				border: '#1E3A5F'
			},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			fontFamily: {
				sans: [
					'Poppins',
					...defaultTheme.fontFamily.sans
				]
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'fade-in': {
					from: {
						opacity: '0'
					},
					to: {
						opacity: '1'
					}
				},
				'slide-up': {
					from: {
						transform: 'translateY(20px)',
						opacity: '0'
					},
					to: {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'pulse-soft': {
					'0%, 100%': {
						transform: 'scale(1)'
					},
					'50%': {
						transform: 'scale(1.05)'
					}
				},
				'progress-indeterminate': {
					'0%': {
						transform: 'translateX(-100%)',
						width: '40%'
					},
					'50%': {
						width: '60%'
					},
					'100%': {
						transform: 'translateX(250%)',
						width: '40%'
					}
				}
			},
			animation: {
				'fade-in': 'fade-in 0.3s ease-out',
				'slide-up': 'slide-up 0.4s ease-out',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'progress-indeterminate': 'progress-indeterminate 1.2s ease-in-out infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
}

export default config
