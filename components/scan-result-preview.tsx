'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, XCircle, Package, Calendar, Building2, Hash, Star, Shield } from 'lucide-react'
import { ConsumerScanResult } from '@/lib/drug-explanation-frontend-types'

interface ScanResultPreviewProps {
  scanResult: ConsumerScanResult;
  className?: string;
}

export function ScanResultPreview({ scanResult, className = '' }: ScanResultPreviewProps) {
  // Get status styling
  const getStatusStyling = (status: ConsumerScanResult['status']) => {
    switch (status) {
      case 'genuine':
        return {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          badge: <Badge variant="default" className="bg-green-100 text-green-800 border-green-300">Genuine</Badge>,
          cardClass: 'border-green-200 bg-green-50/30'
        }
      case 'suspicious':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-yellow-600" />,
          badge: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Suspicious</Badge>,
          cardClass: 'border-yellow-200 bg-yellow-50/30'
        }
      case 'fake':
        return {
          icon: <XCircle className="w-5 h-5 text-red-600" />,
          badge: <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300">Fake</Badge>,
          cardClass: 'border-red-200 bg-red-50/30'
        }
      default:
        return {
          icon: <Package className="w-5 h-5 text-gray-600" />,
          badge: <Badge variant="outline">Unknown</Badge>,
          cardClass: 'border-gray-200'
        }
    }
  }

  // Get verification score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const styling = getStatusStyling(scanResult.status)

  return (
    <Card className={`${styling.cardClass} ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {styling.icon}
            <span>Scanned Drug Information</span>
          </div>
          {styling.badge}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Drug Name */}
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Drug Name</div>
            <div className="text-gray-700">{scanResult.drugName}</div>
          </div>
        </div>

        {/* Manufacturer */}
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Manufacturer</div>
            <div className="text-gray-700">{scanResult.manufacturer}</div>
          </div>
        </div>

        {/* Batch ID */}
        <div className="flex items-start gap-3">
          <Hash className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Batch ID</div>
            <div className="text-gray-700 font-mono text-sm">{scanResult.batchId}</div>
          </div>
        </div>

        {/* Expiry Date */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-gray-900">Expiry Date</div>
            <div className="text-gray-700">{scanResult.expiryDate}</div>
          </div>
        </div>

        {/* Verification Details */}
        <div className="border-t pt-4 space-y-3">
          {/* Verification Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Verification Score</span>
            </div>
            <span className={`font-bold ${getScoreColor(scanResult.verificationScore)}`}>
              {scanResult.verificationScore}%
            </span>
          </div>

          {/* Safety Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Safety Rating</span>
            </div>
            <span className={`font-medium ${getScoreColor(scanResult.verificationScore)}`}>
              {scanResult.safetyRating}
            </span>
          </div>
        </div>

        {/* AI Recommendation Preview */}
        <div className="border-t pt-4">
          <div className="font-medium text-gray-900 mb-2">Initial Assessment</div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {scanResult.aiRecommendation}
          </div>
        </div>

        {/* Scan Metadata */}
        <div className="border-t pt-4">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Scan ID: {scanResult.id}</div>
            <div>Scanned: {new Date().toLocaleString()}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default ScanResultPreview