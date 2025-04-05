"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Shield,
  Bell,
  User,
  LogOut,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Filter,
  Search,
  Phone,
  Ambulance,
  FileText,
  ArrowUpRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useComplaintStore } from "../../../lib/stores/complaintStore"

// Define the Complaint interface based on the properties being used
interface Complaint {
  id: string;
  description: string;
  locationAddress: string;
  createdAt: Date | string;
  Resolved?: boolean;
  ActionTaken?: boolean;
  PoliceAssigned?: boolean;
  PoliceDispatched?: boolean;
  PoliceArrived?: boolean;
  voicemailReceived?: boolean;
}

export default function PoliceDashboardPage() {
  const [activeTab, setActiveTab] = useState("urgent")
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState("list")
  const { complaints } = useComplaintStore()

  const transformedTasks = complaints.map(complaint => ({
    id: complaint.id,
   
    description: complaint.description,
    location: complaint.locationAddress,
    distance: "N/A",
    severity: "medium",
    status: "urgent",
    timestamp: complaint.createdAt instanceof Date ? complaint.createdAt.toISOString() : String(complaint.createdAt),
    complainant: {
      name: "Anonymous",
      phone: "Not provided",
    },
  }))

  const filteredTasks = transformedTasks.filter((task) => {
    if (activeTab === "urgent" && task.status !== "urgent") return false
    if (activeTab === "in_progress" && task.status !== "in_progress") return false
    if (activeTab === "resolved" && task.status !== "resolved") return false

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        task.id.toLowerCase().includes(query) ||
       
        task.description.toLowerCase().includes(query) ||
        task.location.toLowerCase().includes(query)
      )
    }

    return true
  })

  const taskStats = {
    urgent: transformedTasks.filter((t) => t.status === "urgent").length,
    new: transformedTasks.filter((t) => t.status === "new").length,
    inProgress: transformedTasks.filter((t) => t.status === "in_progress").length,
    resolved: transformedTasks.filter((t) => t.status === "resolved").length,
  }
  const getTaskStatus = (complaint: Complaint) => {
    if (complaint.Resolved) return 'resolved';
    if (complaint.ActionTaken) return 'pending';
    if (complaint.PoliceAssigned || complaint.PoliceDispatched || complaint.PoliceArrived) return 'in_progress';
    
    // Urgent = New + (Voicemail OR <1 hour old)
    const isNewUrgent = complaint.voicemailReceived || 
      (Date.now() - new Date(complaint.createdAt).getTime() < 3600000);
    
    return isNewUrgent ? 'urgent' : 'new';
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "low":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
            Low
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
            Medium
          </Badge>
        )
      case "high":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500">
            High
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "urgent":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500">
            Urgent
          </Badge>
        )
     
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-500">
            In Progress
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
            Pending
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500">
            Resolved
          </Badge>
        )
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-BLACK" />
            <span className="text-xl font-bold">SATYAFIR</span>
          </div>
          <nav className="ml-auto flex items-center gap-4 sm:gap-6">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notifications</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder.svg" alt="Officer" />
                    <AvatarFallback>JS</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Officer John Smith</DropdownMenuLabel>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Badge #4567</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="mr-2 h-4 w-4" />
                  Shift Schedule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Officer Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, Officer John Smith</p>
          </div>
         
        </div>

        <div className="grid gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-red-50 dark:bg-red-950/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Urgent Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <div className="text-2xl font-bold">{taskStats.urgent}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-indigo-500 mr-2" />
                  <div className="text-2xl font-bold">{taskStats.inProgress}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Resolved Today</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <div className="text-2xl font-bold">{taskStats.resolved}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" size="sm" className="gap-2">
              <Phone className="h-4 w-4 text-red-500" />
              Emergency Services
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Ambulance className="h-4 w-4 text-blue-500" />
              Request Ambulance
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="h-4 w-4 text-yellow-500" />
              Request Backup
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Task Management</CardTitle>
                  <CardDescription>View and manage all assigned tasks</CardDescription>
                </div>
                
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search tasks..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

             
                <Tabs defaultValue="urgent" onValueChange={setActiveTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="urgent" className="relative">
                      Urgent
                      {taskStats.urgent > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                          {taskStats.urgent}
                        </span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No tasks found</p>
                      </div>
                    ) : (
                      filteredTasks.map((task) => (
                        <Card key={task.id} className="overflow-hidden">
                          <CardContent className="p-0">
                            <Link
                              href={`/police/tasks/${task.id}`}
                              className="block p-6 hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                  
                                    {getStatusBadge(task.status)}
                                    {getSeverityBadge(task.severity)}
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-1">{task.description}</p>
                                  <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-3 w-3 text-muted-foreground" />
                                    <span>{task.location}</span>
                                    <span className="text-xs text-muted-foreground">({task.distance} away)</span>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:items-end gap-1">
                                  <div className="text-sm font-medium">ID: {task.id}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(task.timestamp).toLocaleString()}
                                  </div>
                                  <Button size="sm" variant="outline" className="mt-2 gap-1">
                                    View Details
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </Link>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </Tabs>
             
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}