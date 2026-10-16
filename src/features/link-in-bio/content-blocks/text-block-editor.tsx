"use client";

import { AlignCenter, AlignLeft, AlignRight } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/member/fields/select";
import { Textarea } from "@/components/member/fields/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { BioTextBlockDto } from "@/lib/api-client";

export function TextBlockEditor({
  block,
  disabled,
  onChange,
}: {
  block: BioTextBlockDto;
  disabled?: boolean;
  onChange: (block: BioTextBlockDto) => void;
}) {
  const patch = (value: Partial<BioTextBlockDto>) => onChange({ ...block, ...value });

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor={`text-content-${block.id}`}>Nội dung</Label>
        <Textarea
          id={`text-content-${block.id}`}
          value={block.content}
          maxLength={500}
          rows={3}
          disabled={disabled}
          onChange={(event) => patch({ content: event.target.value })}
          placeholder="Nhập tiêu đề hoặc đoạn văn bản..."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Kiểu chữ</Label>
          <Select
            value={block.style}
            disabled={disabled}
            onValueChange={(style) => patch({ style: style as BioTextBlockDto["style"] })}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="heading">Tiêu đề lớn</SelectItem>
              <SelectItem value="subheading">Tiêu đề phụ</SelectItem>
              <SelectItem value="paragraph">Đoạn văn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label>Căn chỉnh</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={block.align}
            disabled={disabled}
            onValueChange={(align) => {
              if (align) patch({ align: align as BioTextBlockDto["align"] });
            }}
            className="w-full"
          >
            <ToggleGroupItem value="left" aria-label="Căn trái" className="flex-1"><AlignLeft className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="center" aria-label="Căn giữa" className="flex-1"><AlignCenter className="size-4" /></ToggleGroupItem>
            <ToggleGroupItem value="right" aria-label="Căn phải" className="flex-1"><AlignRight className="size-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}
