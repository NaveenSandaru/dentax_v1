'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Shade = {
  shade_type_id: number
  shade: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  shade: Shade | undefined
}

export default function EditShadeDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  shade,
}: Props) {
  const [shadeText, setShadeText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setShadeText(shade?.shade || '')
  }, [shade])

  const handleUpdate = async () => {
    if (!shade) return
    if (!shadeText.trim()) {
      toast.error("Shade is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`shades/${shade.shade_type_id}`, {
        shade: shadeText,
      })
      toast.success("Shade Updated")
      onSubmit()
      onClose()
    } catch {
      toast.error("Failed to update shade")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Shade</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="editShade">Shade</Label>
            <Input
              id="editShade"
              value={shadeText}
              onChange={(e) => setShadeText(e.target.value)}
              placeholder="e.g. A1, B2, C3"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleUpdate}
              disabled={isSaving}
            >
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
