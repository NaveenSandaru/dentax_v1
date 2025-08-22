'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type WorkType = {
  work_type_id: number
  work_type: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  workType: WorkType | undefined
}

export default function EditQuestionDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  workType,
}: Props) {
  const [workTypeText, setWorkTypeText] = useState('');
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setWorkTypeText(workType?.work_type || '')
  }, [workType])

  const handleUpdate = async () => {
    if (!workType) return
    if (!workTypeText.trim()) {
      toast.error("Work Type is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`work-types/${workType.work_type_id}`, {
        work_type: workTypeText,
      })
      toast.success("Work Type Updated")
      onSubmit()
      onClose()
    } catch {
      toast.error("Failed to update Work Type")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Work Type</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="editGroupName">Work Type</Label>
            <Input
              id="editGroupName"
              value={workTypeText}
              onChange={(e) => setWorkTypeText(e.target.value)}
              placeholder="e.g. Restorative Dentistry"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white " onClick={handleUpdate} disabled={isSaving}>
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
