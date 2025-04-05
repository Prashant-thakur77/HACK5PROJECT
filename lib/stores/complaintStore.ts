// store/complaintStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Complaint {
  id: string
  trackingId: string
  description: string
  locationAddress: string
  evidenceFiles: string[]
  evidenceDescription: string
  contactName: string
  contactEmail: string
  createdAt: Date
  voicemailReceived: boolean
  AIProcessingCompleted: boolean
  PoliceAssigned: boolean
  PoliceDispatched: boolean
  PoliceArrived: boolean
  ActionTaken: boolean
  Resolved: boolean
}

interface ComplaintState {
  complaints: Complaint[]
  evidenceCache: Record<string, File> // CID -> File mapping
  addComplaint: (complaint: Omit<Complaint, 'id' | 'createdAt'>) => void
  fetchComplaints: () => Promise<void>
}

export const useComplaintStore = create<ComplaintState>()(
    persist(
      (set, get) => ({
        complaints: [],
        evidenceCache: {},
        
        addComplaint: (newComplaint) => {
          const complaintWithId: Complaint = {
            ...newComplaint,
            id: `COMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            createdAt: new Date(),
          }
          set((state) => ({
            complaints: [...state.complaints, complaintWithId]
          }))
        },
  
        fetchComplaints: async () => {
          try {
            // 1. Get all complaints from backend
            const response = await fetch('http://localhost:5000/getComplaints')
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }
            
            const responseJson = await response.json()
            
            // Extract data from the response - this is the key change
            const data = responseJson.data || []
            
            // 2. Validate response structure
            if (!Array.isArray(data)) {
              throw new Error('Invalid response format: expected array in data field')
            }
        
            // 3. Process valid complaints
            const validComplaints = await Promise.all(
              data
                .filter((bc: any) => bc?.ipfsHash || bc?.ipfsCid) // Filter valid entries
                .map(async (bc: { ipfsCid?: string; ipfsHash?: string; trackingId: string }) => {
                  try {
                    const ipfsHash = bc.ipfsHash || bc.ipfsCid
                    if (!ipfsHash) return null
        
                    const complaintResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${ipfsHash}`);

                    if (!complaintResponse.ok) {
                      console.error(`Failed to fetch IPFS data for ${ipfsHash}`)
                      return null
                    }
        
                    const complaintData = await complaintResponse.json()
                    

                    // Process evidence files
                    const evidenceFiles = await Promise.all(
                      (complaintData.evidenceFiles || []).map(async (cid: string) => {
                        try {
                          if (!get().evidenceCache[cid]) {
                            const fileResponse = await fetch(`https://gateway.pinata.cloud/ipfs/${cid}`);

                            if (!fileResponse.ok) return cid // Skip failed files but keep CID
                            
                            const blob = await fileResponse.blob()
                            const fileType = fileResponse.headers.get('content-type') || 'application/octet-stream'
                            const file = new File([blob], `evidence-${cid}`, { type: fileType })
                            
                            set((state) => ({
                              evidenceCache: { ...state.evidenceCache, [cid]: file }
                            }))
                          }
                          return cid
                        } catch (error) {
                          console.error('Error processing evidence file:', cid, error)
                          return cid // Return CID even if fetch fails
                        }
                      })
                    )
        
                    return {
                      ...complaintData,
                      id: complaintData.trackingId,
                      trackingId: complaintData.trackingId,
                      evidenceFiles,
                      createdAt: new Date(complaintData.createdAt || Date.now())
                    } as Complaint
                  } catch (error) {
                    console.error('Error processing complaint:', bc.trackingId, error)
                    return null
                  }
                })
            )
        
            // 4. Filter out null values and merge with existing complaints
            const filteredComplaints = validComplaints.filter(Boolean) as Complaint[]
            
            set((state) => ({
              complaints: [
                ...filteredComplaints.filter(fc => 
                  !state.complaints.find(sc => sc.trackingId === fc.trackingId)
                ),
                ...state.complaints
              ]
            }))
        
          } catch (error) {
            console.error('Failed to fetch complaints:', error)
            // Consider adding error state to store
          }
        }
      }),
      {
        name: 'complaint-storage'
      }
    )
  )