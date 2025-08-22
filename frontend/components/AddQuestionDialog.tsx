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

export default function AddQuestionDialog({ open, onClose, onSubmit, apiClient }: Props) {
  const [question, setQuestion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAdd = async () => {
    if (!question.trim()) {
      toast.error("Question is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.post("security-questions", { question: question })
      toast.success("Question added")
      onSubmit()
      setQuestion('')
      onClose()
    } catch {
      toast.error("Failed to add question")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Question</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="groupName">Question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. Oral Surgery"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleAdd} disabled={isSaving}>
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
