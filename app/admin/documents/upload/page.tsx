"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUp, Upload, X, CheckCircle2, AlertCircle, FileText, FolderPlus, RefreshCw, HelpCircle, Download, Plus } from 'lucide-react'
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function BulkUploadPage() {
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadStep, setUploadStep] = useState(1)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState("idle") // idle, uploading, processing, complete, error
  
  // Mock data for client selection
  const clients = [
    { id: 1, name: "Rapid Ventures LLC", documents: 24 },
    { id: 2, name: "Blue Ocean Inc", documents: 18 },
    { id: 3, name: "Summit Solutions", documents: 32 },
    { id: 4, name: "Horizon Group", documents: 15 },
    { id: 5, name: "Stellar Innovations", documents: 9 },
    { id: 6, name: "Pinnacle Enterprises", documents: 27 },
    { id: 7, name: "Quantum Technologies", documents: 21 },
    { id: 8, name: "Nexus Corporation", documents: 14 },
  ]
  
  // Mock data for recent uploads
  const recentUploads = [
    {
      id: 1,
      name: "March Compliance Documents",
      date: "Mar 7, 2025",
      files: 24,
      status: "Complete",
      clients: 8,
    },
    {
      id: 2,
      name: "Q1 Tax Documents",
      date: "Mar 5, 2025",
      files: 36,
      status: "Complete",
      clients: 12,
    },
    {
      id: 3,
      name: "Business License Updates",
      date: "Mar 3, 2025",
      files: 18,
      status: "Complete",
      clients: 6,
    },
  ]
  
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    setSelectedFiles(files.map((file, index) => ({
      id: index + 1,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: "pending",
      client: null,
      category: null,
    })))
  }
  
  const removeFile = (id) => {
    setSelectedFiles(selectedFiles.filter(file => file.id !== id))
  }
  
  const startUpload = () => {
    setUploadStatus("uploading")
    setUploadProgress(0)
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadStatus("processing")
          startProcessing()
          return 100
        }
        return prev + 5
      })
    }, 200)
  }
  
  const startProcessing = () => {
    setProcessingProgress(0)
    
    // Simulate processing progress
    const interval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setUploadStatus("complete")
          return 100
        }
        return prev + 10
      })
    }, 300)
  }
  
  const resetUpload = () => {
    setSelectedFiles([])
    setUploadProgress(0)
    setProcessingProgress(0)
    setUploadStatus("idle")
    setUploadStep(1)
  }
  
  const nextStep = () => {
    setUploadStep(prev => prev + 1)
  }
  
  const prevStep = () => {
    setUploadStep(prev => prev - 1)
  }
  
  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Bulk Document Upload</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Upload multiple documents for multiple clients at once
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Button variant="outline" size="sm" className="flex items-center">
            <HelpCircle className="mr-2 h-4 w-4" />
            Help Guide
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Download Template
          </Button>
        </div>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="upload">Upload Documents</TabsTrigger>
          <TabsTrigger value="history">Upload History</TabsTrigger>
          <TabsTrigger value="templates">Upload Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <div className="p-6">
              {uploadStep === 1 && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Step 1: Select Documents</h2>
                  
                  {selectedFiles.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
                      <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Drag and drop files here</h3>
                      <p className="text-sm text-gray-500 mb-4">or click to browse your files</p>
                      <p className="text-xs text-gray-400 mb-6">Supports PDF, DOCX, XLSX, JPG, PNG (Max 50MB per file)</p>
                      <div className="flex justify-center">
                        <label className="cursor-pointer">
                          <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Select Files
                          </Button>
                          <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Selected Files ({selectedFiles.length})</h3>
                        <div className="flex space-x-2">
                          <label className="cursor-pointer">
                            <Button variant="outline" size="sm">
                              <Upload className="mr-2 h-4 w-4" />
                              Add More Files
                            </Button>
                            <input type="file" multiple className="hidden" onChange={handleFileSelect} />
                          </label>
                          <Button variant="outline" size="sm" onClick={() => setSelectedFiles([])}>
                            Clear All
                          </Button>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                              <th className="text-left p-3 font-medium text-sm">File Name</th>
                              <th className="text-left p-3 font-medium text-sm">Size</th>
                              <th className="text-left p-3 font-medium text-sm">Type</th>
                              <th className="text-left p-3 font-medium text-sm">Status</th>
                              <th className="text-left p-3 font-medium text-sm">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedFiles.map((file) => (
                              <tr key={file.id} className="border-b">
                                <td className="p-3">
                                  <div className="flex items-center">
                                    <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="truncate max-w-xs">{file.name}</span>
                                  </div>
                                </td>
                                <td className="p-3">{formatFileSize(file.size)}</td>
                                <td className="p-3">{formatFileType(file.type)}</td>
                                <td className="p-3">
                                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                                    Pending
                                  </span>
                                </td>
                                <td className="p-3">
                                  <Button variant="ghost" size="sm" onClick={() => removeFile(file.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6 flex justify-end">
                        <Button onClick={nextStep}>
                          Continue to Mapping
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {uploadStep === 2 && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Step 2: Map Documents to Clients</h2>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Document Mapping</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          Auto-Detect
                        </Button>
                        <Button variant="outline" size="sm">
                          Bulk Assign
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                            <th className="text-left p-3 font-medium text-sm">File Name</th>
                            <th className="text-left p-3 font-medium text-sm">Client</th>
                            <th className="text-left p-3 font-medium text-sm">Document Category</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedFiles.map((file) => (
                            <tr key={file.id} className="border-b">
                              <td className="p-3">
                                <div className="flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="truncate max-w-xs">{file.name}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <select className="w-full h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                  <option value="">Select Client</option>
                                  {clients.map(client => (
                                    <option key={client.id} value={client.id}>{client.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-3">
                                <select className="w-full h-9 px-3 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                  <option value="">Select Category</option>
                                  <option value="formation">Formation Documents</option>
                                  <option value="compliance">Compliance</option>
                                  <option value="tax">Tax Documents</option>
                                  <option value="legal">Legal</option>
                                  <option value="financial">Financial</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button onClick={nextStep}>
                      Continue to Review
                    </Button>
                  </div>
                </div>
              )}
              
              {uploadStep === 3 && (
                <div>
                  <h2 className="text-lg font-medium mb-4">Step 3: Review and Upload</h2>
                  
                  <div className="mb-6">
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
                      <div className="flex items-start">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full mr-3">
                          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-medium mb-1">Please Review Before Uploading</h3>
                          <p className="text-sm text-gray-500">
                            Ensure all documents are correctly mapped to the appropriate clients and categories.
                            Once uploaded, documents will be immediately available to clients.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">Upload Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total Files</p>
                            <p className="font-medium">{selectedFiles.length} files</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Total Size</p>
                            <p className="font-medium">{formatFileSize(selectedFiles.reduce((acc, file) => acc + file.size, 0))}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Clients</p>
                            <p className="font-medium">8 clients</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">Client Distribution</h3>
                        <div className="space-y-3">
                          {clients.slice(0, 5).map(client => (
                            <div key={client.id} className="flex items-center justify-between">
                              <span>{client.name}</span>
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                {Math.floor(Math.random() * 5) + 1} files
                              </span>
                            </div>
                          ))}
                          <div className="flex items-center justify-between text-gray-500">
                            <span>Other clients</span>
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                              {Math.floor(Math.random() * 10) + 5} files
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border rounded-lg p-4">
                        <h3 className="font-medium mb-3">Notification Settings</h3>
                        <div className="space-y-3">
                          <div className="flex items-center">
                            <input type="checkbox" id="notifyClients" className="mr-2" checked />
                            <label htmlFor="notifyClients">Notify clients when documents are uploaded</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="notifyAdmin" className="mr-2" checked />
                            <label htmlFor="notifyAdmin">Notify me when upload is complete</label>
                          </div>
                          <div className="flex items-center">
                            <input type="checkbox" id="generateReport" className="mr-2" checked />
                            <label htmlFor="generateReport">Generate upload report</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={prevStep}>
                      Back
                    </Button>
                    <Button onClick={startUpload}>
                      Start Upload
                    </Button>
                  </div>
                </div>
              )}
              
              {uploadStep === 3 && uploadStatus !== "idle" && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <Card className="w-full max-w-md">
                    <div className="p-6">
                      <h3 className="text-lg font-medium mb-4 text-center">
                        {uploadStatus === "uploading" && "Uploading Documents..."}
                        {uploadStatus === "processing" && "Processing Documents..."}
                        {uploadStatus === "complete" && "Upload Complete!"}
                        {uploadStatus === "error" && "Upload Error"}
                      </h3>
                      
                      {(uploadStatus === "uploading" || uploadStatus === "processing") && (
                        <div className="space-y-6">
                          {uploadStatus === "uploading" && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Uploading files...</span>
                                <span>{uploadProgress}%</span>
                              </div>
                              <Progress value={uploadProgress} className="h-2" />
                            </div>
                          )}
                          
                          {uploadStatus === "processing" && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Processing documents...</span>
                                <span>{processingProgress}%</span>
                              </div>
                              <Progress value={processingProgress} className="h-2" />
                            </div>
                          )}
                          
                          <p className="text-sm text-gray-500 text-center">
                            Please don&apos;t close this window while the upload is in progress.
                          </p>
                        </div>
                      )}
                      
                      {uploadStatus === "complete" && (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          </div>
                          <p className="mb-6">All documents have been successfully uploaded and processed.</p>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Files uploaded:</span>
                              <span>{selectedFiles.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Clients affected:</span>
                              <span>8</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Processing time:</span>
                              <span>45 seconds</span>
                            </div>
                          </div>
                          <div className="mt-6">
                            <Button onClick={resetUpload} className="w-full">
                              Done
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {uploadStatus === "error" && (
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                          </div>
                          <p className="mb-6">There was an error during the upload process.</p>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span>Files uploaded:</span>
                              <span>12 / {selectedFiles.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Error message:</span>
                              <span className="text-red-600">Connection timeout</span>
                            </div>
                          </div>
                          <div className="mt-6 space-y-2">
                            <Button variant="outline" onClick={() => setUploadStatus("uploading")} className="w-full">
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Retry Upload
                            </Button>
                            <Button variant="ghost" onClick={resetUpload} className="w-full">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Upload History</h2>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Recent Uploads</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      Export
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-800 border-b">
                        <th className="text-left p-3 font-medium text-sm">Batch Name</th>
                        <th className="text-left p-3 font-medium text-sm">Date</th>
                        <th className="text-left p-3 font-medium text-sm">Files</th>
                        <th className="text-left p-3 font-medium text-sm">Clients</th>
                        <th className="text-left p-3 font-medium text-sm">Status</th>
                        <th className="text-left p-3 font-medium text-sm">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentUploads.map((upload) => (
                        <tr key={upload.id} className="border-b">
                          <td className="p-3">
                            <div className="font-medium">{upload.name}</div>
                          </td>
                          <td className="p-3">{upload.date}</td>
                          <td className="p-3">{upload.files} files</td>
                          <td className="p-3">{upload.clients} clients</td>
                          <td className="p-3">
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                              {upload.status}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex space-x-2">
                              <Button variant="ghost" size="sm">
                                View Details
                              </Button>
                              <Button variant="ghost" size="sm">
                                Download Report
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-4">Upload Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Total Uploads</p>
                    <p className="text-2xl font-bold">247</p>
                    <p className="text-xs text-green-600">+12% from last month</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Total Files</p>
                    <p className="text-2xl font-bold">3,842</p>
                    <p className="text-xs text-green-600">+8% from last month</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Clients Served</p>
                    <p className="text-2xl font-bold">128</p>
                    <p className="text-xs text-green-600">+5% from last month</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-lg font-medium mb-4">Upload Templates</h2>
              
              <div className="mb-6">
                <p className="text-gray-500 mb-4">
                  Upload templates help you standardize the bulk upload process. Create templates for different document types or client groups.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="border rounded-lg p-4 hover:border-purple-200 hover:bg-purple-50 dark:hover:border-purple-800 dark:hover:bg-purple-900/10 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Compliance Documents</h3>
                      <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <FolderPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Template for quarterly compliance document uploads</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last used: Mar 1, 2025</span>
                      <span>8 clients</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:border-purple-200 hover:bg-purple-50 dark:hover:border-purple-800 dark:hover:bg-purple-900/10 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Tax Documents</h3>
                      <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <FolderPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Template for annual tax document uploads</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last used: Feb 15, 2025</span>
                      <span>12 clients</span>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 hover:border-purple-200 hover:bg-purple-50 dark:hover:border-purple-800 dark:hover:bg-purple-900/10 cursor-pointer transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">New Client Onboarding</h3>
                      <div className="p-1 bg-purple-100 dark:bg-purple-900/30 rounded">
                        <FolderPlus className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">Template for new client document setup</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Last used: Feb 10, 2025</span>
                      <span>5 clients</span>
                    </div>
                  </div>
                  
                  <div className="border border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
                      <Plus className="h-5 w-5 text-gray-500" />
                    </div>
                    <h3 className="font-medium mb-1">Create New Template</h3>
                    <p className="text-sm text-gray-500">Set up a new upload template</p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6">
                  <h3 className="font-medium mb-4">Create New Upload Template</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input id="template-name" placeholder="e.g. Quarterly Compliance Documents" />
                    </div>
                    
                    <div>
                      <Label htmlFor="template-description">Description</Label>
                      <Textarea id="template-description" placeholder="Describe the purpose of this template" />
                    </div>
                    
                    <div>
                      <Label>Client Selection</Label>
                      <div className="border rounded-lg p-4 mt-2">
                        <div className="flex items-center mb-3">
                          <input type="radio" id="all-clients" name="client-selection" className="mr-2" />
                          <label htmlFor="all-clients">All Clients</label>
                        </div>
                        <div className="flex items-center mb-3">
                          <input type="radio" id="client-group" name="client-selection" className="mr-2" checked />
                          <label htmlFor="client-group">Client Group</label>
                        </div>
                        <div className="flex items-center">
                          <input type="radio" id="specific-clients" name="client-selection" className="mr-2" />
                          <label htmlFor="specific-clients">Specific Clients</label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Document Categories</Label>
                      <div className="border rounded-lg p-4 mt-2 grid grid-cols-2 gap-3">
                        <div className="flex items-center">
                          <input type="checkbox" id="formation-docs" className="mr-2" checked />
                          <label htmlFor="formation-docs">Formation Documents</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="compliance-docs" className="mr-2" checked />
                          <label htmlFor="compliance-docs">Compliance</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="tax-docs" className="mr-2" checked />
                          <label htmlFor="tax-docs">Tax Documents</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="legal-docs" className="mr-2" />
                          <label htmlFor="legal-docs">Legal</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="financial-docs" className="mr-2" />
                          <label htmlFor="financial-docs">Financial</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="other-docs" className="mr-2" />
                          <label htmlFor="other-docs">Other</label>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label>Notification Settings</Label>
                      <div className="border rounded-lg p-4 mt-2 space-y-3">
                        <div className="flex items-center">
                          <input type="checkbox" id="notify-clients-template" className="mr-2" checked />
                          <label htmlFor="notify-clients-template">Notify clients when documents are uploaded</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="notify-admin-template" className="mr-2" checked />
                          <label htmlFor="notify-admin-template">Notify me when upload is complete</label>
                        </div>
                        <div className="flex items-center">
                          <input type="checkbox" id="generate-report-template" className="mr-2" checked />
                          <label htmlFor="generate-report-template">Generate upload report</label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        Save Template
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Helper function to format file type
function formatFileType(type) {
  if (type.includes('pdf')) return 'PDF'
  if (type.includes('word') || type.includes('docx')) return 'Word'
  if (type.includes('excel') || type.includes('xlsx')) return 'Excel'
  if (type.includes('image') || type.includes('jpg') || type.includes('png')) return 'Image'
  return type.split('/')[1]?.toUpperCase() || 'Unknown'
}
