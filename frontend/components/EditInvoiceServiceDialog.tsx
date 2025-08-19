"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { boolean } from "zod"
import { duration } from "html2canvas/dist/types/css/property-descriptors/duration"

interface Treatment {
  no: number
  treatment_group: string
}

interface InvoiceService {
  service_id: number
  service_name: string
  amount: number
  description: string
  ref_code: string
  tax_type: string
  tax_percentage: string
  treatment: Treatment
  treatment_type: string
  Consumable_charge: number
  Lab_charge: number
  is_active: boolean
  duration: number
}

interface EditInvoiceServiceDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: () => void
  apiClient: any
  service: InvoiceService | null
  treatmentGroups: Treatment[]
}

interface Durations{
  id: string;
  value: number;
}

export default function EditInvoiceServiceDialog({
  open,
  onClose,
  onSubmit,
  apiClient,
  service,
  treatmentGroups
}: EditInvoiceServiceDialogProps) {
  const [form, setForm] = useState({
    service_name: "",
    amount: "",
    description: "",
    ref_code: "",
    tax_type: "",
    tax_percentage: "",
    treatment_group_no: "",
    treatment_type: "",
    consumable_charge: "",
    lab_charge: "",
    is_active: false,
    duration: 0
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (service) {
      setForm({
        service_name: service.service_name,
        amount: String(service.amount),
        description: service.description || "",
        ref_code: service.ref_code || "",
        tax_type: service.tax_type || "",
        tax_percentage: service.tax_percentage || "0",
        treatment_group_no: String(service.treatment?.no || ""), // ✅ correct key
        treatment_type: service.treatment_type || "",
        consumable_charge: String(service.Consumable_charge || "0"),
        lab_charge: String(service.Lab_charge || "0"),
        is_active: service.is_active,
        duration: service.duration
      })
    }
  }, [service])

    const [durations, setDurations] = useState<Durations[]>([
      {
        id:"1",
        value: 15
      },
      {
        id:"2",
        value: 30
      },
      {
        id:"3",
        value: 45
      },
      {
        id: "4",
        value: 60
      }
    ])


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async () => {
    if (!form.service_name || !form.amount || !form.treatment_group_no) {
      toast.error("Service name, amount, and treatment group are required")
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.put(`/invoice-services/${service?.service_id}`, {
        service_name: form.service_name,
        amount: parseFloat(form.amount),
        description: form.description,
        ref_code: form.ref_code,
        tax_type: form.tax_type,
        tax_percentage: form.tax_percentage,
        treatment_group_no: parseInt(form.treatment_group_no),
        treatment_type: form.treatment_type,
        Consumable_charge: parseFloat(form.consumable_charge || "0"),
        Lab_charge: parseFloat(form.lab_charge || "0"),
        is_acive: form.is_active,
        duration: Number(form.duration)
      })

      if (response.status !== 200 && response.status !== 202) {
        throw new Error("Failed to update service")
      }

      toast.success("Service updated successfully")
      onSubmit()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Invoice Service</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Service Name *</Label>
              <Input name="service_name" value={form.service_name} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Amount (Rs.) *</Label>
              <Input type="number" name="amount" value={form.amount} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ref Code</Label>
              <Input name="ref_code" value={form.ref_code} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Tax Type</Label>
              <Input name="tax_type" value={form.tax_type} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tax Percentage</Label>
              <Input
                type="number"
                name="tax_percentage"
                value={form.tax_percentage}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Treatment Type</Label>
              <Input
                name="treatment_type"
                value={form.treatment_type}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Treatment Group *</Label>
            <Select
              value={form.treatment_group_no}
              onValueChange={(value) => handleSelectChange("treatment_group_no", value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Treatment Group" />
              </SelectTrigger>
              <SelectContent>
                {treatmentGroups.map(group => (
                  <SelectItem key={group.no} value={String(group.no)}>
                    {group.treatment_group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Consumable Charge</Label>
              <Input
                type="number"
                name="consumable_charge"
                value={form.consumable_charge}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>Lab Charge</Label>
              <Input
                type="number"
                name="lab_charge"
                value={form.lab_charge}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Duration</Label>
              <Select
                value={form.duration.toString()}
                onValueChange={(value) => handleSelectChange("duration", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Treatment Group" />
                </SelectTrigger>
                <SelectContent>
                  {durations.map(duration => (
                    <SelectItem key={duration.id} value={String(duration.value)}>
                      {duration.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-emerald-500 hover:bg-emerald-600"
              disabled={loading}
            >
              {loading ? "Saving..." : "Update Service"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
