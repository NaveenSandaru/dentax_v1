'use client'

import React, { memo } from 'react'
import { Upload, Download, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface MedicalReport {
  report_id: number
  patient_id: string
  record_url: string
  record_name?: string
}

interface MedicalReportsTabProps {
  medicalReports: MedicalReport[]
  onUploadReport: () => void
  onDownloadReport: (recordUrl: string) => void
  onDeleteReport: (reportId: number) => void
  deletingReportId: number | null
}

const MedicalReportsTab = memo(({ 
  medicalReports, 
  onUploadReport, 
  onDownloadReport, 
  onDeleteReport, 
  deletingReportId 
}: MedicalReportsTabProps) => {
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Medical Reports
        </h3>
        <Button
          className="bg-emerald-500 hover:bg-emerald-600"
          size="sm"
          onClick={onUploadReport}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Report
        </Button>
      </div>

      <div className="grid gap-3 sm:gap-4">
        {medicalReports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center  text-white">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No medical reports available</p>
              <Button
                className="bg-emerald-500 hover:bg-emerald-600"
                variant="outline"
                size="sm"
                onClick={onUploadReport}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload First Report
              </Button>
            </CardContent>
          </Card>
        ) : (
          medicalReports.map((report) => (
            <Card key={report.report_id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{report.record_name}</h4>
                      <p className="text-xs text-gray-500">
                        {backendURL && new URL(`${backendURL}${report.record_url}`).pathname.split('/').pop()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteReport(report.report_id);
                      }}
                      disabled={deletingReportId === report.report_id}
                    >
                      {deletingReportId === report.report_id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-500 border-t-transparent"></div>
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      className='hover:bg-emerald-100' 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadReport(report.record_url);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
})

MedicalReportsTab.displayName = 'MedicalReportsTab'

export default MedicalReportsTab
