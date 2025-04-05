"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  Shield,
  ArrowLeft,
  MapPin,
  Phone,
  MessageSquare,
  AlertTriangle,
  Camera,
  Upload,
  Mic,
  FileText,
  Send,
  Ambulance,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ComplaintTimeline } from "@/components/complaint-timeline"
import { useComplaintStore } from "@/lib/stores/complaintStore"
import { Complaint } from "@/lib/stores/complaintStore"
import SecureFIRSystem from "../../../../src/contracts/SecureFIRSystem.sol/SecureFIRSystem.json"
import { ethers } from "ethers"

const STATUS_MAP = {
  new: { label: "New", color: "blue" },
  urgent: { label: "Urgent", color: "red" },
  in_progress: { label: "In Progress", color: "indigo" },
  pending: { label: "Pending", color: "yellow" },
  resolved: { label: "Resolved", color: "green" }
}

const TIMELINE_STEPS = [
  { id: 1, status: "received", title: "Complaint Received" },
  { id: 2, status: "processing", title: "AI Processing Completed" },
  { id: 3, status: "assigned", title: "Officer Assigned" },
  { id: 4, status: "arrived", title: "Officer Arrived" },
  { id: 5, status: "action", title: "Action Taken" },
  { id: 6, status: "resolved", title: "Resolved" }
]

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { complaints, evidenceCache } = useComplaintStore()
  const [task, setTask] = useState<Complaint | null>(null)
  const [loading, setLoading] = useState(true)
  const [activityNote, setActivityNote] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const foundComplaint = complaints.find(c => c.trackingId === params.id)
    if (foundComplaint) {
      setTask(foundComplaint)
      setLoading(false)
    } else {


      setLoading(false)
    }
  }, [params.id, complaints])
  const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS2;
  const getTaskStatus = (complaint: Complaint) => {
    if (complaint.Resolved) return 'resolved'
    if (complaint.ActionTaken) return 'pending'
    if (complaint.PoliceAssigned || complaint.PoliceDispatched || complaint.PoliceArrived) return 'in_progress'
    const isNewUrgent = complaint.voicemailReceived || 
      (Date.now() - new Date(complaint.createdAt).getTime() < 3600000)
    return isNewUrgent ? 'urgent' : 'new'
  }

  const getTimeline = (complaint: Complaint) => {
    return TIMELINE_STEPS.map(step => {
      let completed = false
      let timestamp: string | null = null
      let description = ""

      switch (step.status) {
        case 'received':
          completed = true
            timestamp = typeof complaint.createdAt === 'object' 
            ? complaint.createdAt.toISOString()
            : new Date(complaint.createdAt).toISOString()
          description = "Complaint was received and logged in the system"
          break
        case 'processing':
          completed = complaint.AIProcessingCompleted
          description = "AI system analyzed the complaint"
          break
        case 'assigned':
          completed = complaint.PoliceAssigned
          description = "Officer assigned to investigate"
          break
        
          
        case 'arrived':
          completed = complaint.PoliceArrived
          description = "Officer arrived at the scene"
          break
        case 'action':
          completed = complaint.ActionTaken
          description = "Action was taken regarding the complaint"
          break
        case 'resolved':
          completed = complaint.Resolved
          description = "Case was resolved successfully"
          break
      }

      return { ...step, completed, timestamp, description }
    })
  }

  const getEvidenceDetails = (cid: string) => {
    const file = evidenceCache[cid]
    if (!file) return null
    
    // Make sure file is a valid Blob or File object before creating URL
    if (typeof file === 'object' && file !== null && (file instanceof Blob)) {
      const url = URL.createObjectURL(file)
      const type = file.type.split('/')[0]
      return { url, type, name: file.name }
    }
    return null
  }

  const handleStatusUpdate = (newStatus: string) => {
    if (!task) return

    const updates: Partial<Complaint> = {}
    switch (newStatus) {
      case 'resolved':
        updates.AIProcessingCompleted = true
        updates.PoliceArrived = true
        updates.voicemailReceived = true
        updates.PoliceAssigned = true
        updates.ActionTaken = true
        updates.Resolved = true
        break
      case 'pending':
        updates.ActionTaken = true
        break
      case 'in_progress':
        updates.PoliceAssigned = true
        break
      case 'urgent':
        updates.voicemailReceived = true
        break
    }

   
    setTask({ ...task, ...updates })
  }

  const handleReportArrival = () => {
    if (!task) return

    
    setTask({ ...task, PoliceArrived: true })
  }

  const getSeverity = (complaint: Complaint) => {
    return complaint.voicemailReceived ? 'high' : 'medium'
  }

  if (loading) {
    return <LoadingState />
  }

  if (!task) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2 mb-8">
          <Shield className="h-8 w-8 text-black" />
          <span className="text-2xl font-bold">SATYAFIR</span>
        </div>
        <Card className="w-full max-w-3xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-muted-foreground">Loading complaint information...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timeline = getTimeline(task)
  const severity = getSeverity(task)

  async function fileFIR(trackingId: string, complaint: Complaint): Promise<void> {
    try {
      // Connect to the blockchain
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS!,
        SecureFIRSystem.abi,
        signer
      );
  
      // Prepare FIR data (use dummy data where necessary)
      const firData = {
        title: complaint.description.substring(0, 50) || "Untitled FIR",
        description: complaint.description,
        complainantName: complaint.contactName || "Anonymous",
        complainantContact: complaint.contactEmail || "N/A",
        incidentDate: Math.floor(new Date(complaint.createdAt).getTime() / 1000),
        incidentLocation: complaint.locationAddress || "Location not specified",
        category: "General Complaint", // Default category
        includeComplainantAccess: !!complaint.contactEmail,
        evidenceCids: complaint.evidenceFiles
      };
  
      // Execute the contract call
      const tx = await contract.createFIR(
        firData.title,
        firData.description,
        firData.complainantName,
        firData.complainantContact,
        firData.incidentDate,
        firData.incidentLocation,
        firData.category,
        firData.includeComplainantAccess,
        firData.evidenceCids
      );
  
      // Wait for transaction confirmation
      await tx.wait();
      
      console.log(`FIR created successfully for tracking ID: ${trackingId}`);
      alert("FIR successfully filed on blockchain");
  
    } catch (error) {
      console.error("Error filing FIR:", error);
      alert("Failed to file FIR. Please check console for details.");
      throw error;
    }
  }
  
  // Updated component usage
  const handleFileFIR = async () => {
    if (!task) return;
  
    try {
      setIsSubmitting(true);
      await fileFIR(task.trackingId, task);
      // Update local state if needed
      setTask(prev => prev ? { ...prev, Resolved: true } : null);
    } catch (error) {
      // Error handling already done in fileFIR
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-BLACK" />
            <span className="text-xl font-bold">SATYAFIR</span>
          </div>
          <Button variant="ghost" size="icon" asChild className="ml-4">
            <Link href="/police/dashboard">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Link>
          </Button>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-8">
        <div className="grid gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {task.description.substring(0, 40)}...
                      <SeverityBadge severity={severity} />
                    </CardTitle>
                    <CardDescription>Tracking ID: {task.trackingId}</CardDescription>
                  </div>
                  
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <DetailSection title="Description" content={task.description} />
                  
                  <DetailSection title="Location">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{task.locationAddress}</span>
                    </div>
                  </DetailSection>

                  <DetailSection title="Complainant Information">
                    <div className="space-y-1">
                      <p>{task.contactName || "Anonymous"}</p>
                      <p className="text-sm text-muted-foreground">{task.contactEmail}</p>
                    </div>
                  </DetailSection>

                  <DetailSection title="Evidence">
                    <div className="grid grid-cols-2 gap-4">
                      {task.evidenceFiles.map((cid: string) => {
                        const evidence = getEvidenceDetails(cid)
                        if (!evidence) return null
                        
                        return (
                          <div key={cid} className="relative group">
                            {evidence.type === 'image' && (
                              <img
                                src={evidence.url}
                                alt={evidence.name}
                                className="rounded-md object-cover h-40 w-full"
                              />
                            )}
                            {evidence.type === 'video' && (
                              <video
                                controls
                                className="rounded-md object-cover h-40 w-full"
                              >
                                <source src={evidence.url} type="video/mp4" />
                              </video>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/50 text-white text-sm">
                              {evidence.name}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </DetailSection>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start gap-4 pt-0">
                
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ComplaintTimeline timeline={timeline} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const { label, color } = {
    low: { label: "Low", color: "green" },
    medium: { label: "Medium", color: "yellow" },
    high: { label: "High", color: "red" }
  }[severity]

  return (
    <Badge variant="outline" className={`bg-${color}-100 text-${color}-800 dark:bg-${color}-900/30 dark:text-${color}-500`}>
      {label}
    </Badge>
  )
}

function StatusBadge({ status }: { status: keyof typeof STATUS_MAP }) {
  const { label, color } = STATUS_MAP[status]
  return (
    <Badge variant="outline" className={`bg-${color}-100 text-${color}-800 dark:bg-${color}-900/30 dark:text-${color}-500`}>
      {label}
    </Badge>
  )
}

function StatusSelect({ currentStatus, onUpdate }: { 
  currentStatus: string
  onUpdate: (status: string) => void 
}) {
  return (
    <Select value={currentStatus} onValueChange={onUpdate}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Update Status" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(STATUS_MAP).map(([value, { label }]) => (
          <SelectItem key={value} value={value} disabled={value === 'new' || value === 'urgent'}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function DetailSection({ title, content, children }: { 
  title: string
  content?: string
  children?: React.ReactNode
}) {
  return (
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      {content ? <p>{content}</p> : children}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">PoliceConnect</span>
      </div>
      <Card className="w-full max-w-3xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading task information...</p>
        </CardContent>
      </Card>
    </div>
  )
}

function ErrorState({ taskId }: { taskId: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-8">
        <Shield className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">PoliceConnect</span>
      </div>
      <Card className="w-full max-w-3xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
          <p className="text-muted-foreground mb-6">We couldn't find a task with the ID: {taskId}</p>
          <Button asChild>
            <Link href="/police/dashboard">Return to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}