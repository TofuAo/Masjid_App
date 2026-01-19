# Study Notes by Page
## Account (/account)
- Modules: React, { useState, useEffect } (from react), { attendanceAPI, feesAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { User, Calendar, CreditCard, CheckCircle, XCircle, Clock, FileText, Image as ImageIcon, AlertCircle, Eye, Download, } (from lucide-react), { getEffectiveRole } (from ../utils/userRoles)
- Functions: format() — defined in page, isWithinRange() — defined in page, Account() — defined in page, getStatusBadge() — defined in page, getImageUrl() — defined in page, handleImageClick() — defined in page, downloadImage() — defined in page
- Event handlers: handleImageClick()
- Calls to imported modules: attendanceAPI.getAll, feesAPI.getAll, toast.error, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: Account page focuses on account content.

## ActivityTimeline (/activity-timeline)
- Modules: React, { useState, useEffect } (from react), { Clock, User, FileText, CheckCircle, XCircle, AlertCircle, Calendar, Filter, Search } (from lucide-react), { toast } (from react-toastify)
- Functions: ActivityTimeline() — defined in page, getActivityIcon() — defined in page, formatTimestamp() — defined in page
- Event handlers: None
- Calls to imported modules: toast.error
- Classes: None (pages use functional components)
- Simple note: Activity Timeline page focuses on activity timeline content.

## AdminActions (/admin-actions)
- Modules: React, { useCallback, useEffect, useMemo, useState } (from react), { Link } (from react-router-dom), { adminActionsAPI } (from ../services/api), Card (from ../components/ui/Card), ActionDetailsModal (from ../components/admin/ActionDetailsModal), { RotateCcw, RefreshCw, Filter, Search, Clock, ShieldAlert, User as UserIcon } (from lucide-react), { toast } (from react-toastify), { useLanguage } (from ../contexts/LanguageContext)
- Functions: formatDate() — defined in page, formatRemainingTime() — defined in page, getOperationLabel() — defined in page, extractTitle() — defined in page, resolveActionLink() — defined in page, handleOpenModal() — defined in page, handleCloseModal() — defined in page
- Event handlers: handleOpenModal(), handleCloseModal()
- Calls to imported modules: adminActionsAPI.list, undo, Card.Header, Title, Content, toast.success, error
- Classes: None (pages use functional components)
- Simple note: Admin Actions page focuses on admin actions content.

## Admins (/admins)
- Modules: React, { useState, useEffect } (from react), { Navigate } (from react-router-dom), useCrud (from ../hooks/useCrud), { adminsAPI } (from ../services/api), AdminList (from ../components/admin/AdminList), AdminForm (from ../components/admin/AdminForm), AdminDetail (from ../components/admin/AdminDetail), Card (from ../components/ui/Card), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { ShieldCheck, AlertCircle, Lock } (from lucide-react), { toast } (from react-toastify), { getEffectiveRole } (from ../utils/userRoles)
- Functions: Admins() — defined in page
- Event handlers: None
- Calls to imported modules: adminsAPI.getWithLimit, Card.Content
- Classes: None (pages use functional components)
- Simple note: Admins page focuses on admins content.

## AllUserDetail (/all-users/:ic)
- Modules: React, { useCallback, useEffect, useMemo, useState } (from react), { Navigate, useParams } (from react-router-dom), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), BackButton (from ../components/ui/BackButton), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { usersAPI } (from ../services/api), { getEffectiveRole } (from ../utils/userRoles), { formatIC } (from ../utils/icUtils), { formatPhoneForDisplay } (from ../utils/phoneUtils)
- Functions: formatDate() — defined in page
- Event handlers: None
- Calls to imported modules: Card.Content, Header, Title, usersAPI.getByIc
- Classes: None (pages use functional components)
- Simple note: All User Detail page focuses on all user detail content.

## AllUsers (/all-users)
- Modules: React, { useState, useEffect, useMemo, useCallback } (from react), { Link, Navigate } (from react-router-dom), { usersAPI } (from ../services/api), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { Users, Search, Filter, AlertCircle } (from lucide-react), { formatIC } (from ../utils/icUtils), { getEffectiveRole } (from ../utils/userRoles), { formatPhoneForDisplay } (from ../utils/phoneUtils)
- Functions: None
- Event handlers: None
- Calls to imported modules: usersAPI.getAll, Card.Content, Users.reduce, length, map
- Classes: None (pages use functional components)
- Simple note: All Users page focuses on all users content.

## Announcements (/announcements)
- Modules: React, { useState, useEffect } (from react), useCrud (from ../hooks/useCrud), { announcementsAPI, adminActionsAPI } (from ../services/api), AnnouncementList (from ../components/announcements/AnnouncementList), AnnouncementForm (from ../components/announcements/AnnouncementForm), Card (from ../components/ui/Card), ErrorDisplay (from ../components/ui/ErrorDisplay), { toast } (from react-toastify), { Megaphone, AlertCircle, RotateCcw, Clock } (from lucide-react), useErrorHandler (from ../hooks/useErrorHandler)
- Functions: renderContent() — defined in page
- Event handlers: None
- Calls to imported modules: React.useCallback, adminActionsAPI.list, undo, Card.Header, Title, Content, toast.success
- Classes: None (pages use functional components)
- Simple note: Announcements page focuses on announcements content.

## AuditLogs (/audit-logs)
- Modules: React, { useState, useEffect } (from react), { toast } (from react-toastify), { History, Filter, Search, Download, Calendar } (from lucide-react), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { authAPI } (from ../services/api)
- Functions: AuditLogs() — defined in page, getOperationBadge() — defined in page, formatDateTime() — defined in page
- Event handlers: None
- Calls to imported modules: toast.error, success, authAPI.getAuditLogs
- Classes: None (pages use functional components)
- Simple note: Audit Logs page focuses on audit logs content.

## AzanTimer (/azan-timer)
- Modules: React, { useState, useEffect } (from react), { Clock, MapPin, RefreshCw, AlertCircle, Calendar, Sunrise, Sunset } (from lucide-react), { toast } (from react-toastify), Card (from ../components/ui/Card), LoadingSkeleton (from ../components/ui/LoadingSkeleton), axios (from axios)
- Functions: AzanTimer() — defined in page, updateCountdown() — defined in page, formatTime() — defined in page, getHijriDate() — defined in page, getGregorianDate() — defined in page
- Event handlers: None
- Calls to imported modules: toast.error, Card.Content, Header, Title, axios.get
- Classes: None (pages use functional components)
- Simple note: Azan Timer page focuses on azan timer content.

## ChooseResetMethod (/choose-reset-method)
- Modules: React, { useState, useEffect } (from react), { useSearchParams, useNavigate, Link } (from react-router-dom), { authAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { Mail, ArrowLeft, CheckCircle, CreditCard } (from lucide-react), { formatIC } (from ../utils/icUtils)
- Functions: ChooseResetMethod() — defined in page
- Event handlers: None
- Calls to imported modules: authAPI.checkResetOptions, requestPasswordResetEmail, toast.error, success, Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Choose Reset Method page focuses on choose reset method content.

## CompleteProfile (/complete-profile)
- Modules: React, { useState, useEffect } (from react), { useNavigate } (from react-router-dom), { toast } (from react-toastify), { authAPI, clearAuth } (from ../services/api), { User, Mail, Phone, BookOpen, GraduationCap } (from lucide-react), { formatPhone } (from ../utils/phoneUtils)
- Functions: handleChange() — defined in page, handleKepakaranChange() — defined in page, validate() — defined in page
- Event handlers: handleChange(), handleKepakaranChange()
- Calls to imported modules: toast.error, success, authAPI.updateProfile, checkProfileComplete
- Classes: None (pages use functional components)
- Simple note: Complete Profile page focuses on complete profile content.

## Contact (/contact)
- Modules: React, { useState, useEffect } (from react), { Mail, Phone, MessageSquare, MapPin, Clock } (from lucide-react), Card (from ../components/ui/Card), ActivitiesBanner (from ../components/contact/ActivitiesBanner), { settingsAPI } (from ../services/api)
- Functions: None
- Event handlers: None
- Calls to imported modules: Card.Header, Content, settingsAPI.getByKey
- Classes: None (pages use functional components)
- Simple note: Contact page focuses on contact content.

## Dashboard (/)
- Modules: React, { useState, useEffect, useCallback } (from react), StatCard (from ../components/dashboard/StatCard), RecentActivity (from ../components/dashboard/RecentActivity), QuickStats (from ../components/dashboard/QuickStats), DailyQuranQuote (from ../components/dashboard/DailyQuranQuote), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { Users, GraduationCap, BookOpen, CreditCard, AlertCircle, Megaphone, CheckCircle, XCircle, Clock, Calendar } (from lucide-react), { studentsAPI, teachersAPI, classesAPI, feesAPI, examsAPI, announcementsAPI, attendanceAPI } (from ../services/api), { toast } (from react-toastify), { Link } (from react-router-dom), Badge (from ../components/ui/Badge), FeaturedClasses (from ../components/kelas/FeaturedClasses), QuickActions (from ../components/dashboard/QuickActions), { getEffectiveRole } (from ../utils/userRoles)
- Functions: Dashboard() — defined in page, renderMonthlyAttendance() — defined in page, getStatusBadge() — defined in page
- Event handlers: None
- Calls to imported modules: studentsAPI.getAll, teachersAPI.getAll, classesAPI.getAll, feesAPI.getAll, examsAPI.getAll, announcementsAPI.getAll, attendanceAPI.getAll, toast.error
- Classes: None (pages use functional components)
- Simple note: Dashboard page focuses on dashboard content.

## ForgotPassword (/forgot-password)
- Modules: React, { useState } (from react), { Link, useNavigate } (from react-router-dom), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { CreditCard, ArrowLeft } (from lucide-react), { formatIC, isValidIC } (from ../utils/icUtils)
- Functions: ForgotPassword() — defined in page, handleICChange() — defined in page
- Event handlers: handleICChange()
- Calls to imported modules: toast.error, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: Forgot Password page focuses on forgot password content.

## Guru (/guru/*)
- Modules: React, { useState, useEffect } (from react), { useNavigate, useSearchParams } (from react-router-dom), useCrud (from ../hooks/useCrud), { teachersAPI } (from ../services/api), GuruList (from ../components/guru/GuruList), GuruForm (from ../components/guru/GuruForm), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), BackButton (from ../components/ui/BackButton), Button (from ../components/ui/Button), { GraduationCap, ExternalLink, Edit, BookOpen, UserPlus, X, Users } (from lucide-react), { toast } (from react-toastify), { formatIC } (from ../utils/icUtils), { formatPhoneForDisplay } (from ../utils/phoneUtils)
- Functions: Guru() — defined in page, renderContent() — defined in page
- Event handlers: None
- Calls to imported modules: React.useState, useEffect, teachersAPI.getById, getUnassigned, convertToTeacher, Card.Header, Title, Content, Users.length, map, toast.error, success
- Classes: None (pages use functional components)
- Simple note: Guru page focuses on guru content.

## HelpCenter (/help)
- Modules: React, { useState } (from react), { HelpCircle, BookOpen, Video, MessageCircle, FileText, Search, ChevronRight, User, GraduationCap, Shield, CheckCircle, ArrowLeft, Mail, Phone, ExternalLink } (from lucide-react), { Link } (from react-router-dom), { getEffectiveRole } (from ../utils/userRoles)
- Functions: HelpCenter() — defined in page, getRoleSpecificCategories() — defined in page
- Event handlers: None
- Calls to imported modules: None
- Classes: None (pages use functional components)
- Simple note: Help Center page focuses on help center content.

## Hierarchy (/hierarchy)
- Modules: React (from react), Card (from ../components/ui/Card), { Crown, Shield, UserCog, Users, GraduationCap, ArrowDown, CheckCircle, XCircle, Info } (from lucide-react)
- Functions: None
- Event handlers: None
- Calls to imported modules: Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Hierarchy page focuses on hierarchy content.

## IbAccount (/ib-account)
- Modules: React, { useState, useEffect } (from react), { attendanceAPI, feesAPI, studentsAPI, classesAPI, ibAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), Button (from ../components/ui/Button), { User, Calendar, CreditCard, CheckCircle, XCircle, Clock, FileText, Image as ImageIcon, AlertCircle, Eye, Download, Search, Users, FileCheck, ShieldCheck, GraduationCap, Check, X } (from lucide-react), { getEffectiveRole } (from ../utils/userRoles)
- Functions: IbAccount() — defined in page, toggleExcludeStudent() — defined in page, toggleSelectStudent() — defined in page, selectAllStudents() — defined in page, deselectAllStudents() — defined in page, getStatusBadge() — defined in page, getImageUrl() — defined in page, handleImageClick() — defined in page, downloadImage() — defined in page
- Event handlers: handleImageClick()
- Calls to imported modules: attendanceAPI.getAll, confirmDocument, feesAPI.getAll, confirmDocument, classesAPI.getAll, getById, ibAPI.getClassDocuments, confirmClassAttendance, confirmClassFees, toast.error, success, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: IB Account page focuses on ib account content.

## IbDashboard (/ib-dashboard)
- Modules: React, { useState, useEffect, useMemo } (from react), { CheckCircle, XCircle, Clock, FileText, Calendar, DollarSign, AlertCircle, Search, Filter, Zap, CheckSquare, TrendingUp, TrendingDown, FileDown, Download, BarChart3 } (from lucide-react), { ibAPI } (from ../services/api), { toast } (from react-toastify), { calculateExecutiveSummary, getReportAlerts, getTrendData, handleExportExcel, handleExportPDF } (from ../utils/financeIntelligence)
- Functions: IbDashboard() — defined in page, toggleExcludePayment() — defined in page, getStatusBadge() — defined in page, formatCurrency() — defined in page, formatDate() — defined in page
- Event handlers: None
- Calls to imported modules: ibAPI.getAvailableReports, getMonthlyReport, confirmMonthlyPayment, approvePaymentsByDate, toast.error, success, info
- Classes: None (pages use functional components)
- Simple note: IB Dashboard page focuses on ib dashboard content.

## Kehadiran (/kehadiran)
- Modules: React, { useState, useEffect, useCallback, useMemo } (from react), useCrud (from ../hooks/useCrud), { attendanceAPI, classesAPI, googleFormAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), DeleteConfirmationModal (from ../components/ui/DeleteConfirmationModal), GoogleFormModal (from ../components/kehadiran/GoogleFormModal), AttendanceFormModal (from ../components/kehadiran/AttendanceFormModal), ClassAttendanceModal (from ../components/kehadiran/ClassAttendanceModal), { Calendar, Users, CheckCircle, XCircle, Clock, AlertCircle, Plus, ChevronRight, Edit, Trash2 } (from lucide-react)
- Functions: for() — defined in page, executedFunction() — defined in page, const() — defined in page, Kehadiran() — defined in page, later() — defined in page, normalizeStatus() — defined in page, handleClassClick() — defined in page, getStatusBadge() — defined in page, handleDeleteClick() — defined in page, handleDeleteCancel() — defined in page, handleAmbilKehadiran() — defined in page
- Event handlers: handleClassClick(), handleDeleteClick(), handleDeleteCancel(), handleAmbilKehadiran()
- Calls to imported modules: attendanceAPI.mark, delete, confirmDocument, bulkMark, classesAPI.getAll, toast.error, success, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: Kehadiran page focuses on kehadiran content.

## Kelas (/kelas/*)
- Modules: React, { useState, useEffect, useCallback } (from react), { useSearchParams, useNavigate } (from react-router-dom), useCrud (from ../hooks/useCrud), KelasList (from ../components/kelas/KelasList), KelasForm (from ../components/kelas/KelasForm), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), BackButton (from ../components/ui/BackButton), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { BookOpen, Users, Clock, DollarSign, AlertCircle, ExternalLink, GraduationCap } (from lucide-react), { classesAPI, teachersAPI } (from ../services/api), { toast } (from react-toastify), { formatPhoneForDisplay } (from ../utils/phoneUtils)
- Functions: Kelas() — defined in page, renderContent() — defined in page
- Event handlers: None
- Calls to imported modules: React.useState, useEffect, Card.Header, Title, Content, classesAPI.getById, getStats, teachersAPI.getAll, toast.error
- Classes: None (pages use functional components)
- Simple note: Kelas page focuses on kelas content.

## Keputusan (/keputusan)
- Modules: React, { useState, useEffect, useCallback, useMemo, useRef } (from react), useCrud (from ../hooks/useCrud), { resultsAPI, examsAPI, settingsAPI, classesAPI } (from ../services/api), { toast } (from react-toastify), { useNavigate } (from react-router-dom), html2pdf (from html2pdf.js), ResultFormModal (from ../components/keputusan/ResultFormModal), GradeSettingsModal (from ../components/keputusan/GradeSettingsModal), StudentResultDetailModal (from ../components/keputusan/StudentResultDetailModal), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), { FileText, TrendingUp, TrendingDown, Award, Plus, Search, Filter, Settings, ChevronRight } (from lucide-react), { DEFAULT_GRADE_RANGES, cloneDefaultGradeRanges, normalizeGradeRanges, extractGradeOptions, getStatusFromGrade } (from ../utils/grades), { getEffectiveRole } (from ../utils/userRoles)
- Functions: typeLabel() — defined in page, guessExamType() — defined in page, getStrengthMessage() — defined in page, getImprovementMessage() — defined in page, getRecordDate() — defined in page, createYearSemesterMatcher() — defined in page, sanitizeResult() — defined in page, filterRecords() — defined in page, formatTimelineDate() — defined in page, formatSessionLabel() — defined in page, Keputusan() — defined in page, handleAddResult() — defined in page, handleEditResult() — defined in page, handleViewStudentResults() — defined in page, getGradeBadge() — defined in page, getStatusBadge() — defined in page, handleAskTeacher() — defined in page, handleDownloadSlip() — defined in page
- Event handlers: handleAddResult(), handleEditResult(), handleViewStudentResults(), handleAskTeacher(), handleDownloadSlip()
- Calls to imported modules: resultsAPI.update, create, delete, examsAPI.getAll, getById, settingsAPI.getGradeRanges, updateGradeRanges, classesAPI.getById, toast.error, success, warn, html2pdf.js, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: Keputusan page focuses on keputusan content.

## Laporan (/laporan)
- Modules: React, { useState, useEffect, useCallback } (from react), useCrud (from ../hooks/useCrud), { studentsAPI, teachersAPI, classesAPI, feesAPI, attendanceAPI, resultsAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), { BarChart3, Download, FileText, Users, GraduationCap, BookOpen, CreditCard, Calendar, TrendingUp, TrendingDown, AlertCircle, Award } (from lucide-react), { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } (from docx), { saveAs } (from file-saver)
- Functions: Laporan() — defined in page, getReportData() — defined in page, buildRows() — defined in page, renderOverviewReport() — defined in page, renderPelajarsReport() — defined in page, renderYuranReport() — defined in page, renderKehadiranReport() — defined in page, renderKelasPengajianReport() — defined in page, renderLevelSection() — defined in page, renderTalaqqiSection() — defined in page, renderKeputusanReport() — defined in page, renderReportContent() — defined in page
- Event handlers: None
- Calls to imported modules: studentsAPI.getStats, teachersAPI.getStats, classesAPI.getStats, feesAPI.getStats, toast.info, error, success, Card.Header, Title, Content, Packer.toBlob, HeadingLevel.HEADING_1, HEADING_2, WidthType.PERCENTAGE, AlignmentType.CENTER
- Classes: None (pages use functional components)
- Simple note: Laporan page focuses on laporan content.

## MaintenanceControl (Not routed via App)
- Modules: React, { useState, useEffect } (from react), axios (from axios), { AlertCircle, AlertTriangle, Info, Power, Calendar, History, RefreshCw } (from lucide-react)
- Functions: MaintenanceControl() — defined in page, getStatusBadge() — defined in page
- Event handlers: None
- Calls to imported modules: axios.get, post
- Classes: None (pages use functional components)
- Simple note: Maintenance Control page focuses on maintenance control content.

## NotificationCenter (/notifications)
- Modules: React, { useState, useEffect } (from react), { toast } (from react-toastify), { Bell, CheckCircle, XCircle, AlertCircle, Clock, Filter, Check } (from lucide-react), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { authAPI } (from ../services/api), useErrorHandler (from ../hooks/useErrorHandler)
- Functions: NotificationCenter() — defined in page, getNotificationIcon() — defined in page, getPriorityBadge() — defined in page, formatTime() — defined in page
- Event handlers: None
- Calls to imported modules: toast.success, authAPI.getNotifications, markNotificationRead, markAllNotificationsRead
- Classes: None (pages use functional components)
- Simple note: Notification Center page focuses on notification center content.

## PayYuran (/pay-yuran/:id)
- Modules: React, { useState, useEffect } (from react), { useParams, useNavigate } (from react-router-dom), { feesAPI, settingsAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), ErrorDisplay (from ../components/ui/ErrorDisplay), { QrCode, ArrowLeft, CheckCircle, XCircle, Clock, CreditCard, Smartphone, Wallet, ChevronRight } (from lucide-react), { QRCodeSVG } (from qrcode.react), PaymentCheckout (from ./PaymentCheckout), useErrorHandler (from ../hooks/useErrorHandler)
- Functions: PayYuran() — defined in page, generateQRData() — defined in page
- Event handlers: None
- Calls to imported modules: feesAPI.getById, settingsAPI.getQRCode, toast.success, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: Pay Yuran page focuses on pay yuran content.

### Touch 'n Go scan-to-pay readiness
- Research shows TNG merchant onboarding delivers a unique QR code, and the operator expects merchants to keep the QR visible, comply with merchant signage guidelines, and keep transaction notifications monitored.
- The QR that `PayYuran` renders follows the `account|amount|reference|description` pattern so Touch 'n Go, DuitNow, and other DuitNow-compatible payers can decode the transaction without extra transformation.
- The new instructions card points visitors explicitly to Touch 'n Go eWallet's scan flow, reminding them to verify the billed amount and keep the QR stable, while `settingsAPI.getQRCode` allows admins to override the auto-generated code with the official merchant QR if required.

## PaymentCheckout (Not routed via App)
- Modules: React, { useEffect, useState } (from react), { useNavigate } (from react-router-dom), api (from ../services/api), { toast } (from react-toastify), { CreditCard, Lock, Shield } (from lucide-react), Card (from ../components/ui/Card), Button (from ../components/ui/Button)
- Functions: None
- Event handlers: None
- Calls to imported modules: api.post, toast.error
- Classes: None (pages use functional components)
- Simple note: Payment Checkout page focuses on payment checkout content.

## PaymentHistory (/payment-history)
- Modules: React, { useState, useEffect } (from react), { paymentAPI } (from ../services/paymentAPI), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), ReceiptViewer (from ../components/receipt/ReceiptViewer), { CreditCard, FileText, Download, Eye, Calendar, DollarSign, CheckCircle, XCircle, Clock, AlertCircle } (from lucide-react), useErrorHandler (from ../hooks/useErrorHandler)
- Functions: PaymentHistory() — defined in page, getStatusBadge() — defined in page, viewReceipt() — defined in page, formatDate() — defined in page, formatDateTime() — defined in page
- Event handlers: None
- Calls to imported modules: paymentAPI.getByUser, toast.error, Card.Header, Title, Content
- Classes: None (pages use functional components)
- Simple note: Payment History page focuses on payment history content.

## PaymentReturn (/payment/return)
- Modules: React, { useEffect, useState } (from react), { useNavigate, useSearchParams } (from react-router-dom), { toast } (from react-toastify), { CheckCircle, XCircle, Clock, ArrowLeft } (from lucide-react), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Receipt (from ../components/Receipt), { paymentAPI } (from ../services/paymentAPI), { feesAPI } (from ../services/api)
- Functions: PaymentReturn() — defined in page, handleBackToFees() — defined in page, handleRetryPayment() — defined in page
- Event handlers: handleBackToFees(), handleRetryPayment()
- Calls to imported modules: toast.success, error, info, Card.Content, paymentAPI.getById, feesAPI.getById
- Classes: None (pages use functional components)
- Simple note: Payment Return page focuses on payment return content.

## Pelajar (/pelajar/*)
- Modules: React, { useState, useEffect } (from react), { Navigate } (from react-router-dom), useCrud (from ../hooks/useCrud), { studentsAPI } (from ../services/api), PelajarList (from ../components/pelajar/PelajarList), PelajarForm (from ../components/pelajar/PelajarForm), PelajarDetail (from ../components/pelajar/PelajarDetail), PelajarImport (from ../components/pelajar/PelajarImport), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { Users, UserCheck, AlertCircle } (from lucide-react), { Link, Route, Routes, useLocation } (from react-router-dom)
- Functions: renderContent() — defined in page
- Event handlers: None
- Calls to imported modules: studentsAPI.getStats
- Classes: None (pages use functional components)
- Simple note: Pelajar page focuses on pelajar content.

## PendingRegistrations (/pending-registrations)
- Modules: React, { useState, useEffect } (from react), { toast } (from react-toastify), { authAPI } (from ../services/api), { CheckCircle, XCircle, Clock, RefreshCw, User, X } (from lucide-react)
- Functions: PendingRegistrations() — defined in page, formatDate() — defined in page
- Event handlers: None
- Calls to imported modules: toast.error, success, authAPI.getPendingRegistrations, approveRegistration, rejectRegistration
- Classes: None (pages use functional components)
- Simple note: Pending Registrations page focuses on pending registrations content.

## PendingTeacherDashboard (/pending-teacher)
- Modules: React, { useState, useEffect } (from react), { Link } (from react-router-dom), { Clock, CheckCircle, XCircle, User, FileText, Mail, Phone, AlertCircle, BookOpen, Upload, Settings, HelpCircle, MessageSquare } (from lucide-react), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), { authAPI } (from ../services/api), { toast } (from react-toastify), LoadingSkeleton (from ../components/ui/LoadingSkeleton)
- Functions: PendingTeacherDashboard() — defined in page
- Event handlers: None
- Calls to imported modules: authAPI.checkProfileComplete
- Classes: None (pages use functional components)
- Simple note: Pending Teacher Dashboard page focuses on pending teacher dashboard content.

## PendingTeacherDocuments (/pending-teacher/documents)
- Modules: React, { useState, useEffect } (from react), { toast } (from react-toastify), { Upload, FileText, X, CheckCircle, AlertCircle, Download } (from lucide-react), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), { authAPI } (from ../services/api), LoadingSkeleton (from ../components/ui/LoadingSkeleton)
- Functions: PendingTeacherDocuments() — defined in page, getDocumentStatus() — defined in page
- Event handlers: None
- Calls to imported modules: toast.error, success, authAPI.getTeacherDocuments, uploadTeacherDocument, deleteTeacherDocument
- Classes: None (pages use functional components)
- Simple note: Pending Teacher Documents page focuses on pending teacher documents content.

## PermissionMatrix (/permission-matrix)
- Modules: React, { useState, useEffect } (from react), { Shield, CheckCircle, XCircle, Lock, Unlock, Download } (from lucide-react), { toast } (from react-toastify)
- Functions: PermissionMatrix() — defined in page, handleExport() — defined in page, getRoleLabel() — defined in page
- Event handlers: handleExport()
- Calls to imported modules: toast.error, success
- Classes: None (pages use functional components)
- Simple note: Permission Matrix page focuses on permission matrix content.

## PersonalSettings (/personal-settings)
- Modules: React, { useState, useEffect } (from react), { useLocation } (from react-router-dom), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { Settings as SettingsIcon, Palette, Globe, Type, Save, Sparkles, Key, Mail, Phone, User, Eye, EyeOff, Trophy } (from lucide-react), { usePreferences } (from ../hooks/usePreferences), { useLanguage } (from ../contexts/LanguageContext), { seasonalSchemes, getScheme } (from ../config/seasonalSchemes), SeasonalElements (from ../components/seasonal/SeasonalElements), { authAPI } (from ../services/api), { formatPhone, isValidPhone } (from ../utils/phoneUtils)
- Functions: PersonalSettings() — defined in page, handlePreferenceChange() — defined in page
- Event handlers: handlePreferenceChange()
- Calls to imported modules: React.useRef, useEffect, toast.error, success, Card.Header, Title, Content, User.role, authAPI.getProfile, updateProfile, changePassword
- Classes: None (pages use functional components)
- Simple note: Personal Settings page focuses on personal settings content.

## PicApprovals (/pic-approvals)
- Modules: React, { useState, useEffect, useMemo } (from react), { pendingPicChangesAPI } (from ../services/api), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), { toast } (from react-toastify), { ShieldCheck, RefreshCcw, Clock, CheckCircle, XCircle, FileJson, AlertCircle } (from lucide-react)
- Functions: None
- Event handlers: None
- Calls to imported modules: pendingPicChangesAPI.list, approve, reject, Card.Header, Title, Content, toast.error, success, info
- Classes: None (pages use functional components)
- Simple note: Pic Approvals page focuses on pic approvals content.

## PicRecycleBin (/pic-recycle-bin)
- Modules: React, { useState, useEffect } (from react), { Navigate } (from react-router-dom), { picRecycleBinAPI, pendingPicChangesAPI } (from ../services/api), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), { toast } (from react-toastify), { Trash2, RefreshCcw, XCircle, Clock, CheckCircle, AlertCircle, Eye, RotateCcw, FileText, Calendar, User, Timer } (from lucide-react)
- Functions: getOperationLabel() — defined in page, getOperationColor() — defined in page, isUndoOperation() — defined in page, formatDate() — defined in page, calculateTimeRemaining() — defined in page
- Event handlers: None
- Calls to imported modules: picRecycleBinAPI.list, undo, cancelPending, toast.error, success
- Classes: None (pages use functional components)
- Simple note: Pic Recycle Bin page focuses on pic recycle bin content.

## PicUsers (/pic-users)
- Modules: React, { useEffect, useMemo, useState } (from react), { Search } (from lucide-react), useCrud (from ../hooks/useCrud), { picUsersAPI } (from ../services/api), PicUserForm (from ../components/pic/PicUserForm), PicUserList (from ../components/pic/PicUserList), Card (from ../components/ui/Card)
- Functions: PicUsers() — defined in page
- Event handlers: None
- Calls to imported modules: Card.Content
- Classes: None (pages use functional components)
- Simple note: Pic Users page focuses on pic users content.

## QuickStaffCheckIn (/quick-checkin)
- Modules: React, { useState } (from react), { MapPin, LogIn, LogOut, Eye, EyeOff, User, Lock, AlertCircle, CheckCircle, History } (from lucide-react), api (from ../services/api), { formatIC } (from ../utils/icUtils), { useAccurateGPS } (from ../hooks/useAccurateGPS)
- Functions: QuickStaffCheckIn() — defined in page, handleChange() — defined in page, showMessage() — defined in page, formatDateTime() — defined in page
- Event handlers: handleChange()
- Calls to imported modules: api.post
- Classes: None (pages use functional components)
- Simple note: Quick Staff Check In page focuses on quick staff check in content.

## ResetPassword (/reset-password)
- Modules: React, { useState, useEffect } (from react), { useSearchParams, Link, useNavigate } (from react-router-dom), { authAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { Key, CheckCircle, XCircle, Eye, EyeOff } (from lucide-react)
- Functions: ResetPassword() — defined in page
- Event handlers: None
- Calls to imported modules: authAPI.resetPassword, toast.error, success, Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Reset Password page focuses on reset password content.

## ResetPasswordCode (/reset-password-code)
- Modules: React, { useState, useEffect } (from react), { useSearchParams, Link, useNavigate } (from react-router-dom), { authAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { Key, CheckCircle, XCircle, Eye, EyeOff, Phone } (from lucide-react)
- Functions: ResetPasswordCode() — defined in page, handleCodeChange() — defined in page
- Event handlers: handleCodeChange()
- Calls to imported modules: authAPI.resetPassword, toast.error, success, Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Reset Password Code page focuses on reset password code content.

## ResetPasswordFlow (Not routed via App)
- Modules: React, { useState } (from react), { Link, useNavigate } (from react-router-dom), { authAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { Mail, Phone, ArrowLeft, CheckCircle, Key, Eye, EyeOff, ArrowRight } (from lucide-react)
- Functions: ResetPasswordFlow() — defined in page, handleStep1Submit() — defined in page
- Event handlers: handleStep1Submit()
- Calls to imported modules: authAPI.requestReset, verifyReset, setPassword, toast.error, success, Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Reset Password Flow page focuses on reset password flow content.

## Settings (/settings)
- Modules: React, { useState, useEffect, useRef } (from react), { Navigate, Link as RouterLink } (from react-router-dom), { settingsAPI, authAPI, studentsAPI, teachersAPI, exportAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), GoogleMapPicker (from ../components/ui/GoogleMapPicker), { Settings as SettingsIcon, QrCode, Key, Upload, Link, Save, Users, Eye, EyeOff, MapPin, Database, CloudUpload, History, DownloadCloud, Loader2, Search, X, CreditCard, Mail, Phone, Archive, Contact, Clock, Globe, CheckCircle, AlertCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles, Shield } (from lucide-react), { formatIC } (from ../utils/icUtils), { getEffectiveRole } (from ../utils/userRoles), { formatPhoneForDisplay } (from ../utils/phoneUtils), { useLanguage } (from ../contexts/LanguageContext), { usePreferences } (from ../hooks/usePreferences)
- Functions: Settings() — defined in page, formatFileSize() — defined in page, formatDateTime() — defined in page, normalizeEntries() — defined in page, handleOpenLink() — defined in page, formatCoordinate() — defined in page, formatRadius() — defined in page, handleImageChange() — defined in page, handleTestQRPayment() — defined in page, handleUserClick() — defined in page, handleCloseModal() — defined in page
- Event handlers: handleOpenLink(), handleImageChange(), handleTestQRPayment(), handleUserClick(), handleCloseModal()
- Calls to imported modules: Link.split, settingsAPI.getMasjidLocation, getByKey, update, getQRCode, authAPI.adminChangePassword, studentsAPI.getAll, teachersAPI.getAll, exportAPI.getHistory, triggerDatabaseBackup, archiveYearData, download, toast.error, success, warning, info, Card.Header, Title, Content, Settings.masjid_latitude, masjid_longitude, masjid_checkin_radius, google_maps_api_key, qr_code_enabled, qr_code_image, qr_code_link, Users.filter, length, map, History.length, map
- Classes: None (pages use functional components)
- Simple note: Settings page focuses on settings content.

## StaffCheckIn (/staff-checkin)
- Modules: React, { useState, useEffect, useMemo, useCallback, useRef } (from react), { MapPin, Clock, CheckCircle, XCircle, RefreshCw, AlertCircle, LogIn, LogOut, Download } (from lucide-react), { staffCheckInAPI } (from ../services/api), { calculateDistance } (from ../utils/distanceUtils), { useMasjidLocation } (from ../hooks/useMasjidLocation), { useAccurateGPS } (from ../hooks/useAccurateGPS)
- Functions: formatDateParam() — defined in page, formatDateTime() — defined in page, formatDate() — defined in page
- Event handlers: None
- Calls to imported modules: staffCheckInAPI.getTodayStatus, getHistory, getStaffList, checkIn, checkOut
- Classes: None (pages use functional components)
- Simple note: Staff Check In page focuses on staff check in content.

## StudentRegistration (/student-register)
- Modules: React, { useState } (from react), { useNavigate, Link } (from react-router-dom), { authAPI } (from ../services/api), { User, AlertCircle, CreditCard, Mail, Phone, Calendar, CheckCircle } (from lucide-react), { toast } (from react-toastify), { formatIC, isValidIC } (from ../utils/icUtils), { formatPhone } (from ../utils/phoneUtils), useErrorHandler (from ../hooks/useErrorHandler)
- Functions: StudentRegistration() — defined in page, handleChange() — defined in page, validate() — defined in page
- Event handlers: handleChange()
- Calls to imported modules: authAPI.register, toast.success, error
- Classes: None (pages use functional components)
- Simple note: Student Registration page focuses on student registration content.

## SystemHealth (/system-health)
- Modules: React, { useState, useEffect } (from react), { toast } (from react-toastify), { Activity, CheckCircle, XCircle, AlertCircle, Server, Database, Globe, RefreshCw } (from lucide-react), Card (from ../components/ui/Card), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), ErrorDisplay (from ../components/ui/ErrorDisplay), useErrorHandler (from ../hooks/useErrorHandler)
- Functions: SystemHealth() — defined in page, getStatusBadge() — defined in page, getStatusIcon() — defined in page
- Event handlers: None
- Calls to imported modules: None
- Classes: None (pages use functional components)
- Simple note: System Health page focuses on system health content.

## TeacherRegistration (/teacher-register)
- Modules: React, { useState } (from react), { useNavigate, Link } (from react-router-dom), { authAPI, teachersAPI } (from ../services/api), { User, AlertCircle, CreditCard, Mail, Phone, Calendar, CheckCircle, GraduationCap, Lock, Eye, EyeOff } (from lucide-react), { toast } (from react-toastify), { formatIC, isValidIC } (from ../utils/icUtils), { formatPhone } (from ../utils/phoneUtils)
- Functions: TeacherRegistration() — defined in page, handleChange() — defined in page, handleKepakaranChange() — defined in page, validate() — defined in page
- Event handlers: handleChange(), handleKepakaranChange()
- Calls to imported modules: teachersAPI.register, toast.success, error
- Classes: None (pages use functional components)
- Simple note: Teacher Registration page focuses on teacher registration content.

## ToyyibPaySettings (/toyyibpay-settings)
- Modules: React, { useState, useEffect } (from react), { Navigate } (from react-router-dom), { toast } (from react-toastify), api, { paymentGatewaySettingsAPI } (from ../services/api), Card (from ../components/ui/Card), Button (from ../components/ui/Button), { CreditCard, Save, Eye, EyeOff, Settings, CheckCircle, XCircle, AlertCircle, Lock, Globe, TestTube, Activity } (from lucide-react), { getEffectiveRole } (from ../utils/userRoles)
- Functions: ToyyibPaySettings() — defined in page, handleChange() — defined in page
- Event handlers: handleChange()
- Calls to imported modules: toast.error, success, api.get, paymentGatewaySettingsAPI.getAll, update, Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Toyyib Pay Settings page focuses on toyyib pay settings content.

## Weather (/weather)
- Modules: React, { useState, useEffect } (from react), { Cloud, CloudRain, Sun, CloudSun, Wind, Droplet, Eye, Gauge, Thermometer, AlertCircle, RefreshCw, Sunrise, Sunset } (from lucide-react), { weatherAPI } (from ../services/api), { toast } (from react-toastify), LoadingSkeleton (from ../components/ui/LoadingSkeleton), Card (from ../components/ui/Card)
- Functions: Weather() — defined in page, getWeatherIcon() — defined in page, formatTime() — defined in page
- Event handlers: None
- Calls to imported modules: weatherAPI.getCurrent, toast.error, Card.Content, Header, Title
- Classes: None (pages use functional components)
- Simple note: Weather page focuses on weather content.

## Yuran (/yuran)
- Modules: React, { useState, useEffect, useCallback } (from react), { useNavigate } (from react-router-dom), useCrud (from ../hooks/useCrud), { feesAPI, settingsAPI } (from ../services/api), { toast } (from react-toastify), Card (from ../components/ui/Card), Button (from ../components/ui/Button), Badge (from ../components/ui/Badge), LoadingSkeleton (from ../components/ui/LoadingSkeleton), ReceiptViewer (from ../components/receipt/ReceiptViewer), { CreditCard, DollarSign, CheckCircle, XCircle, Clock, Plus, Search, Filter, QrCode, Settings, Upload, Link as LinkIcon, Save, ChevronDown, ChevronUp, AlertCircle, FileCheck, Eye } (from lucide-react), { getEffectiveRole } (from ../utils/userRoles)
- Functions: Yuran() — defined in page, handleImageChange() — defined in page, getStatusBadge() — defined in page
- Event handlers: handleImageChange()
- Calls to imported modules: feesAPI.confirmDocument, create, markAsPaid, settingsAPI.getQRCode, update, toast.success, error, info, Card.Header, Title, Content, Settings.qr_code_image, qr_code_link, qr_code_enabled
- Classes: None (pages use functional components)
- Simple note: Yuran page focuses on yuran content.
