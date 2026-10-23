"use client"

import { useState } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { bioDesignFontFamilies, type BioDesignFontFamily } from "@/contracts"
import { BioFontPickerFonts, BioPublicFonts, getBioFontStack } from "../public/bio-public-fonts"

/**
 * Ô chọn font kiểu guns.lol: mỗi tên font hiển thị bằng chính font đó
 * (cả ở nút chọn lẫn danh sách).
 */
export function FontFamilyPicker({
  value,
  onChange,
}: {
  value: BioDesignFontFamily
  onChange: (value: BioDesignFontFamily) => void
}) {
  // Chỉ nạp font của cả danh sách khi mở danh sách; lúc đóng chỉ cần font đang chọn.
  const [listOpen, setListOpen] = useState(false)
  const [listLoaded, setListLoaded] = useState(false)
  return (
    <>
      <BioPublicFonts families={[value]} />
      {listLoaded ? <BioFontPickerFonts /> : null}
      <Select
        value={value}
        open={listOpen}
        onOpenChange={(open) => {
          setListOpen(open)
          if (open) setListLoaded(true)
        }}
        onValueChange={(next) => onChange(next as BioDesignFontFamily)}
      >
        <SelectTrigger className="h-11 text-base" style={{ fontFamily: getBioFontStack(value) }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80 min-w-64">
          {bioDesignFontFamilies.map((family) => (
            <SelectItem
              key={family}
              value={family}
              className="py-2.5 text-[17px] leading-tight"
              style={{ fontFamily: getBioFontStack(family) }}
            >
              {family}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
