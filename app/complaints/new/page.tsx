"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Shield, ArrowLeft, MapPin, Camera, Mic, Upload, ChevronRight, CheckCircle, X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ComplaintTypeSelector } from "@/components/complaint-type-selector"
import { useComplaintStore } from '../../../lib/stores/complaintStore'

export default function NewComplaintPage() {
  const router = useRouter()
  const [id, setId] = useState("")
  const [step, setStep] = useState(1)
  const [complaintType, setComplaintType] = useState("")
  const [description, setDescription] = useState("")
  const [locationAddress, setLocationAddress] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactMethod, setContactMethod] = useState("phone")
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { complaints } = useComplaintStore()
  const { addComplaint } = useComplaintStore()
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
const [evidenceDescription, setEvidenceDescription] = useState('');

  const handleNext = () => {
    setStep(step + 1)
    window.scrollTo(0, 0)
  }

  const handleBack = () => {
    setStep(step - 1)
    window.scrollTo(0, 0)
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
  
    try {
      // 1. Upload evidence files to IPFS
      const evidenceCids = await Promise.all(
        evidenceFiles.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch('/api/uploadany', {
            method: 'POST',
            body: formData,
          });
  
          if (!response.ok) throw new Error('File upload failed');
          
          const data = await response.json();
          return data.ipfsHash;
        })
      );
  
      // 2. Create complete complaint object
      const trackingId = `COMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const complaintData = {
        trackingId,
        description,
        locationAddress,
        evidenceFiles: evidenceCids,
        evidenceDescription,
        contactName: contactName || 'NIL',
        contactEmail: contactEmail || 'NIL',
        createdAt: new Date().toISOString(),
        voicemailReceived: false,
        AIProcessingCompleted: false,
        PoliceAssigned: false,
        PoliceDispatched: false,
        PoliceArrived: false,
        ActionTaken: false,
        Resolved: false
      };
  
      // 3. Upload complete data to IPFS
      const jsonBlob = new Blob([JSON.stringify(complaintData)], { type: 'application/json' });
      const jsonFile = new File([jsonBlob], 'complaint.json');
      
      const finalFormData = new FormData();
      finalFormData.append('file', jsonFile);
      
      const ipfsResponse = await fetch('/api/uploadany', {
        method: 'POST',
        body: finalFormData,
      });
  
      if (!ipfsResponse.ok) throw new Error('Data upload failed');
      
      const { ipfsHash } = await ipfsResponse.json();
      console.log('IPFS Hash:', ipfsHash);
      // 4. Send to insert endpoint
      const insertResponse = await fetch('http://localhost:5000/insert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ipfsHash: ipfsHash,
          trackingId
        }),
      });
      
      if (!insertResponse.ok) throw new Error('Database insertion failed');
      
      // Get the response data with tracking ID
      setId(trackingId);
  
      if (!insertResponse.ok) throw new Error('Database insertion failed');
  
     
      
  
      // 6. Move to confirmation
      setStep(6);
      router.prefetch('/');
  
    } catch (error) {
      console.error('Submission error:', error);
      // Handle error state here
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-8 px-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary/20 text-primary border-2 border-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step ? <CheckCircle className="h-5 w-5" /> : i}
            </div>
            <span className="text-xs mt-1 hidden sm:block">
              {i === 1 ? "Type" : i === 2 ? "Location" : i === 3 ? "Evidence" : i === 4 ? "Contact" : "Review"}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center px-4 md:px-6">
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Link>
          <div className="flex items-center gap-2 ml-4">
            <Shield className="h-6 w-6 text-black" />
            <span className="text-xl font-bold">SATYAFIR</span>
          </div>
        </div>
      </header>

      <main className="container px-4 md:px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-2">Register New Complaint</h1>
          <p className="text-muted-foreground mb-6">
            Please provide the details of your complaint. All information will be kept confidential.
          </p>

          {step < 6 && renderStepIndicator()}

          {/* Step 1 - Complaint Type */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Complaint Type</CardTitle>
                <CardDescription>Select the type of complaint you want to register</CardDescription>
              </CardHeader>
              <CardContent>
                <ComplaintTypeSelector selectedType={complaintType} onSelect={setComplaintType} />
                <div className="mt-6 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Brief Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Please describe the issue in detail"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" asChild>
                  <Link href="/">Cancel</Link>
                </Button>
                <Button onClick={handleNext} disabled={!complaintType || !description}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 2 - Location */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Location Details</CardTitle>
                <CardDescription>Provide the location where the incident occurred</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="Enter the address"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext} disabled={!locationAddress}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 3 - Evidence */}
          {step === 3 && (
  <Card>
    <CardHeader>
      <CardTitle>Step 3: Evidence Submission</CardTitle>
      <CardDescription>Upload photos, videos, or audio recordings related to your complaint</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      {/* File Upload Section */}
      <div className="border rounded-md p-4">
        <input
          type="file"
          multiple
          onChange={(e) => setEvidenceFiles(Array.from(e.target.files || []))}
          className="hidden"
          id="file-upload"
        />
        <Label htmlFor="file-upload" className="cursor-pointer">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Click to upload files</p>
          </div>
        </Label>
        
        {/* Display Uploaded Files */}
        {evidenceFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Uploaded Files:</p>
            {evidenceFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <span className="text-sm truncate">{file.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEvidenceFiles(evidenceFiles.filter((_, i) => i !== index))}
                >
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evidence Description Input */}
      <div className="space-y-2">
        <Label htmlFor="evidence-description">Evidence Description</Label>
        <textarea
          id="evidence-description"
          value={evidenceDescription}
          onChange={(e) => setEvidenceDescription(e.target.value)}
          className="w-full p-2 border rounded-md min-h-[100px]"
          placeholder="Add any additional information about the evidence..."
        />
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline" onClick={handleBack}>
        Back
      </Button>
      <Button onClick={handleNext}>
        Next
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </CardFooter>
  </Card>
)}
          {/* Step 4 - Contact */}
          {step === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Contact Information</CardTitle>
                <CardDescription>Provide your contact details so we can update you on your complaint</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button onClick={handleNext}>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Step 5 - Review */}
          {step === 5 && (
  <Card>
    <CardHeader>
      <CardTitle>Step 5: Review & Submit</CardTitle>
      <CardDescription>Please review your complaint details before submitting</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="space-y-4">
        {/* Existing sections */}
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Complaint Type</h3>
          <p>{complaintType}</p>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Location</h3>
          <p>{locationAddress}</p>
        </div>

        {/* New Evidence Section */}
        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Evidence</h3>
          <div className="space-y-3">
            {evidenceFiles.length > 0 ? (
              <>
                <p className="text-sm font-medium">Uploaded Files:</p>
                <div className="space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <div 
                      key={index}
                      className="flex items-center p-2 bg-muted rounded"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No files uploaded</p>
            )}

            <div className="pt-2">
              <p className="text-sm font-medium">Evidence Description:</p>
              <p className="text-sm text-muted-foreground">
                {evidenceDescription || "No additional description provided"}
              </p>
            </div>
          </div>
        </div>

        <div className="border rounded-md p-4">
          <h3 className="font-medium mb-2">Contact Information</h3>
          <p>{contactEmail}</p>
        </div>
      </div>
    </CardContent>
    <CardFooter className="flex justify-between">
      <Button variant="outline" onClick={handleBack}>
        Back
      </Button>
      <Button onClick={handleSubmit}>
        {isSubmitting ? "Submitting..." : "Submit Complaint"}
      </Button>
    </CardFooter>
  </Card>
)}

          {/* Step 6 - Confirmation */}
          {step === 6 && (
            <Card>
                <CardHeader className="text-center pb-2">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />

                <CardTitle>Complaint Submitted Successfully!</CardTitle>
                <CardDescription>
                  Your complaint has been registered with ID: {id}
                </CardDescription>
                </CardHeader>
              <CardContent className="text-center">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button asChild className="flex-1">
                    <Link href="/">Return to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}