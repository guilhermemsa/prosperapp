import { useState, useEffect } from 'react'
import { svgBanco } from '@edusites/bancos-brasil/src/core'
import { Landmark, Wallet, Banknote } from 'lucide-react'

const BANK_CONFIG: Record<string, { id: string; color: string }> = {
  nubank: { id: 'nubank', color: '#8A05BE' },
  'nu bank': { id: 'nubank', color: '#8A05BE' },
  itau: { id: 'itau', color: '#EC7000' },
  itaú: { id: 'itau', color: '#EC7000' },
  'banco do brasil': { id: 'bancodobrasil', color: '#F8D117' },
  bb: { id: 'bancodobrasil', color: '#F8D117' },
  bradesco: { id: 'bradesco', color: '#CC092F' },
  santander: { id: 'santander', color: '#EC0000' },
  caixa: { id: 'caixa', color: '#005CA9' },
  'caixa economica': { id: 'caixa', color: '#005CA9' },
  inter: { id: 'inter', color: '#FF7A00' },
  'banco inter': { id: 'inter', color: '#FF7A00' },
  'c6 bank': { id: 'c6', color: '#242424' },
  c6: { id: 'c6', color: '#242424' },
  btg: { id: 'btg', color: '#002C4F' },
  xp: { id: 'xp', color: '#000000' },
  picpay: { id: 'picpay', color: '#FF5C00' },
  mercado: { id: 'mercadopago', color: '#00B1EA' },
  'mercado pago': { id: 'mercadopago', color: '#00B1EA' },
  neon: { id: 'neon', color: '#00A8EE' },
  next: { id: 'next', color: '#00FF5F' },
  sicredi: { id: 'sicredi', color: '#009739' },
  sicoob: { id: 'sicoob', color: '#00502E' },
}

const getBankDetails = (name: string) => {
  const normalizedName = name.toLowerCase().trim()
  for (const [key, details] of Object.entries(BANK_CONFIG)) {
    if (normalizedName.includes(key)) {
      return details
    }
  }
  return null
}

interface BankIconProps {
  name: string
  type?: string
  size?: number
  className?: string
}

export const BankIcon = ({
  name,
  type = 'bank',
  size = 32,
  className,
}: BankIconProps) => {
  const [svgStr, setSvgStr] = useState<string | null>(null)
  const bankDetails = getBankDetails(name)

  useEffect(() => {
    let isMounted = true
    if (bankDetails) {
      const svg = svgBanco({ nome: bankDetails.id, tamanho: size })
      if (isMounted && svg) {
        setSvgStr(svg)
      }
    }
    return () => {
      isMounted = false
    }
  }, [bankDetails, size])

  const getFallbackIcon = () => {
    switch (type) {
      case 'bank':
        return <Landmark size={size * 0.6} className="text-blue-500" />
      case 'wallet':
        return <Wallet size={size * 0.6} className="text-orange-500" />
      case 'savings':
        return <Banknote size={size * 0.6} className="text-green-500" />
      default:
        return <Wallet size={size * 0.6} />
    }
  }

  if (bankDetails && svgStr) {
    return (
      <div
        className={
          className ||
          'w-10 h-10 rounded-lg bg-white border shadow-sm flex items-center justify-center overflow-hidden shrink-0'
        }
        dangerouslySetInnerHTML={{ __html: svgStr }}
      />
    )
  }

  return (
    <div
      className={
        className ||
        'w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0'
      }
    >
      {getFallbackIcon()}
    </div>
  )
}
