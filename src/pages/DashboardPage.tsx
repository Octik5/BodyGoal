import React, { useState } from 'react'
import { DashboardLayout } from '../components/dashboard/DashboardLayout'
import { ModernDashboardOverview } from '../components/dashboard/ModernDashboardOverview'
import { Calculator } from '../components/calculator/Calculator'
import { Planner } from '../components/planner/Planner'
import { Tracker } from '../components/tracker/Tracker'
import { PhotoAnalyzer } from '../components/photo/PhotoAnalyzer'
import { SocialHub } from '../components/social/SocialHub'

export const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ModernDashboardOverview onNavigate={setActiveTab} />
      case 'calculator':
        return <Calculator />
      case 'planner':
        return <Planner />
      case 'tracker':
        return <Tracker />
      case 'photo':
        return <PhotoAnalyzer />
      case 'social':
        return <SocialHub />
      default:
        return <ModernDashboardOverview onNavigate={setActiveTab} />
    }
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  )
}
