'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { toast } from "sonner"

type SecurityQuestion = {
  security_question_id: number
  question: string
}

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  question: SecurityQuestion | undefined
}

export default function EditQuestionDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  question,
}: Props) {
  const [secQuestion, setSecQuestion] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setSecQuestion(question?.question || '')
  }, [question])

  const handleUpdate = async () => {
    if (!question) return
    if (!secQuestion.trim()) {
      toast.error("Question is required")
      return
    }

    setIsSaving(true)
    try {
      await apiClient.put(`security-questions/${question.security_question_id}`, {
        question: secQuestion,
      })
      toast.success("Question updated")
      onSubmit()
      onClose()
    } catch {
      toast.error("Failed to update question")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="editGroupName">Security Question</Label>
            <Input
              id="editGroupName"
              value={secQuestion}
              onChange={(e) => setSecQuestion(e.target.value)}
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
