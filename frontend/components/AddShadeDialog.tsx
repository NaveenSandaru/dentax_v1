'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { toast } from "sonner"

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
}

export default function AddShadeDialog({ open, onClose, onSubmit, apiClient }: Props) {
  const [shade, setShade] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const handleAdd = async () => {
    if (!shade.trim()) {
      toast.error("Shade is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.post("shades", { shade })
      toast.success("Shade added successfully")
      onSubmit()
      setShade('')
      onClose()
    } catch {
      toast.error("Failed to add shade")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Shade</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="shade">Shade</Label>
            <Input
              id="shade"
              value={shade}
              onChange={(e) => setShade(e.target.value)}
              placeholder="e.g. A1, B2, C3"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={handleAdd}
              disabled={isSaving}
            >
              {isSaving ? "Adding..." : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
