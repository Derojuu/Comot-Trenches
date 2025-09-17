"use client"

import { useState, useRef, useEffect } from "react"
import { QrCode, CheckCircle, AlertTriangle, XCircle, ArrowLeft, MessageCircle, Camera, Mic, MicOff, Volume2, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QRScanner } from "@/components/qr-scanner"
import { LanguageSelector, useLanguageSelection } from "@/components/language-selector"
import { DrugExplanationCard, DrugExplanationCardSkeleton, DrugExplanationError } from "@/components/drug-explanation-card"
import { QRScanForExplanation } from "@/components/qr-scan-for-explanation"
import { ScanResultPreview } from "@/components/scan-result-preview"
import { SupportedLanguageCode } from "@/lib/drug-explanation-frontend-types"
import Link from "next/link"

interface ChatMessage {
  type: "user" | "ai"
  content: string
  timestamp: string
}

interface ScanResult {
  id: string
  status: "genuine" | "suspicious" | "fake"
  drugName: string
  batchId: string
  manufacturer: string
  expiryDate: string
  verificationScore: number
  safetyRating: string
  aiRecommendation: string
  sideEffects: string[]
  dosage: string
}

// Convert ScanResult for consistency
const convertScanResult = (scanResult: ScanResult) => ({
  id: scanResult.id,
  status: scanResult.status,
  drugName: scanResult.drugName,
  batchId: scanResult.batchId,
  manufacturer: scanResult.manufacturer,
  expiryDate: scanResult.expiryDate,
  verificationScore: scanResult.verificationScore,
  safetyRating: scanResult.safetyRating,
  aiRecommendation: scanResult.aiRecommendation,
  sideEffects: scanResult.sideEffects,
  dosage: scanResult.dosage
})

// Mock scan results for consumers
const mockConsumerResults: ScanResult[] = [
  {
    id: "consumer-genuine-1",
    status: "genuine",
    drugName: "Paracetamol 500mg",
    batchId: "BT-2024-001",
    manufacturer: "PharmaCorp Ltd",
    expiryDate: "2025-12-15",
    verificationScore: 98,
    safetyRating: "Safe to Use",
    aiRecommendation: "This medication is authentic and safe. Take as prescribed by your healthcare provider.",
    sideEffects: ["Nausea", "Dizziness", "Stomach upset"],
    dosage: "Take 1-2 tablets every 4-6 hours as needed",
  },
  {
    id: "consumer-suspicious-1",
    status: "suspicious",
    drugName: "Amoxicillin 250mg",
    batchId: "BT-2024-002",
    manufacturer: "Unknown",
    expiryDate: "2024-08-20",
    verificationScore: 45,
    safetyRating: "Caution Required",
    aiRecommendation: "This medication shows suspicious characteristics. Please consult your pharmacist before use.",
    sideEffects: ["Unknown"],
    dosage: "Consult healthcare provider",
  },
]

// Simple inline ExplainButton component
function ExplainButton({ 
  scanResult, 
  selectedLanguage, 
  onExplanationStart, 
  onExplanationSuccess, 
  onExplanationError, 
  disabled 
}: {
  scanResult: any;
  selectedLanguage: string;
  onExplanationStart?: () => void;
  onExplanationSuccess?: (explanation: any) => void;
  onExplanationError?: (error: string, message: string) => void;
  disabled?: boolean;
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!scanResult || isLoading || disabled) return;

    setIsLoading(true);
    onExplanationStart?.();

    try {
      const apiPayload = {
        verificationData: {
          drugName: scanResult.drugName,
          status: scanResult.status === 'genuine' ? 'SAFE' : 
                 scanResult.status === 'fake' ? 'NOT_SAFE' : 'SUSPICIOUS',
          reasons: [scanResult.aiRecommendation || 'Scanned medication'],
          batchId: scanResult.batchId,
          manufacturer: scanResult.manufacturer,
          expiryDate: scanResult.expiryDate,
          trustScore: scanResult.verificationScore || 0
        },
        language: selectedLanguage || 'en'
      };

      const response = await fetch('/api/drug-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiPayload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.status === 'error') throw new Error(result.message || 'API error');
      onExplanationSuccess?.(result);
    } catch (error) {
      onExplanationError?.('api-error', error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={disabled || !scanResult || isLoading} size="sm">
      {isLoading ? (
        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Explaining...</>
      ) : (
        <><MessageSquare className="h-4 w-4 mr-2" />Explain This Scan</>
      )}
    </Button>
  );
}

// Simple useExplanationRequest hook
function useExplanationRequest() {
  const [explanationState, setExplanationState] = useState({
    isLoading: false,
    error: null as string | null,
    data: null as any,
    requestedLanguage: null as SupportedLanguageCode | null
  });

  const handleExplanationStart = () => {
    setExplanationState(prev => ({ ...prev, isLoading: true, error: null }));
  };

  const handleExplanationSuccess = (explanation: any, batchId?: string, language?: string) => {
    setExplanationState({ 
      isLoading: false, 
      error: null, 
      data: explanation,
      requestedLanguage: (language as SupportedLanguageCode) || null
    });
  };

  const handleExplanationError = (error: string, message: string) => {
    setExplanationState(prev => ({ ...prev, isLoading: false, error: message }));
  };

  const getCachedExplanation = (batchId: string, language: string) => {
    // Simple implementation - in a real app this would check localStorage or a cache
    return null;
  };

  const clearExplanation = () => {
    setExplanationState({ isLoading: false, error: null, data: null, requestedLanguage: null });
  };

  return {
    explanationState,
    handleExplanationStart,
    handleExplanationSuccess,
    handleExplanationError,
    getCachedExplanation,
    clearExplanation
  };
}

export default function ConsumerScanPage() {

  const [isScanning, setIsScanning] = useState(false)

  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  
  const [showAIChat, setShowAIChat] = useState(false)

  const [chatMessages, setChatMessages] = useState<ChatMessage[]> ([])
  
  const [chatInput, setChatInput] = useState("")

  const [lastScanTime, setLastScanTime] = useState<string>("")

  const [isAILoading, setIsAILoading] = useState(false)

  const [isListening, setIsListening] = useState(false)
  
  const [qrScanError, setQrScanError] = useState<string | null>(null)
  const [showLegacyScanner, setShowLegacyScanner] = useState(false)
  
  const [userProfile, setUserProfile] = useState({
    weight: "",
    age: "",
    currentMedications: [] as string[]
  })

  // Drug Explanation State
  const { selectedLanguage, onLanguageChange } = useLanguageSelection('en')
  const {
    explanationState,
    handleExplanationStart,
    handleExplanationSuccess,
    handleExplanationError,
    getCachedExplanation,
    clearExplanation
  } = useExplanationRequest()

  const videoRef = useRef<HTMLVideoElement>(null)
  
  const recognitionRef = useRef<any>(null)

  // Load chat messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('consumerChatMessages')
    if (savedMessages) {
      try {
        setChatMessages(JSON.parse(savedMessages))
      } catch (error) {
        console.error('Error loading chat messages:', error)
      }
    }
  }, [])

  // Save chat messages to localStorage whenever they change
  useEffect(() => {
    if (chatMessages.length > 0) {
      localStorage.setItem('consumerChatMessages', JSON.stringify(chatMessages))
    }
  }, [chatMessages])

  // Clear chat function with localStorage cleanup
  const clearChat = () => {
    setChatMessages([])
    localStorage.removeItem('consumerChatMessages')
  }

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // TypeScript-safe way to access SpeechRecognition
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        
        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = "en-US"
        
        recognition.onstart = () => {
          setIsListening(true)
        }
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setChatInput(transcript)
          setIsListening(false)
        }
        
        recognition.onend = () => {
          setIsListening(false)
        }
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      }
    }
  }, [])

  // Voice input functions
  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start()
      } catch (error) {
        console.error('Error starting speech recognition:', error)
      }
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
  }

  // Check if speech recognition is supported
  const isSpeechRecognitionSupported = () => {
    return typeof window !== 'undefined' && 
           ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  }

  // Handle QR code scan results
  const handleQRScan = (qrData: string) => {
    console.log('QR Code scanned:', qrData)
    
    // Process the QR data and generate result
    const result = processQRCodeData(qrData)
    setScanResult(result)
    setLastScanTime(new Date().toLocaleTimeString())
  }

  // Handle QR scanner errors
  const handleQRError = (error: string) => {
    console.error('QR Scanner error:', error)
    setQrScanError(error)
  }

  // Handle QR scan results from new component
  const handleQRScanResult = (result: ScanResult) => {
    console.log('QR scan result:', result)
    setScanResult(result)
    setLastScanTime(new Date().toLocaleTimeString())
    setQrScanError(null)
  }

  // Handle QR scan errors from new component  
  const handleQRScanError = (error: string) => {
    console.error('QR scan error:', error)
    setQrScanError(error)
  }

  // Process QR code data and return a scan result
  const processQRCodeData = (qrData: string): ScanResult => {
    // In a real app, you would send this to your backend API
    // For now, we'll simulate based on the QR data content

    try {
      // Try to parse JSON data
      const parsedData = JSON.parse(qrData)

      if (parsedData.drugName && parsedData.batchId) {
        // Real medicine data
        return {
          id: `scan-${Date.now()}`,
          status: parsedData.status || "genuine",
          drugName: parsedData.drugName,
          batchId: parsedData.batchId,
          manufacturer: parsedData.manufacturer || "Unknown Manufacturer",
          expiryDate: parsedData.expiryDate || "Unknown",
          verificationScore: parsedData.verificationScore || 95,
          safetyRating: parsedData.safetyRating || "Safe to Use",
          aiRecommendation: parsedData.aiRecommendation || "This medication appears to be authentic. Follow prescribed dosage.",
          sideEffects: parsedData.sideEffects || ["Consult healthcare provider"],
          dosage: parsedData.dosage || "Follow prescription instructions",
        }
      }
    } catch (e) {
      // Not JSON, treat as plain text or demo data
    }

    // For demo purposes, return a random result based on QR content
    const isDemo = qrData.includes('demo') || qrData.includes('test')
    const randomResult = mockConsumerResults[Math.floor(Math.random() * mockConsumerResults.length)]

    return {
      ...convertScanResult(randomResult),
      id: `scan-${Date.now()}`,
      // Add the scanned QR data for reference
      batchId: qrData.length > 20 ? qrData.substring(0, 20) + '...' : qrData
    }
  }

  const stopScan = () => {
    setIsScanning(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach((track: MediaStreamTrack) => track.stop())
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || isAILoading) return

    const userMessage: ChatMessage = { 
      type: "user", 
      content: chatInput,
      timestamp: new Date().toISOString()
    }
    
    // Add user message immediately
    setChatMessages(prev => [...prev, userMessage])
    
    // Clear input and set loading
    const currentInput = chatInput
    setChatInput("")
    setIsAILoading(true)

    try {
      // Call the Gemini API with enhanced context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentInput,
          scanResult: scanResult,
          userProfile: userProfile,
          features: {
            drugInteractionCheck: true,
            dosageCalculation: true
          }
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get AI response')
      }

      const data = await response.json()
      
      const aiResponse: ChatMessage = {
        type: "ai",
        content: data.message,
        timestamp: new Date().toISOString()
      }

      setChatMessages(prev => [...prev, aiResponse])
      
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Fallback response if API fails
      const fallbackResponse: ChatMessage = {
        type: "ai",
        content: "I'm sorry, I'm having trouble connecting right now. Please consult your healthcare provider or pharmacist for medication guidance.",
        timestamp: new Date().toISOString()
      }
      
      setChatMessages(prev => [...prev, fallbackResponse])
    } finally {
      setIsAILoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "genuine":
        return "text-emerald-600 bg-emerald-50 border-emerald-200"
      case "suspicious":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "fake":
        return "text-red-600 bg-red-50 border-red-200"
      default:
        return "text-slate-600 bg-slate-50 border-slate-200"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "genuine":
        return <CheckCircle className="w-5 h-5" />
      case "suspicious":
        return <AlertTriangle className="w-5 h-5" />
      case "fake":
        return <XCircle className="w-5 h-5" />
      default:
        return null
    }
  }

  // Drug Explanation Handlers
  const handleExplanationRequest = () => {
    if (!scanResult) return
    
    // Check cache first
    const cached = getCachedExplanation(scanResult.id, selectedLanguage)
    if (cached) {
      handleExplanationSuccess(cached, scanResult.id, selectedLanguage)
      return
    }
    
    // Clear previous explanation when starting new request
    clearExplanation()
  }

  const onExplanationSuccess = (explanation: any) => {
    if (scanResult) {
      handleExplanationSuccess(explanation, scanResult.id, selectedLanguage)
    }
  }

  const onExplanationError = (error: string, message: string) => {
    handleExplanationError(error, message)
  }

  // Clear explanation when scan result changes
  useEffect(() => {
    clearExplanation()
  }, [scanResult?.id, clearExplanation])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/consumer/profile" className="p-2 hover:bg-white rounded-lg transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-primary" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Verify Your Medication</h1>
              <p className="text-slate-600">Scan to check authenticity and get AI guidance</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={onLanguageChange}
              disabled={explanationState.isLoading}
              className="hidden sm:block"
            />
            
            {/* Explain Button */}
            <ExplainButton
              scanResult={scanResult}
              selectedLanguage={selectedLanguage}
              onExplanationStart={handleExplanationRequest}
              onExplanationSuccess={onExplanationSuccess}
              onExplanationError={onExplanationError}
              disabled={!scanResult || explanationState.isLoading}
            />
            
            <Button variant="outline" onClick={() => setShowAIChat(!showAIChat)} className="cursor-pointer border-primary/20 hover:border-primary/40 hover:bg-primary/5">
              <MessageCircle className="w-4 h-4 mr-2 text-primary" />
              AI Assistant
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Scanner Section */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-primary/10 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="text-center pb-4">
                <CardTitle className="flex items-center justify-center space-x-2 font-bold">
                  <QrCode className="w-6 h-6 text-primary" />
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Medication Scanner</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* QR Scanner Options */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => setShowLegacyScanner(false)}
                    variant={!showLegacyScanner ? "default" : "outline"}
                    className="w-full sm:w-auto"
                  >
                    Enhanced QR Scanner
                  </Button>
                  <Button
                    onClick={() => setShowLegacyScanner(true)}
                    variant={showLegacyScanner ? "default" : "outline"}
                    className="w-full sm:w-auto"
                  >
                    Legacy Scanner
                  </Button>
                </div>

                {/* Enhanced QR Scanner */}
                {!showLegacyScanner ? (
                  <div className="space-y-4">
                    <QRScanForExplanation
                      onScanResult={handleQRScanResult}
                      onScanError={handleQRScanError}
                      disabled={explanationState.isLoading}
                      className="max-w-md mx-auto"
                    />
                    
                    {/* Error display */}
                    {qrScanError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                        <p className="text-red-600 text-sm">
                          <strong>Error:</strong> {qrScanError}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Legacy QR Scanner */
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <QRScanner
                        onScan={handleQRScan}
                        onError={handleQRError}
                        width={400}
                        height={300}
                        facingMode="environment"
                        autoStart={true}
                        className="mx-auto"
                      />
                    </div>

                    {/* Scan Controls */}
                    <div className="flex justify-center">
                      {!isScanning ? (
                        <Button
                          onClick={() => setIsScanning(true)}
                          className="px-8 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Scan Medication
                        </Button>
                      ) : (
                        <Button onClick={stopScan} variant="outline" className="px-8 py-3 cursor-pointer bg-transparent border-primary/20 hover:border-primary/40 hover:bg-primary/5">
                          Stop Scan
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Scan Result */}
                {scanResult && (
                  <div className="space-y-6">
                    {/* Enhanced Scan Result Preview */}
                    <ScanResultPreview 
                      scanResult={scanResult}
                      className="max-w-2xl mx-auto"
                    />

                    {/* Legacy Scan Result Display */}
                    <Card className="border-2 border-primary/10 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between font-bold">
                          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Detailed Verification Result</span>
                          <Badge className={`${getStatusColor(scanResult.status)} border-primary/20`}>
                            {getStatusIcon(scanResult.status)}
                            <span className="ml-2 capitalize">{scanResult.status}</span>
                          </Badge>
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        {/* Drug Information */}
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg text-slate-900">{scanResult.drugName}</h3>
                            <p className="text-slate-600">Manufactured by {scanResult.manufacturer}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-slate-600">Batch ID:</span>
                              <p className="font-medium">{scanResult.batchId}</p>
                            </div>
                            <div>
                              <span className="text-slate-600">Expires:</span>
                              <p className="font-medium">{scanResult.expiryDate}</p>
                            </div>
                          </div>
                        </div>

                        {/* Safety Information */}
                        <div className={`p-4 rounded-lg border-2 border-primary/10 bg-gradient-to-r from-primary/5 to-accent/5 ${getStatusColor(scanResult.status)}`}>
                          <h4 className="font-bold mb-2">Safety Assessment</h4>
                          <p className="text-sm">{scanResult.safetyRating}</p>
                        </div>

                        {/* Dosage Information */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900">Recommended Dosage</h4>
                          <p className="text-sm text-slate-600">{scanResult.dosage}</p>
                        </div>

                        {/* Side Effects */}
                        <div className="space-y-2">
                          <h4 className="font-bold text-slate-900">Possible Side Effects</h4>
                          <div className="flex flex-wrap gap-2">
                            {scanResult.sideEffects.map((effect: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs border-primary/20 hover:border-primary/40 hover:bg-primary/5">
                                {effect}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Last scan time */}
                        {lastScanTime && (
                          <div className="text-xs text-slate-500 text-center">
                            Last scanned at {lastScanTime}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Mobile Language Selector */}
                <div className="block sm:hidden">
                  <LanguageSelector 
                    selectedLanguage={selectedLanguage}
                    onLanguageChange={onLanguageChange}
                    disabled={explanationState.isLoading}
                    className="w-full"
                  />
                </div>

                {/* Drug Explanation Card */}
                {scanResult && (
                  <div className="space-y-4">
                    {explanationState.isLoading && (
                      <DrugExplanationCardSkeleton />
                    )}

                    {explanationState.error && (
                      <DrugExplanationError 
                        error={explanationState.error}
                        onRetry={() => {
                          if (scanResult) {
                            clearExplanation()
                            handleExplanationRequest()
                          }
                        }}
                      />
                    )}

                    {explanationState.data && (
                      <DrugExplanationCard
                        explanation={explanationState.data}
                        requestedLanguage={explanationState.requestedLanguage || selectedLanguage}
                        scanResult={scanResult}
                        onDismiss={clearExplanation}
                        showRawData={true}
                      />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Chat Assistant */}
          <div className={`${showAIChat ? "block" : "hidden lg:block"}`}>
            <Card className="border-2 border-primary/10 shadow-lg backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2 font-bold">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">AI Health Assistant</span>
                  </CardTitle>
                  {chatMessages.length > 0 && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={clearChat}
                      className="text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                    >
                      Clear Chat
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Chat Messages */}
                <div className="space-y-3 h-64 overflow-y-auto">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">
                      <MessageCircle className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-sm">Ask me anything about your medication!</p>
                    </div>
                  ) : (
                    <>
                      {chatMessages.map((message: ChatMessage, index: number) => (
                        <div key={index} className={`flex flex-col ${message.type === "user" ? "items-end" : "items-start"}`}>
                          <div
                            className={`max-w-xs p-3 rounded-lg ${
                              message.type === "user" 
                                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg" 
                                : "bg-gradient-to-r from-slate-600 to-slate-700 text-white border border-slate-500 shadow-lg"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                          </div>
                          <span className="text-xs text-slate-400 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      ))}
                      
                      {/* AI Typing Indicator */}
                      {isAILoading && (
                        <div className="flex justify-start">
                          <div className="bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-3 rounded-lg">
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-slate-500 ml-2">AI is thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && !isAILoading && sendChatMessage()}
                      placeholder="Ask about dosage, side effects..."
                      disabled={isAILoading || isListening}
                      className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-colors duration-200 disabled:opacity-50 ${
                        isListening 
                          ? "border-red-400 bg-red-50" 
                          : "border-primary/20 focus:border-primary/40 hover:border-primary/30"
                      }`}
                    />
                    {isListening && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-red-600">Listening...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {isSpeechRecognitionSupported() && (
                    <Button
                      onClick={isListening ? stopListening : startListening}
                      size="sm"
                      variant="outline"
                      disabled={isAILoading}
                      className={`cursor-pointer transition-colors ${
                        isListening 
                          ? "bg-red-100 border-red-300 text-red-600 hover:bg-red-200" 
                          : "border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                  
                  <Button 
                    onClick={sendChatMessage} 
                    size="sm" 
                    disabled={isAILoading || !chatInput.trim()}
                    className="cursor-pointer bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAILoading ? (
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>AI...</span>
                      </div>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>

                {/* AI Recommendation */}
                {scanResult && (
                  <div className="bg-gradient-to-r from-primary/10 to-accent/10 border-2 border-primary/20 rounded-lg p-4 hover:shadow-md transition-all duration-200">
                    <h4 className="font-bold text-primary mb-2">AI Recommendation</h4>
                    <p className="text-sm text-slate-800">{scanResult.aiRecommendation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
