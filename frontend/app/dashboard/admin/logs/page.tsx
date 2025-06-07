'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminRoute } from '@/components/auth/AdminRoute'
import { db } from '@/lib/firebase'
import { collection, query, orderBy, limit, where, getDocs, Timestamp } from 'firebase/firestore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Loader2, 
  RefreshCw,
  Download,
  Filter,
  AlertCircle,
  Bug,
  Info,
  AlertTriangle,
  XCircle,
  Search,
  Calendar,
  Copy,
  CheckCircle
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { LogLevel, LogCategory } from '@/lib/logging/logger'

interface LogEntry {
  id: string
  level: LogLevel
  category: LogCategory
  message: string
  userId?: string
  metadata?: Record<string, any>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  timestamp: any
  environment: string
  userAgent?: string
  url?: string
  sessionId?: string
}

const LOG_LEVEL_CONFIG: Record<LogLevel, { color: string; icon: any }> = {
  debug: { color: 'secondary', icon: Bug },
  info: { color: 'default', icon: Info },
  warn: { color: 'warning', icon: AlertTriangle },
  error: { color: 'destructive', icon: AlertCircle },
  critical: { color: 'destructive', icon: XCircle }
}

export default function LogsPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null)
  const [filters, setFilters] = useState({
    level: 'all',
    category: 'all',
    timeRange: '24h',
    search: ''
  })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [filters.level, filters.category, filters.timeRange])

  const loadLogs = async () => {
    setLoading(true)
    try {
      let q = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(100))

      // Apply filters
      const constraints = []
      
      if (filters.level !== 'all') {
        constraints.push(where('level', '==', filters.level))
      }
      
      if (filters.category !== 'all') {
        constraints.push(where('category', '==', filters.category))
      }

      // Time range filter
      if (filters.timeRange !== 'all') {
        const hoursAgo = filters.timeRange === '1h' ? 1 : 
                        filters.timeRange === '24h' ? 24 : 
                        filters.timeRange === '7d' ? 168 : 720
        const startTime = Timestamp.fromDate(subDays(new Date(), hoursAgo / 24))
        constraints.push(where('timestamp', '>=', startTime))
      }

      if (constraints.length > 0) {
        q = query(collection(db, 'logs'), ...constraints, orderBy('timestamp', 'desc'), limit(100))
      }

      const snapshot = await getDocs(q)
      const logsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as LogEntry[]

      // Apply search filter client-side
      const filteredLogs = filters.search 
        ? logsData.filter(log => 
            log.message.toLowerCase().includes(filters.search.toLowerCase()) ||
            log.userId?.includes(filters.search) ||
            log.error?.message?.toLowerCase().includes(filters.search.toLowerCase())
          )
        : logsData

      setLogs(filteredLogs)
    } catch (error) {
      console.error('Error loading logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `novatrek-logs-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const getLogIcon = (level: LogLevel) => {
    const Icon = LOG_LEVEL_CONFIG[level].icon
    return <Icon className="h-4 w-4" />
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return format(date, 'MMM dd, HH:mm:ss')
  }

  return (
    <AdminRoute>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">System Logs</h1>
            <p className="text-muted-foreground">
              Monitor errors, warnings, and system events
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadLogs} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportLogs}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Log Level</Label>
                <Select value={filters.level} onValueChange={(value) => setFilters({...filters, level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={filters.category} onValueChange={(value) => setFilters({...filters, category: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="auth">Authentication</SelectItem>
                    <SelectItem value="subscription">Subscription</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="firebase">Firebase</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="ai">AI</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Range</Label>
                <Select value={filters.timeRange} onValueChange={(value) => setFilters({...filters, timeRange: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search logs..." 
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(LOG_LEVEL_CONFIG).map(([level, config]) => {
            const count = logs.filter(log => log.level === level).length
            const Icon = config.icon
            return (
              <Card key={level}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium capitalize flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {level}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{count}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
            <CardDescription>
              Click on any log entry to view details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching your filters
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Timestamp</TableHead>
                    <TableHead className="w-[80px]">Level</TableHead>
                    <TableHead className="w-[100px]">Category</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className="w-[100px]">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow 
                      key={log.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedLog(log)}
                    >
                      <TableCell className="font-mono text-xs">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={LOG_LEVEL_CONFIG[log.level].color as any}>
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.category}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.message}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.userId ? log.userId.slice(0, 8) + '...' : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Log Details Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedLog && getLogIcon(selectedLog.level)}
                Log Details
              </DialogTitle>
              <DialogDescription>
                {selectedLog?.id}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  {selectedLog.error && <TabsTrigger value="error">Error</TabsTrigger>}
                  {selectedLog.metadata && <TabsTrigger value="metadata">Metadata</TabsTrigger>}
                  <TabsTrigger value="context">Context</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs">Level</Label>
                      <Badge variant={LOG_LEVEL_CONFIG[selectedLog.level].color as any}>
                        {selectedLog.level}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-xs">Category</Label>
                      <Badge variant="outline">{selectedLog.category}</Badge>
                    </div>
                    <div>
                      <Label className="text-xs">Timestamp</Label>
                      <p className="font-mono text-sm">
                        {selectedLog.timestamp && format(
                          selectedLog.timestamp.toDate ? selectedLog.timestamp.toDate() : new Date(selectedLog.timestamp),
                          'yyyy-MM-dd HH:mm:ss.SSS'
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs">Environment</Label>
                      <p className="text-sm">{selectedLog.environment}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Message</Label>
                    <Alert>
                      <AlertDescription>{selectedLog.message}</AlertDescription>
                    </Alert>
                  </div>

                  {selectedLog.userId && (
                    <div>
                      <Label className="text-xs">User ID</Label>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {selectedLog.userId}
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(selectedLog.userId!, selectedLog.id)}
                        >
                          {copiedId === selectedLog.id ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {selectedLog.error && (
                  <TabsContent value="error" className="space-y-4">
                    <div>
                      <Label className="text-xs">Error Name</Label>
                      <p className="font-medium">{selectedLog.error.name}</p>
                    </div>
                    <div>
                      <Label className="text-xs">Error Message</Label>
                      <Alert variant="destructive">
                        <AlertDescription>{selectedLog.error.message}</AlertDescription>
                      </Alert>
                    </div>
                    {selectedLog.error.code && (
                      <div>
                        <Label className="text-xs">Error Code</Label>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {selectedLog.error.code}
                        </code>
                      </div>
                    )}
                    {selectedLog.error.stack && (
                      <div>
                        <Label className="text-xs">Stack Trace</Label>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                          {selectedLog.error.stack}
                        </pre>
                      </div>
                    )}
                  </TabsContent>
                )}

                {selectedLog.metadata && (
                  <TabsContent value="metadata">
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </TabsContent>
                )}

                <TabsContent value="context" className="space-y-4">
                  {selectedLog.url && (
                    <div>
                      <Label className="text-xs">URL</Label>
                      <p className="text-sm font-mono break-all">{selectedLog.url}</p>
                    </div>
                  )}
                  {selectedLog.userAgent && (
                    <div>
                      <Label className="text-xs">User Agent</Label>
                      <p className="text-xs font-mono break-all">{selectedLog.userAgent}</p>
                    </div>
                  )}
                  {selectedLog.sessionId && (
                    <div>
                      <Label className="text-xs">Session ID</Label>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {selectedLog.sessionId}
                      </code>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminRoute>
  )
}