'use client'

import React, { useState, useCallback } from 'react'
import { QRScanner } from '@/components/qr-scanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QrCode, CheckCircle, AlertTriangle, XCircle, Scan } from 'lucide-react'
import { ConsumerScanResult } from '@/lib/drug-explanation-frontend-types'

interface QRScanForExplanationProps {
  onScanResult: (result: ConsumerScanResult) => void;
  onScanError: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

interface QRData {
  drugName: string;
  batchId: string;
  manufacturer: string;
  expiryDate: string;
  status: 'genuine' | 'suspicious' | 'fake';
  verificationScore?: number;
  safetyRating?: string;
  aiRecommendation?: string;
  sideEffects?: string[];
  dosage?: string;
}

export function QRScanForExplanation({ 
  onScanResult, 
  onScanError, 
  className = '',
  disabled = false
}: QRScanForExplanationProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [lastScanData, setLastScanData] = useState<string | null>(null)

  // Validate QR data has required fields
  const validateQRData = (data: any): data is QRData => {
    return (
      typeof data === 'object' &&
      data !== null &&
      typeof data.drugName === 'string' &&
      typeof data.batchId === 'string' &&
      typeof data.manufacturer === 'string' &&
      typeof data.expiryDate === 'string' &&
      (data.status === 'genuine' || data.status === 'suspicious' || data.status === 'fake')
    )
  }

  // Transform QR data to ConsumerScanResult
  const transformQRDataToScanResult = (qrData: QRData): ConsumerScanResult => {
    return {
      id: `qr-scan-${Date.now()}`,
      status: qrData.status,
      drugName: qrData.drugName,
      batchId: qrData.batchId,
      manufacturer: qrData.manufacturer,
      expiryDate: qrData.expiryDate,
      verificationScore: qrData.verificationScore || (qrData.status === 'genuine' ? 95 : qrData.status === 'suspicious' ? 60 : 15),
      safetyRating: qrData.safetyRating || (qrData.status === 'genuine' ? 'Safe to Use' : qrData.status === 'suspicious' ? 'Requires Verification' : 'Not Safe to Use'),
      aiRecommendation: qrData.aiRecommendation || (qrData.status === 'genuine' ? 'This medication appears to be authentic. Follow prescribed dosage.' : qrData.status === 'suspicious' ? 'Verification inconclusive. Consult healthcare provider.' : 'This medication appears to be counterfeit. Do not use.'),
      sideEffects: qrData.sideEffects || ['Consult healthcare provider for side effects'],
      dosage: qrData.dosage || 'Follow prescription instructions'
    }
  }

  // Handle QR scan success
  const handleQRScan = useCallback((qrDataString: string) => {
    console.log('QR Code scanned:', qrDataString)
    setLastScanData(qrDataString)
    setScanError(null)
    
    try {
      // Try to parse as JSON
      const parsedData = JSON.parse(qrDataString)
      
      // Validate the parsed data
      if (validateQRData(parsedData)) {
        const scanResult = transformQRDataToScanResult(parsedData)
        onScanResult(scanResult)
        setIsScanning(false) // Stop scanning after successful scan
      } else {
        throw new Error('QR code does not contain valid drug information')
      }
    } catch (error) {
      // Handle parsing or validation errors
      const errorMessage = error instanceof Error ? error.message : 'Invalid QR code format'
      setScanError(`Invalid QR code format: ${errorMessage}`)
      onScanError(errorMessage)
    }
  }, [onScanResult, onScanError])

  // Handle QR scan errors from scanner
  const handleQRError = useCallback((error: string) => {
    console.error('QR Scanner error:', error)
    setScanError(error)
    onScanError(error)
  }, [onScanError])

  const startScanning = () => {
    setScanError(null)
    setLastScanData(null)
    setIsScanning(true)
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'genuine':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'suspicious':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'fake':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <QrCode className="w-4 h-4 text-gray-600" />
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Control buttons */}
      {!isScanning ? (
        <Button 
          onClick={startScanning}
          disabled={disabled}
          className="w-full"
          size="lg"
        >
          <Scan className="w-5 h-5 mr-2" />
          Scan QR Code for Drug Explanation
        </Button>
      ) : (
        <div className="space-y-4">
          {/* QR Scanner */}
          <QRScanner
            onScan={handleQRScan}
            onError={handleQRError}
            autoStart={true}
            width={320}
            height={320}
            className="mx-auto"
          />
          
          {/* Stop scanning button */}
          <Button 
            variant="outline" 
            onClick={stopScanning}
            className="w-full"
          >
            Stop Scanning
          </Button>
        </div>
      )}

      {/* Error display */}
      {scanError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Scan Error:</strong> {scanError}
            <div className="mt-2 text-sm">
              Make sure the QR code contains valid drug information with:
              <ul className="list-disc list-inside mt-1">
                <li>Drug name</li>
                <li>Batch ID</li>
                <li>Manufacturer</li>
                <li>Expiry date</li>
                <li>Verification status</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Last scan data display (for debugging) */}
      {lastScanData && !scanError && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              QR Code Successfully Scanned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded">
              {lastScanData.length > 100 ? 
                lastScanData.substring(0, 100) + '...' : 
                lastScanData
              }
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <div className="text-sm text-gray-600 text-center space-y-2">
        <p>
          <strong>How to use:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
          <li>Tap "Scan QR Code for Drug Explanation"</li>
          <li>Allow camera access when prompted</li>
          <li>Point your camera at the drug QR code</li>
          <li>Wait for automatic detection and processing</li>
          <li>View the drug explanation and safety information</li>
        </ol>
      </div>
    </div>
  )
}

export default QRScanForExplanation