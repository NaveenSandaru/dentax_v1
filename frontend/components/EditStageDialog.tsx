'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type Stage = {
  stage_id: number
  name: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  stage: Stage | undefined
}

export default function EditStageDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  stage,
}: Props) {
  const [stageName, setStageName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setStageName(stage?.name || '')
  }, [stage])

  const handleUpdate = async () => {
    if (!stage) return
    if (!stageName.trim()) {
      toast.error("Stage name is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`stages/${stage.stage_id}`, { name: stageName })
      toast.success("Stage updated successfully")
      onSubmit()
      onClose()
    } catch {
      toast.error("Failed to update stage")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="editStage">Stage Name</Label>
            <Input
              id="editStage"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
              placeholder="e.g. Planning, Production, Review"
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
