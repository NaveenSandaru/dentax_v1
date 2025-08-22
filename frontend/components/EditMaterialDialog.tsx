'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Material = {
  material_id: number
  material: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  material: Material | undefined
}

export default function EditMaterialDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  material,
}: Props) {
  const [materialText, setMaterialText] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setMaterialText(material?.material || '')
  }, [material])

  const handleUpdate = async () => {
    if (!material) return
    if (!materialText.trim()) {
      toast.error("Material is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`material-types/${material.material_id}`, {
        material: materialText,
      })
      toast.success("Material updated successfully")
      onSubmit()
      onClose()
    } catch {
      toast.error("Failed to update material")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="editMaterial">Material</Label>
            <Input
              id="editMaterial"
              value={materialText}
              onChange={(e) => setMaterialText(e.target.value)}
              placeholder="e.g. Wood, Metal, Plastic"
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
