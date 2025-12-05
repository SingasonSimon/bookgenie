import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import DashboardLayout from '../components/dashboard/DashboardLayout'
import DashboardTab from '../components/dashboard/DashboardTab'
import SearchTab from '../components/dashboard/SearchTab'
import CategoriesTab from '../components/dashboard/CategoriesTab'
import SubscriptionTab from '../components/dashboard/SubscriptionTab'
import UsersTab from '../components/dashboard/UsersTab'
import AnalyticsTab from '../components/dashboard/AnalyticsTab'
import BooksTab from '../components/dashboard/BooksTab'
import ProfileTab from '../components/dashboard/ProfileTab'
import { useAuth } from '../contexts/AuthContext'

function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Get tab from URL or localStorage, default to 'dashboard'
  const getInitialTab = () => {
    const urlTab = searchParams.get('tab')
    if (urlTab) return urlTab
    const savedTab = localStorage.getItem('dashboard_active_tab')
    return savedTab || 'dashboard'
  }
  
  const [activeTab, setActiveTab] = useState(getInitialTab)
  
  // Update URL and localStorage when tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setSearchParams({ tab })
    localStorage.setItem('dashboard_active_tab', tab)
  }

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab onNavigateToTab={setActiveTab} />
      case 'search':
        return <SearchTab />
      case 'categories':
        return <CategoriesTab />
      case 'profile':
        return <ProfileTab />
      case 'subscription':
        // Only allow students to access subscription tab
        return user?.role !== 'admin' ? <SubscriptionTab /> : <DashboardTab />
      case 'users':
        return user?.role === 'admin' ? <UsersTab /> : null
      case 'analytics':
        return user?.role === 'admin' ? <AnalyticsTab /> : null
      case 'books':
        return user?.role === 'admin' ? <BooksTab /> : null
      default:
        return <DashboardTab />
    }
  }

  if (!user) return null

  return (
    <DashboardLayout
      user={user}
      activeTab={activeTab}
      onTabChange={handleTabChange}
      onLogout={handleLogout}
      onHomeClick={() => navigate('/')}
    >
      {renderTabContent()}
    </DashboardLayout>
  )
}

export default DashboardPage
