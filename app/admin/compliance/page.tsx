"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import {
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Info,
  MoreHorizontal,
  Search,
  Settings,
  Shield,
  X,
  MessageSquare,
  Send,
  Trash2,
  Upload,
  User,
  Edit,
  Plus,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ComplianceMessage {
  id: string
  sender: string
  senderType: "system" | "agent" | "client"
  message: string
  timestamp: string
  attachments?: string[]
}

interface ComplianceDocument {
  id: string
  name: string
  status: "approved" | "pending" | "rejected"
  uploadDate: string
  uploadedBy?: string
  notes?: string
}

interface ActivityLog {
  id: string
  action: string
  performedBy: string
  timestamp: string
  details?: string
}

interface ComplianceItem {
  id: string
  name: string
  company: string
  type: string
  status: "completed" | "pending" | "overdue" | "exempt"
  dueDate: string
  assignedTo: string
  priority: "high" | "medium" | "low"
  progress: number
  lastUpdated: string
  notes?: string
  documents?: ComplianceDocument[]
  messages?: ComplianceMessage[]
  activityLog?: ActivityLog[]
}

interface ComplianceRequirement {
  id: string
  name: string
  description: string
  frequency: "annual" | "quarterly" | "monthly" | "one-time"
  applicableEntities: string[]
  requiredDocuments: string[]
  active: boolean
}

export default function CompliancePage() {
  const [activeTab, setActiveTab] = useState("tasks")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null)
  const [showItemDialog, setShowItemDialog] = useState(false)
  const [showRequirementDialog, setShowRequirementDialog] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<ComplianceRequirement | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterPriority, setFilterPriority] = useState<string>("all")
  const [filterAssignee, setFilterAssignee] = useState<string>("all")
  const [showFilterDialog, setShowFilterDialog] = useState(false)
  const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false)
  const [newStatus, setNewStatus] = useState<string>("")
  const [statusChangeNote, setStatusChangeNote] = useState("")
  const [replyText, setReplyText] = useState("")
  const [showDocumentDialog, setShowDocumentDialog] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<ComplianceDocument | null>(null)
  const [documentNote, setDocumentNote] = useState("")
  const [documentStatus, setDocumentStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sample compliance items
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([
    {
      id: "COMP-2025-001",
      name: "Annual Report Filing",
      company: "Blue Ocean Inc",
      type: "Annual Report",
      status: "pending",
      dueDate: "Apr 15, 2025",
      assignedTo: "Michael Brown",
      priority: "high",
      progress: 65,
      lastUpdated: "Mar 8, 2025",
      notes: "Client has submitted initial information. Waiting for financial statements to complete the filing.",
      documents: [
        {
          id: "DOC-001",
          name: "Company Information Form",
          status: "approved",
          uploadDate: "Mar 5, 2025",
        },
        {
          id: "DOC-002",
          name: "Financial Statements",
          status: "pending",
          uploadDate: "Pending",
        },
      ],
      messages: [
        {
          id: "MSG-001",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Michael Brown",
          timestamp: "Mar 1, 2025 - 09:30 AM",
        },
        {
          id: "MSG-002",
          sender: "Michael Brown",
          senderType: "agent",
          message: "Initial review completed. Requested financial statements from client.",
          timestamp: "Mar 3, 2025 - 11:15 AM",
        },
        {
          id: "MSG-003",
          sender: "Emily Chen",
          senderType: "client",
          message: "We&apos;re finalizing our Q1 financial statements and will send them by next week.",
          timestamp: "Mar 5, 2025 - 02:45 PM",
        },
      ],
      activityLog: [
        {
          id: "ACT-001",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Mar 1, 2025 - 09:30 AM",
        },
        {
          id: "ACT-002",
          action: "Document Uploaded",
          performedBy: "Emily Chen",
          timestamp: "Mar 5, 2025 - 10:20 AM",
          details: "Uploaded Company Information Form",
        },
        {
          id: "ACT-003",
          action: "Document Approved",
          performedBy: "Michael Brown",
          timestamp: "Mar 5, 2025 - 02:30 PM",
          details: "Approved Company Information Form",
        },
      ],
    },
    {
      id: "COMP-2025-002",
      name: "Beneficial Ownership Update",
      company: "Quantum Solutions",
      type: "Beneficial Ownership",
      status: "completed",
      dueDate: "Mar 1, 2025",
      assignedTo: "Sarah Johnson",
      priority: "medium",
      progress: 100,
      lastUpdated: "Feb 25, 2025",
      notes: "All ownership information updated and verified. No changes from previous filing.",
      documents: [
        {
          id: "DOC-003",
          name: "Ownership Declaration Form",
          status: "approved",
          uploadDate: "Feb 20, 2025",
        },
        {
          id: "DOC-004",
          name: "Identification Documents",
          status: "approved",
          uploadDate: "Feb 20, 2025",
        },
      ],
      messages: [
        {
          id: "MSG-004",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Sarah Johnson",
          timestamp: "Feb 15, 2025 - 10:00 AM",
        },
        {
          id: "MSG-005",
          sender: "Sarah Johnson",
          senderType: "agent",
          message: "Reviewing ownership information. Please confirm if there have been any changes since last filing.",
          timestamp: "Feb 16, 2025 - 09:30 AM",
        },
        {
          id: "MSG-006",
          sender: "Lisa Wong",
          senderType: "client",
          message:
            "No changes to ownership structure since last filing. I&apos;ve uploaded the declaration form confirming this.",
          timestamp: "Feb 20, 2025 - 11:45 AM",
        },
        {
          id: "MSG-007",
          sender: "Sarah Johnson",
          senderType: "agent",
          message:
            "Thank you for confirming. I&apos;ve reviewed and approved all documents. This compliance task is now complete.",
          timestamp: "Feb 25, 2025 - 02:15 PM",
        },
      ],
      activityLog: [
        {
          id: "ACT-004",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Feb 15, 2025 - 10:00 AM",
        },
        {
          id: "ACT-005",
          action: "Documents Uploaded",
          performedBy: "Lisa Wong",
          timestamp: "Feb 20, 2025 - 11:45 AM",
          details: "Uploaded Ownership Declaration Form and Identification Documents",
        },
        {
          id: "ACT-006",
          action: "Documents Approved",
          performedBy: "Sarah Johnson",
          timestamp: "Feb 25, 2025 - 02:15 PM",
        },
        {
          id: "ACT-007",
          action: "Status Changed",
          performedBy: "Sarah Johnson",
          timestamp: "Feb 25, 2025 - 02:15 PM",
          details: "Changed status from 'pending' to 'completed'",
        },
      ],
    },
    {
      id: "COMP-2025-003",
      name: "Business License Renewal",
      company: "Horizon Group",
      type: "License Renewal",
      status: "overdue",
      dueDate: "Mar 1, 2025",
      assignedTo: "Thomas Garcia",
      priority: "high",
      progress: 30,
      lastUpdated: "Mar 2, 2025",
      notes: "Client notified about overdue status. Awaiting required documentation to proceed with renewal.",
      documents: [
        {
          id: "DOC-005",
          name: "Previous License",
          status: "approved",
          uploadDate: "Feb 15, 2025",
        },
        {
          id: "DOC-006",
          name: "Tax Clearance Certificate",
          status: "rejected",
          uploadDate: "Feb 28, 2025",
          notes: "Certificate is expired. Please provide current tax clearance.",
        },
      ],
      messages: [
        {
          id: "MSG-008",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Thomas Garcia",
          timestamp: "Feb 10, 2025 - 09:00 AM",
        },
        {
          id: "MSG-009",
          sender: "Thomas Garcia",
          senderType: "agent",
          message: "License renewal is due on March 1. Please upload the required documents as soon as possible.",
          timestamp: "Feb 12, 2025 - 11:30 AM",
        },
        {
          id: "MSG-010",
          sender: "David Lee",
          senderType: "client",
          message: "I&apos;ve uploaded the previous license. Working on getting the tax clearance certificate.",
          timestamp: "Feb 15, 2025 - 03:20 PM",
        },
        {
          id: "MSG-011",
          sender: "Thomas Garcia",
          senderType: "agent",
          message: "The tax clearance certificate you provided is expired. Please submit a current certificate.",
          timestamp: "Feb 28, 2025 - 04:15 PM",
        },
        {
          id: "MSG-012",
          sender: "System",
          senderType: "system",
          message: "Task is now overdue. Notification sent to client.",
          timestamp: "Mar 2, 2025 - 09:00 AM",
        },
      ],
      activityLog: [
        {
          id: "ACT-008",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Feb 10, 2025 - 09:00 AM",
        },
        {
          id: "ACT-009",
          action: "Document Uploaded",
          performedBy: "David Lee",
          timestamp: "Feb 15, 2025 - 03:20 PM",
          details: "Uploaded Previous License",
        },
        {
          id: "ACT-010",
          action: "Document Approved",
          performedBy: "Thomas Garcia",
          timestamp: "Feb 15, 2025 - 04:30 PM",
          details: "Approved Previous License",
        },
        {
          id: "ACT-011",
          action: "Document Uploaded",
          performedBy: "David Lee",
          timestamp: "Feb 28, 2025 - 02:45 PM",
          details: "Uploaded Tax Clearance Certificate",
        },
        {
          id: "ACT-012",
          action: "Document Rejected",
          performedBy: "Thomas Garcia",
          timestamp: "Feb 28, 2025 - 04:15 PM",
          details: "Rejected Tax Clearance Certificate - Certificate is expired",
        },
        {
          id: "ACT-013",
          action: "Status Changed",
          performedBy: "System",
          timestamp: "Mar 2, 2025 - 09:00 AM",
          details: "Changed status from 'pending' to 'overdue'",
        },
      ],
    },
    {
      id: "COMP-2025-004",
      name: "Tax Exemption Certification",
      company: "Summit Solutions",
      type: "Tax Exemption",
      status: "exempt",
      dueDate: "N/A",
      assignedTo: "Jessica Williams",
      priority: "low",
      progress: 100,
      lastUpdated: "Jan 15, 2025",
      notes: "Company qualifies for tax exemption under section 501(c)(3). Documentation verified and approved.",
      documents: [
        {
          id: "DOC-007",
          name: "Exemption Application",
          status: "approved",
          uploadDate: "Jan 10, 2025",
        },
        {
          id: "DOC-008",
          name: "Supporting Documentation",
          status: "approved",
          uploadDate: "Jan 10, 2025",
        },
      ],
      messages: [
        {
          id: "MSG-013",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Jessica Williams",
          timestamp: "Jan 5, 2025 - 10:15 AM",
        },
        {
          id: "MSG-014",
          sender: "Jessica Williams",
          senderType: "agent",
          message: "Reviewing tax exemption application and supporting documentation.",
          timestamp: "Jan 8, 2025 - 11:30 AM",
        },
        {
          id: "MSG-015",
          sender: "Jessica Williams",
          senderType: "agent",
          message:
            "All documentation has been verified. The organization qualifies for tax exemption under section 501(c)(3). This compliance requirement is marked as exempt.",
          timestamp: "Jan 15, 2025 - 02:45 PM",
        },
      ],
      activityLog: [
        {
          id: "ACT-014",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Jan 5, 2025 - 10:15 AM",
        },
        {
          id: "ACT-015",
          action: "Documents Uploaded",
          performedBy: "Robert Johnson",
          timestamp: "Jan 10, 2025 - 09:30 AM",
          details: "Uploaded Exemption Application and Supporting Documentation",
        },
        {
          id: "ACT-016",
          action: "Documents Approved",
          performedBy: "Jessica Williams",
          timestamp: "Jan 15, 2025 - 02:45 PM",
        },
        {
          id: "ACT-017",
          action: "Status Changed",
          performedBy: "Jessica Williams",
          timestamp: "Jan 15, 2025 - 02:45 PM",
          details: "Changed status from 'pending' to 'exempt'",
        },
      ],
    },
    {
      id: "COMP-2025-005",
      name: "Quarterly Tax Filing",
      company: "Rapid Ventures LLC",
      type: "Tax Filing",
      status: "pending",
      dueDate: "Apr 15, 2025",
      assignedTo: "Michael Brown",
      priority: "medium",
      progress: 45,
      lastUpdated: "Mar 7, 2025",
      notes: "Initial information collected. Waiting for Q1 financial data to complete filing.",
      documents: [
        {
          id: "DOC-009",
          name: "Previous Quarter Statement",
          status: "approved",
          uploadDate: "Mar 5, 2025",
        },
      ],
      messages: [
        {
          id: "MSG-016",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Michael Brown",
          timestamp: "Mar 1, 2025 - 09:00 AM",
        },
        {
          id: "MSG-017",
          sender: "Michael Brown",
          senderType: "agent",
          message: "Starting preparation for Q1 tax filing. Please provide Q1 financial data when available.",
          timestamp: "Mar 3, 2025 - 10:30 AM",
        },
        {
          id: "MSG-018",
          sender: "John Smith",
          senderType: "client",
          message:
            "I&apos;ve uploaded the previous quarter statement for reference. Our accounting team is finalizing Q1 data and will provide it by April 1.",
          timestamp: "Mar 5, 2025 - 02:15 PM",
        },
        {
          id: "MSG-019",
          sender: "Michael Brown",
          senderType: "agent",
          message:
            "Thank you. I&apos;ve reviewed the previous quarter statement. I&apos;ll prepare the filing structure and wait for the Q1 data.",
          timestamp: "Mar 7, 2025 - 11:45 AM",
        },
      ],
      activityLog: [
        {
          id: "ACT-018",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Mar 1, 2025 - 09:00 AM",
        },
        {
          id: "ACT-019",
          action: "Document Uploaded",
          performedBy: "John Smith",
          timestamp: "Mar 5, 2025 - 02:15 PM",
          details: "Uploaded Previous Quarter Statement",
        },
        {
          id: "ACT-020",
          action: "Document Approved",
          performedBy: "Michael Brown",
          timestamp: "Mar 7, 2025 - 11:45 AM",
          details: "Approved Previous Quarter Statement",
        },
      ],
    },
    {
      id: "COMP-2025-006",
      name: "Foreign Qualification",
      company: "Blue Ocean Inc",
      type: "Foreign Qualification",
      status: "pending",
      dueDate: "May 1, 2025",
      assignedTo: "Sarah Johnson",
      priority: "medium",
      progress: 25,
      lastUpdated: "Mar 6, 2025",
      notes:
        "Application for foreign qualification in California initiated. Awaiting client approval on draft documents.",
      documents: [
        {
          id: "DOC-010",
          name: "Certificate of Good Standing",
          status: "approved",
          uploadDate: "Mar 3, 2025",
        },
        {
          id: "DOC-011",
          name: "Application Draft",
          status: "pending",
          uploadDate: "Mar 6, 2025",
        },
      ],
      messages: [
        {
          id: "MSG-020",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Sarah Johnson",
          timestamp: "Mar 1, 2025 - 10:00 AM",
        },
        {
          id: "MSG-021",
          sender: "Sarah Johnson",
          senderType: "agent",
          message:
            "Starting the foreign qualification process for California. Please provide a Certificate of Good Standing from your home state.",
          timestamp: "Mar 2, 2025 - 09:30 AM",
        },
        {
          id: "MSG-022",
          sender: "Emily Chen",
          senderType: "client",
          message: "I&apos;ve uploaded the Certificate of Good Standing from Delaware.",
          timestamp: "Mar 3, 2025 - 11:15 AM",
        },
        {
          id: "MSG-023",
          sender: "Sarah Johnson",
          senderType: "agent",
          message:
            "Thank you. I&apos;ve prepared the draft application for California foreign qualification. Please review and approve.",
          timestamp: "Mar 6, 2025 - 02:30 PM",
        },
      ],
      activityLog: [
        {
          id: "ACT-021",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Mar 1, 2025 - 10:00 AM",
        },
        {
          id: "ACT-022",
          action: "Document Uploaded",
          performedBy: "Emily Chen",
          timestamp: "Mar 3, 2025 - 11:15 AM",
          details: "Uploaded Certificate of Good Standing",
        },
        {
          id: "ACT-023",
          action: "Document Approved",
          performedBy: "Sarah Johnson",
          timestamp: "Mar 3, 2025 - 03:45 PM",
          details: "Approved Certificate of Good Standing",
        },
        {
          id: "ACT-024",
          action: "Document Uploaded",
          performedBy: "Sarah Johnson",
          timestamp: "Mar 6, 2025 - 02:30 PM",
          details: "Uploaded Application Draft",
        },
      ],
    },
    {
      id: "COMP-2025-007",
      name: "Annual Meeting Minutes",
      company: "Quantum Solutions",
      type: "Corporate Governance",
      status: "completed",
      dueDate: "Feb 28, 2025",
      assignedTo: "Thomas Garcia",
      priority: "low",
      progress: 100,
      lastUpdated: "Feb 26, 2025",
      notes: "Annual meeting conducted and minutes prepared and approved by board of directors.",
      documents: [
        {
          id: "DOC-012",
          name: "Meeting Minutes",
          status: "approved",
          uploadDate: "Feb 26, 2025",
        },
        {
          id: "DOC-013",
          name: "Attendance Record",
          status: "approved",
          uploadDate: "Feb 26, 2025",
        },
      ],
      messages: [
        {
          id: "MSG-024",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Thomas Garcia",
          timestamp: "Feb 1, 2025 - 09:00 AM",
        },
        {
          id: "MSG-025",
          sender: "Thomas Garcia",
          senderType: "agent",
          message:
            "Annual meeting minutes are due by February 28. Please schedule your annual meeting and prepare the minutes.",
          timestamp: "Feb 5, 2025 - 10:30 AM",
        },
        {
          id: "MSG-026",
          sender: "Lisa Wong",
          senderType: "client",
          message: "We&apos;ve scheduled our annual meeting for February 25. Will upload the minutes after the meeting.",
          timestamp: "Feb 10, 2025 - 01:45 PM",
        },
        {
          id: "MSG-027",
          sender: "Lisa Wong",
          senderType: "client",
          message: "Annual meeting completed. I&apos;ve uploaded the minutes and attendance record for your review.",
          timestamp: "Feb 26, 2025 - 09:30 AM",
        },
        {
          id: "MSG-028",
          sender: "Thomas Garcia",
          senderType: "agent",
          message:
            "Thank you. I&apos;ve reviewed and approved the meeting minutes and attendance record. This compliance task is now complete.",
          timestamp: "Feb 26, 2025 - 11:45 AM",
        },
      ],
      activityLog: [
        {
          id: "ACT-025",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Feb 1, 2025 - 09:00 AM",
        },
        {
          id: "ACT-026",
          action: "Documents Uploaded",
          performedBy: "Lisa Wong",
          timestamp: "Feb 26, 2025 - 09:30 AM",
          details: "Uploaded Meeting Minutes and Attendance Record",
        },
        {
          id: "ACT-027",
          action: "Documents Approved",
          performedBy: "Thomas Garcia",
          timestamp: "Feb 26, 2025 - 11:45 AM",
        },
        {
          id: "ACT-028",
          action: "Status Changed",
          performedBy: "Thomas Garcia",
          timestamp: "Feb 26, 2025 - 11:45 AM",
          details: "Changed status from 'pending' to 'completed'",
        },
      ],
    },
    {
      id: "COMP-2025-008",
      name: "EIN Application",
      company: "New Horizon Startup",
      type: "Tax Registration",
      status: "completed",
      dueDate: "Mar 5, 2025",
      assignedTo: "Jessica Williams",
      priority: "high",
      progress: 100,
      lastUpdated: "Mar 3, 2025",
      notes: "EIN successfully obtained from IRS. Documentation provided to client.",
      documents: [
        {
          id: "DOC-014",
          name: "SS-4 Form",
          status: "approved",
          uploadDate: "Mar 1, 2025",
        },
        {
          id: "DOC-015",
          name: "EIN Confirmation Letter",
          status: "approved",
          uploadDate: "Mar 3, 2025",
        },
      ],
      messages: [
        {
          id: "MSG-029",
          sender: "System",
          senderType: "system",
          message: "Compliance task created and assigned to Jessica Williams",
          timestamp: "Feb 28, 2025 - 10:00 AM",
        },
        {
          id: "MSG-030",
          sender: "Jessica Williams",
          senderType: "agent",
          message: "I&apos;ll be handling your EIN application. I&apos;ve prepared the SS-4 form for your review and signature.",
          timestamp: "Feb 28, 2025 - 11:30 AM",
        },
        {
          id: "MSG-031",
          sender: "Alex Johnson",
          senderType: "client",
          message: "I&apos;ve reviewed and signed the SS-4 form. Please proceed with the application.",
          timestamp: "Mar 1, 2025 - 09:45 AM",
        },
        {
          id: "MSG-032",
          sender: "Jessica Williams",
          senderType: "agent",
          message: "I&apos;ve submitted your EIN application to the IRS. Will update you once we receive the confirmation.",
          timestamp: "Mar 1, 2025 - 02:30 PM",
        },
        {
          id: "MSG-033",
          sender: "Jessica Williams",
          senderType: "agent",
          message: "Good news! Your EIN has been issued. I&apos;ve uploaded the confirmation letter for your records.",
          timestamp: "Mar 3, 2025 - 10:15 AM",
        },
        {
          id: "MSG-034",
          sender: "Alex Johnson",
          senderType: "client",
          message: "Thank you for the quick turnaround! This is great news.",
          timestamp: "Mar 3, 2025 - 11:30 AM",
        },
      ],
      activityLog: [
        {
          id: "ACT-029",
          action: "Task Created",
          performedBy: "System",
          timestamp: "Feb 28, 2025 - 10:00 AM",
        },
        {
          id: "ACT-030",
          action: "Document Uploaded",
          performedBy: "Jessica Williams",
          timestamp: "Feb 28, 2025 - 11:30 AM",
          details: "Uploaded SS-4 Form (Draft)",
        },
        {
          id: "ACT-031",
          action: "Document Uploaded",
          performedBy: "Alex Johnson",
          timestamp: "Mar 1, 2025 - 09:45 AM",
          details: "Uploaded SS-4 Form (Signed)",
        },
        {
          id: "ACT-032",
          action: "Document Approved",
          performedBy: "Jessica Williams",
          timestamp: "Mar 1, 2025 - 10:30 AM",
          details: "Approved SS-4 Form",
        },
        {
          id: "ACT-033",
          action: "Document Uploaded",
          performedBy: "Jessica Williams",
          timestamp: "Mar 3, 2025 - 10:15 AM",
          details: "Uploaded EIN Confirmation Letter",
        },
        {
          id: "ACT-034",
          action: "Document Approved",
          performedBy: "Jessica Williams",
          timestamp: "Mar 3, 2025 - 10:30 AM",
          details: "Approved EIN Confirmation Letter",
        },
        {
          id: "ACT-035",
          action: "Status Changed",
          performedBy: "Jessica Williams",
          timestamp: "Mar 3, 2025 - 11:00 AM",
          details: "Changed status from 'pending' to 'completed'",
        },
      ],
    },
  ])

  // Sample compliance requirements
  const complianceRequirements: ComplianceRequirement[] = [
    {
      id: "REQ-001",
      name: "Annual Report Filing",
      description:
        "Annual report filing with the Secretary of State to maintain good standing. Includes updated company information, officer/director details, and registered agent confirmation.",
      frequency: "annual",
      applicableEntities: ["Corporation", "LLC", "LLP"],
      requiredDocuments: ["Company Information Form", "Financial Summary", "Officer/Director List"],
      active: true,
    },
    {
      id: "REQ-002",
      name: "Beneficial Ownership Information Filing",
      description:
        "Disclosure of individuals who own 25% or more of the company or exercise substantial control, as required by the Corporate Transparency Act.",
      frequency: "annual",
      applicableEntities: ["Corporation", "LLC", "LLP", "Partnership"],
      requiredDocuments: ["Ownership Declaration Form", "Identification Documents"],
      active: true,
    },
    {
      id: "REQ-003",
      name: "Business License Renewal",
      description: "Renewal of business licenses with local jurisdictions to maintain legal operation status.",
      frequency: "annual",
      applicableEntities: ["Corporation", "LLC", "LLP", "Sole Proprietorship"],
      requiredDocuments: ["Previous License", "Tax Clearance Certificate", "Zoning Compliance"],
      active: true,
    },
    {
      id: "REQ-004",
      name: "Quarterly Tax Filing",
      description: "Quarterly filing of estimated taxes and employment taxes with federal and state authorities.",
      frequency: "quarterly",
      applicableEntities: ["Corporation", "LLC", "LLP", "Sole Proprietorship"],
      requiredDocuments: ["Financial Statements", "Payroll Records", "Previous Quarter Statement"],
      active: true,
    },
    {
      id: "REQ-005",
      name: "Foreign Qualification",
      description: "Registration to do business in states other than the state of formation.",
      frequency: "one-time",
      applicableEntities: ["Corporation", "LLC", "LLP"],
      requiredDocuments: ["Certificate of Good Standing", "Application Form", "Registered Agent Designation"],
      active: true,
    },
    {
      id: "REQ-006",
      name: "Annual Meeting Minutes",
      description:
        "Documentation of annual shareholder/member meetings as required by corporate bylaws or operating agreements.",
      frequency: "annual",
      applicableEntities: ["Corporation", "LLC"],
      requiredDocuments: ["Meeting Minutes", "Attendance Record", "Voting Results"],
      active: true,
    },
    {
      id: "REQ-007",
      name: "EIN Application",
      description: "Application for Employer Identification Number with the IRS for tax purposes.",
      frequency: "one-time",
      applicableEntities: ["Corporation", "LLC", "LLP", "Partnership", "Sole Proprietorship"],
      requiredDocuments: ["SS-4 Form", "Formation Documents"],
      active: true,
    },
    {
      id: "REQ-008",
      name: "Sales Tax Registration",
      description: "Registration with state tax authorities to collect and remit sales tax.",
      frequency: "one-time",
      applicableEntities: ["Corporation", "LLC", "LLP", "Sole Proprietorship"],
      requiredDocuments: ["Registration Form", "Business Information"],
      active: true,
    },
  ]

  // Filter compliance items based on search query and filters
  const filteredItems = complianceItems.filter((item) => {
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = filterStatus === "all" || item.status === filterStatus
    const matchesType = filterType === "all" || item.type === filterType
    const matchesPriority = filterPriority === "all" || item.priority === filterPriority
    const matchesAssignee = filterAssignee === "all" || item.assignedTo === filterAssignee

    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesAssignee
  })

  // Filter requirements based on search query
  const filteredRequirements = complianceRequirements.filter(
    (req) =>
      req.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const viewItemDetails = (item: ComplianceItem) => {
    setSelectedItem(item)
    setShowItemDialog(true)
  }

  const viewRequirementDetails = (requirement: ComplianceRequirement) => {
    setSelectedRequirement(requirement)
    setShowRequirementDialog(true)
  }

  const handleSendReply = () => {
    if (!selectedItem || !replyText.trim()) return

    // Use a consistent timestamp format for server/client
    const now = new Date()
    const timestamp = `${now
      .toISOString()
      .split("T")[0]
      .replace(/^\d{4}-/, "")
      .replace(
        "-",
        " ",
      )}, ${now.getFullYear()} - ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`

    // Use a deterministic ID based on timestamp
    const messageId = `MSG-${Date.now()}`
    const activityId = `ACT-${Date.now() + 1}`

    const newMessage: ComplianceMessage = {
      id: messageId,
      sender: "Admin User", // Replace with actual user name
      senderType: "agent",
      message: replyText,
      timestamp: timestamp,
    }

    const newActivity: ActivityLog = {
      id: activityId,
      action: "Message Sent",
      performedBy: "Admin User", // Replace with actual user name
      timestamp: timestamp,
      details: "Reply sent to client",
    }

    // Update the selected item with the new message
    const updatedItem = {
      ...selectedItem,
      messages: [...(selectedItem.messages || []), newMessage],
      activityLog: [...(selectedItem.activityLog || []), newActivity],
      lastUpdated: now
        .toISOString()
        .split("T")[0]
        .replace(/^\d{4}-/, "")
        .replace("-", " "),
    }

    // If the item is not already in progress, update its status
    if (updatedItem.status === "pending") {
      updatedItem.status = "pending"
    }

    // Update the items array with the updated item
    const updatedItems = complianceItems.map((item) => (item.id === selectedItem.id ? updatedItem : item))

    setComplianceItems(updatedItems)
    setSelectedItem(updatedItem)
    setReplyText("")
  }

  const handleStatusChange = () => {
    if (!selectedItem || !newStatus) return

    // Use a consistent timestamp format for server/client
    const now = new Date()
    const timestamp = `${now
      .toISOString()
      .split("T")[0]
      .replace(/^\d{4}-/, "")
      .replace(
        "-",
        " ",
      )}, ${now.getFullYear()} - ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`

    // Use a deterministic ID based on timestamp
    const activityId = `ACT-${Date.now()}`
    const messageId = `MSG-${Date.now() + 1}`

    const newActivity: ActivityLog = {
      id: activityId,
      action: "Status Changed",
      performedBy: "Admin User", // Replace with actual user name
      timestamp: timestamp,
      details: `Changed status from '${selectedItem.status}' to '${newStatus}'${statusChangeNote ? ` - Note: ${statusChangeNote}` : ""}`,
    }

    // Create a system message about the status change
    const newMessage: ComplianceMessage = {
      id: messageId,
      sender: "System",
      senderType: "system",
      message: `Status changed from '${selectedItem.status}' to '${newStatus}'${statusChangeNote ? ` - Note: ${statusChangeNote}` : ""}`,
      timestamp: timestamp,
    }

    // Update the selected item with the new status
    const updatedItem = {
      ...selectedItem,
      status: newStatus as "completed" | "pending" | "overdue" | "exempt",
      progress: newStatus === "completed" ? 100 : selectedItem.progress,
      activityLog: [...(selectedItem.activityLog || []), newActivity],
      messages: [...(selectedItem.messages || []), newMessage],
      lastUpdated: now
        .toISOString()
        .split("T")[0]
        .replace(/^\d{4}-/, "")
        .replace("-", " "),
    }

    // Update the items array with the updated item
    const updatedItems = complianceItems.map((item) => (item.id === selectedItem.id ? updatedItem : item))

    setComplianceItems(updatedItems)
    setSelectedItem(updatedItem)
    setNewStatus("")
    setStatusChangeNote("")
    setShowStatusChangeDialog(false)
  }

  const handleDeleteItem = () => {
    if (!selectedItem) return

    // Filter out the selected item from the items array
    const updatedItems = complianceItems.filter((item) => item.id !== selectedItem.id)

    setComplianceItems(updatedItems)
    setSelectedItem(null)
    setShowDeleteConfirmDialog(false)
    setShowItemDialog(false)
  }

  const handleDocumentAction = () => {
    if (!selectedItem || !selectedDocument || !documentStatus) return

    // Use a consistent timestamp format for server/client
    const now = new Date()
    const timestamp = `${now
      .toISOString()
      .split("T")[0]
      .replace(/^\d{4}-/, "")
      .replace(
        "-",
        " ",
      )}, ${now.getFullYear()} - ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} ${now.getHours() >= 12 ? "PM" : "AM"}`

    // Use a deterministic ID based on timestamp
    const activityId = `ACT-${Date.now()}`
    const messageId = `MSG-${Date.now() + 1}`

    const newActivity: ActivityLog = {
      id: activityId,
      action: `Document ${documentStatus === "approved" ? "Approved" : documentStatus === "rejected" ? "Rejected" : "Updated"}`,
      performedBy: "Admin User", // Replace with actual user name
      timestamp: timestamp,
      details: `${documentStatus === "approved" ? "Approved" : documentStatus === "rejected" ? "Rejected" : "Updated"} ${selectedDocument.name}${documentNote ? ` - Note: ${documentNote}` : ""}`,
    }

    // Create a system message about the document action
    const newMessage: ComplianceMessage = {
      id: messageId,
      sender: "System",
      senderType: "system",
      message: `Document "${selectedDocument.name}" ${documentStatus === "approved" ? "approved" : documentStatus === "rejected" ? "rejected" : "updated"}${documentNote ? ` - Note: ${documentNote}` : ""}`,
      timestamp: timestamp,
    }

    // Update the document status
    const updatedDocuments =
      selectedItem.documents?.map((doc) =>
        doc.id === selectedDocument.id
          ? {
              ...doc,
              status: documentStatus as "approved" | "pending" | "rejected",
              notes: documentNote || doc.notes,
            }
          : doc,
      ) || []

    // Update the selected item with the updated document
    const updatedItem = {
      ...selectedItem,
      documents: updatedDocuments,
      activityLog: [...(selectedItem.activityLog || []), newActivity],
      messages: [...(selectedItem.messages || []), newMessage],
      lastUpdated: now
        .toISOString()
        .split("T")[0]
        .replace(/^\d{4}-/, "")
        .replace("-", " "),
      // Update progress based on document statuses
      progress: calculateProgress(updatedDocuments),
    }

    // Update the items array with the updated item
    const updatedItems = complianceItems.map((item) => (item.id === selectedItem.id ? updatedItem : item))

    setComplianceItems(updatedItems)
    setSelectedItem(updatedItem)
    setSelectedDocument(null)
    setDocumentStatus("")
    setDocumentNote("")
    setShowDocumentDialog(false)
  }

  // Helper function to calculate progress based on document statuses
  const calculateProgress = (documents: ComplianceDocument[] | undefined) => {
    if (!documents || documents.length === 0) return 0

    const approvedCount = documents.filter((doc) => doc.status === "approved").length
    return Math.round((approvedCount / documents.length) * 100)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        )
      case "pending":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "overdue":
        return (
          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      case "exempt":
        return (
          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
            <Shield className="h-3 w-3 mr-1" />
            Exempt
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getDocumentStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
          >
            Approved
          </Badge>
        )
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          >
            Pending
          </Badge>
        )
      case "rejected":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            Rejected
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            High
          </Badge>
        )
      case "medium":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          >
            Medium
          </Badge>
        )
      case "low":
        return (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800"
          >
            Low
          </Badge>
        )
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    switch (frequency) {
      case "annual":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          >
            Annual
          </Badge>
        )
      case "quarterly":
        return (
          <Badge
            variant="outline"
            className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800"
          >
            Quarterly
          </Badge>
        )
      case "monthly":
        return (
          <Badge
            variant="outline"
            className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            Monthly
          </Badge>
        )
      case "one-time":
        return (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
          >
            One-time
          </Badge>
        )
      default:
        return <Badge variant="outline">{frequency}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-[1600px] mx-auto mb-40">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monitor and manage compliance requirements for all clients
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="sm" className="flex items-center" onClick={() => setShowFilterDialog(true)}>
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowCreateTaskDialog(true)}>
            Create Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="tasks" className="flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Compliance Tasks
          </TabsTrigger>
          <TabsTrigger value="requirements" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Requirements
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Calendar
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab Content */}
        <TabsContent value="tasks" className="space-y-6">
          {/* Filters and Search */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search compliance tasks..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="exempt">Exempt</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Annual Report">Annual Report</SelectItem>
                <SelectItem value="Beneficial Ownership">Beneficial Ownership</SelectItem>
                <SelectItem value="License Renewal">License Renewal</SelectItem>
                <SelectItem value="Tax Filing">Tax Filing</SelectItem>
                <SelectItem value="Foreign Qualification">Foreign Qualification</SelectItem>
                <SelectItem value="Corporate Governance">Corporate Governance</SelectItem>
                <SelectItem value="Tax Registration">Tax Registration</SelectItem>
                <SelectItem value="Tax Exemption">Tax Exemption</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Compliance Tasks List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Compliance Tasks</CardTitle>
              <CardDescription>Track and manage compliance requirements for all clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">ID</th>
                      <th className="text-left p-4 font-medium text-sm">Task</th>
                      <th className="text-left p-4 font-medium text-sm">Company</th>
                      <th className="text-left p-4 font-medium text-sm">Type</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Priority</th>
                      <th className="text-left p-4 font-medium text-sm">Due Date</th>
                      <th className="text-left p-4 font-medium text-sm">Progress</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => viewItemDetails(item)}
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm">{item.id}</span>
                        </td>
                        <td className="p-4 font-medium">{item.name}</td>
                        <td className="p-4">{item.company}</td>
                        <td className="p-4">
                          <span className="text-sm">{item.type}</span>
                        </td>
                        <td className="p-4">{getStatusBadge(item.status)}</td>
                        <td className="p-4">{getPriorityBadge(item.priority)}</td>
                        <td className="p-4 text-sm">{item.dueDate}</td>
                        <td className="p-4">
                          <div className="flex items-center">
                            <Progress
                              value={item.progress}
                              className={`h-2 w-24 mr-2 ${
                                item.progress === 100
                                  ? "bg-gray-100 dark:bg-gray-800 [&>div]:bg-green-500"
                                  : item.status === "overdue"
                                    ? "bg-gray-100 dark:bg-gray-800 [&>div]:bg-red-500"
                                    : "bg-gray-100 dark:bg-gray-800 [&>div]:bg-blue-500"
                              }`}
                            />
                            <span className="text-sm">{item.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requirements Tab Content */}
        <TabsContent value="requirements" className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requirements..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Requirements List */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Compliance Requirements</CardTitle>
              <CardDescription>Manage and configure compliance requirements for different entity types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-sm">ID</th>
                      <th className="text-left p-4 font-medium text-sm">Name</th>
                      <th className="text-left p-4 font-medium text-sm">Frequency</th>
                      <th className="text-left p-4 font-medium text-sm">Applicable Entities</th>
                      <th className="text-left p-4 font-medium text-sm">Required Documents</th>
                      <th className="text-left p-4 font-medium text-sm">Status</th>
                      <th className="text-left p-4 font-medium text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequirements.map((requirement) => (
                      <tr
                        key={requirement.id}
                        className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => viewRequirementDetails(requirement)}
                      >
                        <td className="p-4">
                          <span className="font-mono text-sm">{requirement.id}</span>
                        </td>
                        <td className="p-4 font-medium">{requirement.name}</td>
                        <td className="p-4">{getFrequencyBadge(requirement.frequency)}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {requirement.applicableEntities.slice(0, 2).map((entity, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {entity}
                              </Badge>
                            ))}
                            {requirement.applicableEntities.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{requirement.applicableEntities.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {requirement.requiredDocuments.slice(0, 2).map((doc, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {doc}
                              </Badge>
                            ))}
                            {requirement.requiredDocuments.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{requirement.requiredDocuments.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge
                            className={
                              requirement.active
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
                            }
                          >
                            {requirement.active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab Content */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Calendar</CardTitle>
              <CardDescription>View upcoming compliance deadlines and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-12 border-2 border-dashed rounded-lg">
                <CalendarIcon className="h-12 w-12 mx-auto text-gray-400" />
                <h3 className="mt-4 text-lg font-medium">Calendar View Coming Soon</h3>
                <p className="mt-2 text-sm text-gray-500">
                  We&apos;re working on a comprehensive calendar view for compliance deadlines.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab Content */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Settings</CardTitle>
              <CardDescription>Configure compliance monitoring and notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Notification Settings</h3>
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-upcoming" defaultChecked />
                    <Label htmlFor="notify-upcoming">Notify clients of upcoming compliance deadlines</Label>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="notify-days-30">30 days before</Label>
                      <div className="flex items-center mt-1">
                        <Checkbox id="notify-days-30" defaultChecked />
                        <Input className="ml-2 w-16" type="number" defaultValue={30} min={1} max={365} />
                        <span className="ml-2">days</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notify-days-15">15 days before</Label>
                      <div className="flex items-center mt-1">
                        <Checkbox id="notify-days-15" defaultChecked />
                        <Input className="ml-2 w-16" type="number" defaultValue={15} min={1} max={365} />
                        <span className="ml-2">days</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notify-days-7">7 days before</Label>
                      <div className="flex items-center mt-1">
                        <Checkbox id="notify-days-7" defaultChecked />
                        <Input className="ml-2 w-16" type="number" defaultValue={7} min={1} max={365} />
                        <span className="ml-2">days</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-overdue" defaultChecked />
                    <Label htmlFor="notify-overdue">Send overdue notifications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="notify-admin" defaultChecked />
                    <Label htmlFor="notify-admin">Notify administrators of client compliance status</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Compliance Monitoring</h3>
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-track" defaultChecked />
                    <Label htmlFor="auto-track">Automatically track compliance deadlines based on entity type</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-remind" defaultChecked />
                    <Label htmlFor="auto-remind">Send automatic reminders for document collection</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="escalate" defaultChecked />
                    <Label htmlFor="escalate">Escalate overdue compliance items to account managers</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Document Requirements</h3>
                <div className="grid gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="require-docs" defaultChecked />
                    <Label htmlFor="require-docs">Require document uploads for compliance verification</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="auto-verify" />
                    <Label htmlFor="auto-verify">Enable automatic document verification (Beta)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="doc-expiry" defaultChecked />
                    <Label htmlFor="doc-expiry">Track document expiration dates</Label>
                  </div>
                </div>
              </div>

              <Button className="bg-purple-600 hover:bg-purple-700">Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compliance Item Details Dialog */}
      {selectedItem && (
        <Dialog open={showItemDialog} onOpenChange={setShowItemDialog}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">{selectedItem.name}</DialogTitle>
              <DialogDescription>
                {selectedItem.id} - {selectedItem.company}
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              {/* Item Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Type</h3>
                  <p>{selectedItem.type}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                  {getStatusBadge(selectedItem.status)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Priority</h3>
                  {getPriorityBadge(selectedItem.priority)}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Due Date</h3>
                  <p>{selectedItem.dueDate}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h3>
                  <p>{selectedItem.assignedTo}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h3>
                  <p>{selectedItem.lastUpdated}</p>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Progress</h3>
                  <span className="text-sm">{selectedItem.progress}%</span>
                </div>
                <Progress
                  value={selectedItem.progress}
                  className={`h-2 ${
                    selectedItem.progress === 100
                      ? "bg-gray-100 dark:bg-gray-800 [&>div]:bg-green-500"
                      : selectedItem.status === "overdue"
                        ? "bg-gray-100 dark:bg-gray-800 [&>div]:bg-red-500"
                        : "bg-gray-100 dark:bg-gray-800 [&>div]:bg-blue-500"
                  }`}
                />
              </div>

              {/* Notes */}
              {selectedItem.notes && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Notes</h3>
                  <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-md text-sm">{selectedItem.notes}</div>
                </div>
              )}

              {/* Documents */}
              {selectedItem.documents && selectedItem.documents.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Documents</h3>
                    <Button variant="outline" size="sm" className="h-8">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Document
                    </Button>
                  </div>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium">Document</th>
                          <th className="text-left p-3 text-xs font-medium">Status</th>
                          <th className="text-left p-3 text-xs font-medium">Upload Date</th>
                          <th className="text-left p-3 text-xs font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.documents.map((doc) => (
                          <tr key={doc.id} className="border-t">
                            <td className="p-3 text-sm">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-gray-400" />
                                <span>{doc.name}</span>
                              </div>
                              {doc.notes && <p className="text-xs text-gray-500 mt-1 ml-6">{doc.notes}</p>}
                            </td>
                            <td className="p-3">{getDocumentStatusBadge(doc.status)}</td>
                            <td className="p-3 text-sm">{doc.uploadDate}</td>
                            <td className="p-3">
                              <div className="flex space-x-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc)
                                        setDocumentStatus("approved")
                                        setShowDocumentDialog(true)
                                      }}
                                    >
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedDocument(doc)
                                        setDocumentStatus("rejected")
                                        setShowDocumentDialog(true)
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Conversation */}
              {selectedItem.messages && selectedItem.messages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Communication History</h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto p-1">
                    {selectedItem.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-3 rounded-lg ${
                          message.senderType === "client"
                            ? "bg-blue-50 dark:bg-blue-900/20 ml-0 mr-12"
                            : message.senderType === "agent"
                              ? "bg-gray-50 dark:bg-gray-800 ml-12 mr-0"
                              : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        <div className="flex items-center mb-1">
                          <Avatar className="h-6 w-6 mr-2">
                            {message.senderType === "client" ? (
                              <User className="h-3 w-3" />
                            ) : message.senderType === "agent" ? (
                              <MessageSquare className="h-3 w-3" />
                            ) : (
                              <Info className="h-3 w-3" />
                            )}
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{message.sender}</p>
                            <p className="text-xs text-gray-500">{message.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-sm ml-8">{message.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              {selectedItem.status !== "completed" && selectedItem.status !== "exempt" && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Add Reply</h3>
                  <Textarea
                    placeholder="Type your message here..."
                    className="min-h-[100px] mb-2"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleSendReply}
                      disabled={!replyText.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              )}

              {/* Activity Log */}
              {selectedItem.activityLog && selectedItem.activityLog.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium mb-2">Activity Log</h3>
                  <div className="border rounded-md overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="text-left p-3 text-xs font-medium">Action</th>
                          <th className="text-left p-3 text-xs font-medium">Performed By</th>
                          <th className="text-left p-3 text-xs font-medium">Timestamp</th>
                          <th className="text-left p-3 text-xs font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.activityLog
                          .slice()
                          .reverse()
                          .map((activity) => (
                            <tr key={activity.id} className="border-t">
                              <td className="p-3 text-sm">{activity.action}</td>
                              <td className="p-3 text-sm">{activity.performedBy}</td>
                              <td className="p-3 text-sm">{activity.timestamp}</td>
                              <td className="p-3 text-sm">{activity.details || "-"}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewStatus("")
                    setShowStatusChangeDialog(true)
                  }}
                >
                  Update Status
                </Button>
                <Button variant="outline" size="sm">
                  Reassign
                </Button>
                <Button variant="outline" size="sm">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={() => {
                      // Handle file upload
                    }}
                  />
                  <Upload className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                  onClick={() => setShowDeleteConfirmDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Requirement Details Dialog */}
      {selectedRequirement && (
        <Dialog open={showRequirementDialog} onOpenChange={setShowRequirementDialog}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedRequirement.name}</DialogTitle>
              <DialogDescription>{selectedRequirement.id}</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="mt-1 text-sm">{selectedRequirement.description}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Frequency</Label>
                  <div className="mt-1">{getFrequencyBadge(selectedRequirement.frequency)}</div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Applicable Entities</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedRequirement.applicableEntities.map((entity, index) => (
                      <Badge key={index} variant="outline">
                        {entity}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Required Documents</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedRequirement.requiredDocuments.map((doc, index) => (
                      <Badge key={index} variant="outline">
                        {doc}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="requirement-active">Active</Label>
                  <Checkbox id="requirement-active" checked={selectedRequirement.active} />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRequirementDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">Edit Requirement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Filter Dialog */}
      <Dialog open={showFilterDialog} onOpenChange={setShowFilterDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Filter Compliance Tasks</DialogTitle>
            <DialogDescription>Apply filters to narrow down compliance tasks</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-type">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger id="filter-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Annual Report">Annual Report</SelectItem>
                  <SelectItem value="Beneficial Ownership">Beneficial Ownership</SelectItem>
                  <SelectItem value="License Renewal">License Renewal</SelectItem>
                  <SelectItem value="Tax Filing">Tax Filing</SelectItem>
                  <SelectItem value="Foreign Qualification">Foreign Qualification</SelectItem>
                  <SelectItem value="Corporate Governance">Corporate Governance</SelectItem>
                  <SelectItem value="Tax Registration">Tax Registration</SelectItem>
                  <SelectItem value="Tax Exemption">Tax Exemption</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-priority">Priority</Label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger id="filter-priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-assignee">Assigned To</Label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger id="filter-assignee">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Thomas Garcia">Thomas Garcia</SelectItem>
                  <SelectItem value="Jessica Williams">Jessica Williams</SelectItem>
                  <SelectItem value="Unassigned">Unassigned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-date-range">Due Date Range</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filter-date-from" className="text-xs text-gray-500">
                    From
                  </Label>
                  <Input id="filter-date-from" type="date" />
                </div>
                <div>
                  <Label htmlFor="filter-date-to" className="text-xs text-gray-500">
                    To
                  </Label>
                  <Input id="filter-date-to" type="date" />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setFilterStatus("all")
                setFilterType("all")
                setFilterPriority("all")
                setFilterAssignee("all")
              }}
            >
              Reset Filters
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowFilterDialog(false)}>
              Apply Filters
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={showCreateTaskDialog} onOpenChange={setShowCreateTaskDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Compliance Task</DialogTitle>
            <DialogDescription>Create a new compliance task for a client</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-name">Task Name</Label>
                <Input id="task-name" placeholder="e.g. Annual Report Filing" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-company">Company</Label>
                <Select>
                  <SelectTrigger id="task-company">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blue-ocean">Blue Ocean Inc</SelectItem>
                    <SelectItem value="quantum">Quantum Solutions</SelectItem>
                    <SelectItem value="horizon">Horizon Group</SelectItem>
                    <SelectItem value="summit">Summit Solutions</SelectItem>
                    <SelectItem value="rapid">Rapid Ventures LLC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-type">Type</Label>
                <Select>
                  <SelectTrigger id="task-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual-report">Annual Report</SelectItem>
                    <SelectItem value="beneficial-ownership">Beneficial Ownership</SelectItem>
                    <SelectItem value="license-renewal">License Renewal</SelectItem>
                    <SelectItem value="tax-filing">Tax Filing</SelectItem>
                    <SelectItem value="foreign-qualification">Foreign Qualification</SelectItem>
                    <SelectItem value="corporate-governance">Corporate Governance</SelectItem>
                    <SelectItem value="tax-registration">Tax Registration</SelectItem>
                    <SelectItem value="tax-exemption">Tax Exemption</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-priority">Priority</Label>
                <Select>
                  <SelectTrigger id="task-priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="task-due-date">Due Date</Label>
                <Input id="task-due-date" type="date" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="task-assignee">Assign To</Label>
                <Select>
                  <SelectTrigger id="task-assignee">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="michael">Michael Brown</SelectItem>
                    <SelectItem value="sarah">Sarah Johnson</SelectItem>
                    <SelectItem value="thomas">Thomas Garcia</SelectItem>
                    <SelectItem value="jessica">Jessica Williams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea id="task-notes" placeholder="Add any additional notes or instructions" />
            </div>

            <div className="space-y-2">
              <Label>Required Documents</Label>
              <div className="border rounded-md p-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="doc-1" />
                  <Label htmlFor="doc-1">Company Information Form</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="doc-2" />
                  <Label htmlFor="doc-2">Financial Statements</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="doc-3" />
                  <Label htmlFor="doc-3">Officer/Director List</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="doc-4" />
                  <Label htmlFor="doc-4">Previous Filing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" className="mt-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Document
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateTaskDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Change Dialog */}
      <Dialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>Change the status of this compliance task</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="new-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="exempt">Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status-note">Note (Optional)</Label>
              <Textarea
                id="status-note"
                placeholder="Add a note about this status change"
                value={statusChangeNote}
                onChange={(e) => setStatusChangeNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusChangeDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleStatusChange} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Action Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {documentStatus === "approved"
                ? "Approve Document"
                : documentStatus === "rejected"
                  ? "Reject Document"
                  : "Update Document"}
            </DialogTitle>
            <DialogDescription>{selectedDocument?.name}</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-note">Note (Optional)</Label>
              <Textarea
                id="document-note"
                placeholder={
                  documentStatus === "rejected"
                    ? "Explain why this document is being rejected"
                    : "Add a note about this document"
                }
                value={documentNote}
                onChange={(e) => setDocumentNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDocumentDialog(false)}>
              Cancel
            </Button>
            <Button
              className={
                documentStatus === "approved"
                  ? "bg-green-600 hover:bg-green-700"
                  : documentStatus === "rejected"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-purple-600 hover:bg-purple-700"
              }
              onClick={handleDocumentAction}
            >
              {documentStatus === "approved" ? "Approve" : documentStatus === "rejected" ? "Reject" : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this compliance task and all associated data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteItem}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input for document upload */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={() => {
          // Handle file upload
        }}
      />
    </div>
  )
}

