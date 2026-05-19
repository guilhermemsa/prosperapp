import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'

interface MoneyInputProps {
  value: number
  onChange: (value: number) => void
  placeholder?: string
  id?: string
}

export const MoneyInput = ({
  value,
  onChange,
  placeholder,
  id,
}: MoneyInputProps) => {
  const [displayValue, setDisplayValue] = useState('')

  const formatValue = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  useEffect(() => {
    // Sync internal display value with external numeric value
    if (parseFloat(displayValue.replace(/[^\d]/g, '')) / 100 !== value) {
      setDisplayValue(formatValue(value))
    }
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^\d]/g, '')
    const numericValue = parseFloat(rawValue) / 100

    if (isNaN(numericValue)) {
      onChange(0)
      setDisplayValue(formatValue(0))
    } else {
      onChange(numericValue)
      setDisplayValue(formatValue(numericValue))
    }
  }

  return (
    <Input
      id={id}
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className="font-mono text-lg text-right"
    />
  )
}
