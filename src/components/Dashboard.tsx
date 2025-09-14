import React, { useState, useCallback, useEffect, useRef, lazy, Suspense, useMemo } from 'react';
import { analyzePostContent, analyzeVideoContent, analyzeImageContent, transcribeVideo } from '../services/geminiService';
import type { ComplianceReport, CustomRule, ReportStatus, MainView, CheckItem } from '../types';
import Loader from './Loader';
import Analytics from './Analytics';
import WelcomeGuide from './WelcomeGuide';
import { HistoryIcon, FilmIcon, EllipsisHorizontalIcon, FolderIcon, ChevronDownIcon, SparklesIcon } from './icons/Icons';
import jsPDF from 'jspdf';

const ReportCard = lazy(() => import('./ReportCard'));

type AnalysisType = 'text' | 'video' | 'image';

// --- PDF Generation Logic ---
const generateCertificatePdf = (report: ComplianceReport) => {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // --- Colors & Fonts ---
    const colors = {
        primary: '#38B2AC',
        dark: '#1A202C',
        textPrimary: '#F7FAFC',
        textSecondary: '#A0AEC0',
        success: '#38A169',
        danger: '#E53E3E',
        warning: '#D69E2E',
    };

    doc.addFont('Helvetica', 'normal', 'normal');
    doc.addFont('Helvetica', 'bold', 'bold');
    doc.setFillColor(colors.dark);
    doc.rect(0, 0, pageW, pageH, 'F');

    // --- Base64 Icons ---
    const icons = {
        brandGuard: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzM4QjJBQyI+PHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBkPSJNMTIuNTE2IDIuMTdhLjc1Ljc1IDAgMCAwLTEuMDMyIDAgMTEuMjA5IDExLjIwOSAwIDAgMS03Ljg3NyAzLjA4Ljc1Ljc1IDAgMCAwLS43MjIuNTE1QTEyLjc0IDEyLjc0IDAgMCAwIDIuMjUgOS43NWMwIDUuOTQyIDQuMDY0IDEwLjkzMyA5LjU2MyAxMi4zNDhhLjc0OS43NDkgMCAwIDAgLjM3NCAwYzUuNDk5LTEuNDE1IDkuNTYzLTYuNDA2IDkuNTYzLTEyLjM0OCAwLTEuMzktLjIyMy0yLjczLS42MzUtMy45ODVhLjc1Ljc1IDAgMCAwLS43MjItLjUxNmwtLjE0My4wMDFjLTIuOTk2IDAtNS43MTctMS4xNy03LjczNC0zLjA4Wm0zLjA5NCA4LjAxNmEuNzUuNzUgMCAxIDAtMS4yMi0uODcybC0zLjIzNiA0LjUzTDkuNTMgMTIuMjJhLjc1Ljc1IDAgMCAwLTEuMDYgMS4wNmwyLjI1IDIuMjVhLjc1Ljc1IDAgMCAwIDEuMTQtLjA5NGwzLjc1LTUuMjVaIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIC8+PC9zdmc+',
        shieldGreen: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iIzM4QTE2OSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAxMi43NSA MTEuMjUgMTUgMTUgOS43NW0tMy03LjAzNkExMS45NTkgMTEuOTU5IDAgMCAxIDMuNTk4IDYgMTEuOTkgMTEuOTkgMCAwIDAgMyA5Ljc0OWMwIDUuNTkyIDMuODI0IDEwLjI5IDkgMTEuNjIzIDUuMTc2LTEuMzMyIDktNi4wMyA5LTExLjYyMyAwLTEuNjA0LS4zNi0zLjExMy0xLjAwMi00LjQyNEExMS45NTkgMTEuOTU5IDAgMCAxIDEyIDIuNzE0WiIgLz48L3N2Zz4=',
        shieldRed: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iI0U1M0UzRSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNOSAxMi43NSA MTEuMjUgMTUgMTUgOS43NW0tMy03LjAzNkExMS45NTkgMTEuOTU5IDAgMCAxIDMuNTk4IDYgMTEuOTkgMTEuOTkgMCAwIDAgMyA5Ljc0OWMwIDUuNTkyIDMuODI0IDEwLjI5IDkgMTEuNjIzIDUuMTc2LTEuMzMyIDktNi4wMyA5LTExLjYyMyAwLTEuNjA0LS4zNi0zLjExMy0xLjAwMi00LjQyNEExMS45NTkgMTEuOTU5IDAgMCAxIDEyIDIuNzE0WiIgLz48L3N2Zz4=',
        check: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiMzOEExNjkiPjxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTkgMTIuNzUgMTEuMjUgMTUgMTUgOS43NU0yMSAxMmE5IDkgMCAxIDEtMTggMCA5IDkgMCAwIDEgMTggMFoiIC8+PC9zdmc+',
        warning: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iI0Q2OUUyRSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJNMTIgOXYzLjc1bS05LjMwMyAzLjM3NmMtLjg2NiAxLjUuMjE3IDMuMzc0IDEuOTQ4IDMuMzc0aDE0LjcxYzEuNzMgMCAyLjgxMy0xLjg3NCAxLjk0OC0zLjM3NEwxMy45NDkgMy4zNzhjLS44NjYtMS41LTMuMDMyLTEuNS0zLjg5OCAwTDIuNjk3IDE2LjEyNlpNMTIgMTUuNzVoLjAwN3YuMDA3SDEydi0uMDA3WiIgLz48L3N2Zz4=',
        cross: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2U9IiNFM0UzRSI+PHBhdGggc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBkPSJtOS43NSA5Ljc1IDQuNSA0LjVtMC00LjUtNC41IDQuNU0yMSAxMmE5IDkgMCAxIDEtMTggMCA5IDkgMCAwIDEgMTggMFoiIC8+PC9zdmc+',
    };

    // --- Header ---
    doc.addImage(icons.brandGuard, 'SVG', margin, y, 10, 10);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(colors.textPrimary);
    doc.text('BrandGuard', margin + 12, y + 7.5);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(colors.textSecondary);
    doc.text('Certificate of Compliance', pageW - margin, y + 3, { align: 'right' });
    doc.setFontSize(8);
    doc.text(`ID: ${report.id.slice(0, 12)}`, pageW - margin, y + 8, { align: 'right' });
    y += 15;
    doc.setDrawColor(colors.textSecondary);
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageW - margin, y);
    y += 15;

    // --- Main Status ---
    const isApproved = report.overallScore >= 90;
    const statusText = isApproved ? 'GREENLIT' : 'NEEDS REVISION';
    const statusColor = isApproved ? colors.success : colors.danger;
    const statusIcon = isApproved ? icons.shieldGreen : icons.shieldRed;

    doc.addImage(statusIcon, 'SVG', pageW / 2 - 10, y, 20, 20);
    y += 28;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(statusColor);
    doc.text(statusText, pageW / 2, y, { align: 'center' });
    y += 10;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.textSecondary);
    doc.text('This document certifies that the content has been analyzed by the BrandGuard Engine.', pageW / 2, y, { align: 'center' });
    y += 20;

    // --- Details & Summary ---
    doc.setFontSize(12);
    doc.setTextColor(colors.textPrimary);
    doc.setFont('Helvetica', 'bold');
    doc.text('Compliance Score', margin, y);
    doc.text('Engine Summary', pageW / 2, y);

    doc.setFontSize(28);
    doc.setTextColor(isApproved ? colors.success : report.overallScore >= 60 ? colors.warning : colors.danger);
    doc.text(`${report.overallScore}`, margin, y + 12);

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(colors.textSecondary);
    const summaryLines = doc.splitTextToSize(report.summary, pageW / 2 - margin - 5);
    doc.text(summaryLines, pageW / 2, y + 7);
    y += 25;

    // --- Analysis Details Box ---
    doc.setFillColor('#2D3748');
    doc.roundedRect(margin, y, pageW - (margin * 2), 25, 3, 3, 'F');
    let detailY = y + 8;
    const detailCol1 = margin + 5;
    const detailCol2 = margin + 40;
    const detailCol3 = pageW / 2 + 5;
    const detailCol4 = pageW / 2 + 40;
    doc.setFontSize(9);
    doc.setTextColor(colors.textPrimary);
    doc.setFont('Helvetica', 'bold');
    doc.text('Timestamp:', detailCol1, detailY);
    if(report.campaignName) doc.text('Campaign:', detailCol1, detailY + 7);
    doc.text('Analysis Type:', detailCol3, detailY);
    if(report.userName) doc.text('Run by:', detailCol3, detailY + 7);

    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(colors.textSecondary);
    doc.text(new Date(report.timestamp).toLocaleString(), detailCol2, detailY);
    if(report.campaignName) doc.text(report.campaignName, detailCol2, detailY + 7);
    doc.text(report.analysisType.charAt(0).toUpperCase() + report.analysisType.slice(1), detailCol4, detailY);
    if(report.userName) doc.text(report.userName, detailCol4, detailY + 7);
    y += 35;

    // --- Detailed Checks ---
    doc.setFontSize(14);
    doc.setTextColor(colors.textPrimary);
    doc.setFont('Helvetica', 'bold');
    doc.text('Detailed Checks', margin, y);
    y += 8;

    const checkStatusIcons: Record<CheckItem['status'], string> = {
        pass: icons.check,
        warn: icons.warning,
        fail: icons.cross,
    };
    report.checks.forEach(check => {
        if (y > pageH - 40) { // Check for page break
            doc.addPage();
            y = margin;
        }
        doc.addImage(checkStatusIcons[check.status], 'SVG', margin, y - 2, 6, 6);
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(colors.textPrimary);
        doc.text(check.name, margin + 10, y + 2);

        doc.setFontSize(9);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(colors.textSecondary);
        const detailLines = doc.splitTextToSize(check.details, pageW - (margin * 2) - 10);
        doc.text(detailLines, margin + 10, y + 7);
        y += detailLines.length * 4 + 8;
    });

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(colors.textSecondary);
    const footerText = `© ${new Date().getFullYear()} BrandGuard. All rights reserved. This certificate is a record of an automated compliance scan and does not constitute legal advice.`;
    const splitFooter = doc.splitTextToSize(footerText, pageW - margin*2);
    doc.text(splitFooter, pageW/2, pageH - 10, { align: 'center'});


    const fileName = `BrandGuard-Certificate-${report.id.slice(0, 8)}.pdf`;
    doc.save(fileName);
};

// FIX: Define DashboardProps interface to resolve type error.
interface DashboardProps {
  activeWorkspaceId: string;
  customRules: CustomRule[];
  onNavigate: (view: MainView) => void;
  onCreateCertificate: (report: ComplianceReport) => string;
}

const Dashboard: React.FC<DashboardProps> = ({ activeWorkspaceId, customRules, onNavigate, onCreateCertificate }) => {
  const [analysisType, setAnalysisType] = useState<AnalysisType>('text');
  const [postContent, setPostContent] = useState<string>('');
  const [campaignName, setCampaignName] = useState<string>('');
  const [campaignSuggestions, setCampaignSuggestions] = useState<string[]>([]);
  const [videoTranscript, setVideoTranscript] = useState<string>('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingText, setLoadingText] = useState('Scanning...');
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reportHistory, setReportHistory] = useState<ComplianceReport[]>([]);
  const [historyFilter, setHistoryFilter] = useState<ReportStatus | 'all'>('all');
  const [newReportId, setNewReportId] = useState<string | null>(null);
  const [activeActionMenu, setActiveActionMenu] = useState<string | null>(null);
  const [shareConfirmation, setShareConfirmation] = useState('');
  const [openCampaign, setOpenCampaign] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const reportCardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadPdf = async (reportToDownload: ComplianceReport) => {
    setActiveActionMenu(null);
    setIsGeneratingPdf(true);
    try {
        // The generation is synchronous, but a slight delay allows the UI to update the button state.
        await new Promise(resolve => setTimeout(resolve, 50)); 
        generateCertificatePdf(reportToDownload);
    } catch (error) {
        console.error("Error generating PDF:", error);
        setError("Could not generate PDF certificate.");
    } finally {
        setIsGeneratingPdf(false);
    }
  };
  
  useEffect(() => {
    setReportHistory(getReportHistory(activeWorkspaceId));
    setReport(null); // Clear active report when switching workspace
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (report && report.id === newReportId) {
      reportCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // When a new report is created, automatically open its campaign group
      setOpenCampaign(report.campaignName || 'General Scans');
      const timer = setTimeout(() => {
        setNewReportId(null);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [report, newReportId]);
  
  const handleAnalysisCompletion = useCallback((newReport: Omit<ComplianceReport, 'workspaceId'>) => {
    const reportWithWorkspace = { ...newReport, workspaceId: activeWorkspaceId };
    const reportWithInitialStatus = { ...reportWithWorkspace, status: newReport.recommendedStatus || 'pending' };
    setReport(reportWithInitialStatus);
    setNewReportId(reportWithInitialStatus.id);
    const history = getReportHistory(activeWorkspaceId);
    const newHistory = [reportWithInitialStatus, ...history];
    saveReportHistory(activeWorkspaceId, newHistory);
    setReportHistory(newHistory);
  }, [activeWorkspaceId]);

  const handleInsightReceived = useCallback((insight: string) => {
      setReport(currentReport => {
        if (!currentReport) return null;
        const updatedReport = { ...currentReport, strategicInsight: insight };
        
        // Also update the history
        setReportHistory(currentHistory => {
            const newHistory = currentHistory.map(r => r.id === updatedReport.id ? updatedReport : r);
            saveReportHistory(activeWorkspaceId, newHistory);
            return newHistory;
        });

        return updatedReport;
      });
  }, [activeWorkspaceId]);

  const handleVideoUpload = useCallback(async (file: File | null) => {
    if (file) {
        setSelectedVideoFile(file);
        setIsLoading(true);
        setLoadingText('Transcribing...');
        setError(null);
        setReport(null);
        setVideoTranscript('');
        try {
            const transcript = await transcribeVideo(file);
            setVideoTranscript(transcript);

            setLoadingText('Analyzing Video...');
            const result = await analyzeVideoContent(transcript, campaignName, file, customRules, handleInsightReceived);
            handleAnalysisCompletion(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred during video processing.");
        } finally {
            setIsLoading(false);
        }
    }
  }, [customRules, handleAnalysisCompletion, handleInsightReceived, campaignName]);

  const showWelcomeGuide = !report && !postContent.trim() && !selectedImageFile && !selectedVideoFile && !isLoading;
  
  const handleStartExample = () => {
    setAnalysisType('text');
    setPostContent(examplePost);
  };

  const handleScan = useCallback(async (options: { contentOverride?: string; isRescan?: boolean; isQuickScan?: boolean } = {}) => {
    const { contentOverride, isRescan = false, isQuickScan = false } = options;
    setIsLoading(true);
    setLoadingText('Scanning...');
    setReport(null);
    setError(null);

    try {
      let result;
      const contentToScan = contentOverride !== undefined ? contentOverride : postContent;
      const campaignToScan = isQuickScan ? '' : campaignName;

      if (analysisType === 'text') {
        if (!contentToScan.trim()) throw new Error("Please enter post content to analyze.");
        result = await analyzePostContent(contentToScan, campaignToScan, customRules, isRescan, handleInsightReceived);
      } else if (analysisType === 'video') {
         if (fileInputRef.current) {
            fileInputRef.current.click();
         }
         // Don't set loading to false here; it's handled in handleVideoUpload
         return;
      } else if (analysisType === 'image') {
        if (!contentToScan.trim() || !selectedImageFile) throw new Error("Please provide an image and a caption.");
        setLoadingText('Analyzing Image...');
        result = await analyzeImageContent(contentToScan, campaignName, selectedImageFile, customRules, handleInsightReceived);
      }
      
      if(result) {
        handleAnalysisCompletion(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
       if (analysisType !== 'video') {
        setIsLoading(false);
      }
    }
  }, [analysisType, postContent, campaignName, selectedImageFile, customRules, handleAnalysisCompletion, handleInsightReceived]);
  
  const handleStatusChange = (reportId: string, newStatus: ReportStatus) => {
    const updatedHistory = reportHistory.map(r => r.id === reportId ? { ...r, status: newStatus } : r);
    setReportHistory(updatedHistory);
    saveReportHistory(activeWorkspaceId, updatedHistory);

    if (report?.id === reportId) {
        setReport(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };
  
  const handleAcceptRevision = (revisedContent: string) => {
      setPostContent(revisedContent);
      setReport(null);
      handleScan({ contentOverride: revisedContent, isRescan: true });
  };

  const resetState = (clearInputs = true) => {
    setReport(null);
    setError(null);
    if (clearInputs) {
      setPostContent('');
      setCampaignName('');
      setVideoTranscript('');
      setSelectedVideoFile(null);
      setSelectedImageFile(null);
    }
  };
  const switchTab = (type: AnalysisType) => {
    setAnalysisType(type);
    resetState();
  };
  const viewHistoricReport = (historicReport: ComplianceReport) => {
    setActiveActionMenu(null);
    resetState(false);
    setReport(historicReport);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const deleteReport = (reportId: string) => {
    setActiveActionMenu(null);
    const newHistory = reportHistory.filter(r => r.id !== reportId);
    saveReportHistory(activeWorkspaceId, newHistory);
    setReportHistory(newHistory);
    if (report?.id === reportId) {
      setReport(null);
    }
  };
  
  const handleShareReport = (reportToShare: ComplianceReport) => {
    setActiveActionMenu(null);
    const confirmation = onCreateCertificate(reportToShare);
    setShareConfirmation(confirmation);
    setTimeout(() => setShareConfirmation(''), 2000);
  };
  
  const getButtonText = () => {
    if (analysisType === 'video') return 'Select & Analyze Video';
    if (analysisType === 'image') return 'Scan Image & Caption';
    return 'Scan Post';
  };
  
  const isScanDisabled = () => {
      if (isLoading || isGeneratingPdf) return true;
      if (analysisType === 'text' && !postContent.trim()) return true;
      if (analysisType === 'image' && (!postContent.trim() || !selectedImageFile)) return true;
      return false;
  }
  
  const allCampaigns = useMemo(() => {
    const campaigns = new Set(reportHistory.map(r => r.campaignName).filter(Boolean) as string[]);
    return Array.from(campaigns);
  }, [reportHistory]);

  const handleCampaignNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCampaignName(value);
    if (value) {
        setCampaignSuggestions(allCampaigns.filter(c => c.toLowerCase().includes(value.toLowerCase()) && c.toLowerCase() !== value.toLowerCase()));
    } else {
        setCampaignSuggestions([]);
    }
  };

  const selectCampaign = (name: string) => {
    setCampaignName(name);
    setCampaignSuggestions([]);
  };

  const statusDisplayConfig: Record<ReportStatus, { tag: string, color: string, filterColor: string }> = {
    pending: { tag: 'Pending', color: 'bg-yellow-500/20 text-yellow-300', filterColor: 'hover:bg-yellow-500/10 text-yellow-400' },
    approved: { tag: 'Approved', color: 'bg-green-500/20 text-green-300', filterColor: 'hover:bg-green-500/10 text-green-400' },
    revision: { tag: 'Needs Revision', color: 'bg-red-500/20 text-red-300', filterColor: 'hover:bg-red-500/10 text-red-400' },
  };

  const filteredHistory = reportHistory.filter(r => historyFilter === 'all' || r.status === historyFilter);

  const campaignGroups = useMemo(() => {
    const groups: Record<string, ComplianceReport[]> = {};
    filteredHistory.forEach(report => {
        const key = report.campaignName || 'General Scans';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(report);
    });
    return Object.entries(groups).sort(([, reportsA], [, reportsB]) => {
        return new Date(reportsB[0].timestamp).getTime() - new Date(reportsA[0].timestamp).getTime();
    });
  }, [filteredHistory]);

  const getStatusCount = (status: ReportStatus | 'all') => {
      if (status === 'all') return reportHistory.length;
      return reportHistory.filter(r => r.status === status).length;
  }
const getReportHistory = (workspaceId: string): ComplianceReport[] => {
    try {
        const historyJson = localStorage.getItem(`brandGuardReportHistory_${workspaceId}`);
        if (!historyJson) return [];
        const history = JSON.parse(historyJson);
        return history.map((report: any) => ({
            ...report,
            status: report.status || 'pending'
        }));
    } catch (e) { return []; }
};

const saveReportHistory = (workspaceId: string, history: ComplianceReport[]) => {
    localStorage.setItem(`brandGuardReportHistory_${workspaceId}`, JSON.stringify(history));
}

const examplePost = `These new sneakers are a game-changer! So comfy and they look amazing. You absolutely have to try them out for your next run. #newgear #running #style`;

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-gray-300">

      <Analytics reportHistory={reportHistory} />
      
      <div className="flex justify-between items-center mt-8 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Compliance Dashboard
          </h1>
          <p className="text-gray-400">
            Analyze content against FTC guidelines, brand safety, and your own custom rules.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div ref={reportCardRef} className="lg:col-span-2 space-y-6">
              
              {report && !isLoading ? (
                <Suspense fallback={<div className="w-full min-h-[400px] flex items-center justify-center"><Loader /></div>}>
                  <ReportCard report={report} onStatusChange={handleStatusChange} onAcceptRevision={handleAcceptRevision} onDownloadPdf={handleDownloadPdf} isGeneratingPdf={isGeneratingPdf} />
                </Suspense>
              ) : (
                <>
                  {showWelcomeGuide && <WelcomeGuide onStartExample={handleStartExample} />}

                  <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 shadow-lg">
                    <div className="mb-4 border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => switchTab('text')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'text' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Text Post</button>
                            <button onClick={() => switchTab('image')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'image' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Image Post</button>
                            <button onClick={() => switchTab('video')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${analysisType === 'video' ? 'border-primary text-primary-light' : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-500'}`}>Video Post</button>
                        </nav>
                    </div>

                     <div className="space-y-4">
                         {analysisType !== 'video' && <textarea value={postContent} onChange={(e) => setPostContent(e.target.value)} onKeyDown={(e) => { if (analysisType === 'text' && (e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); if (!isScanDisabled()) { handleScan({ isQuickScan: true }); } } }} placeholder={analysisType === 'image' ? 'Paste caption for image post here...' : 'Paste influencer post caption here...'} rows={8} className="w-full p-3 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50" disabled={isLoading} />}
                         {analysisType === 'image' && (
                             <div>
                                <label htmlFor="image-upload" className="block text-sm font-medium text-gray-400 mb-2">Upload Image</label>
                                <input id="image-upload" type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => setSelectedImageFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading}/>
                                 {selectedImageFile && <p className="text-xs text-gray-500 mt-2">Selected: {selectedImageFile.name}</p>}
                             </div>
                         )}
                         {analysisType === 'video' && (
                             <div className="space-y-4">
                                <div className="text-center p-4 border-2 border-dashed border-gray-600 rounded-lg">
                                  <FilmIcon />
                                  <p className="mt-2 text-sm text-gray-400">The "Select & Analyze Video" button below will open a file dialog.</p>
                                  <p className="text-xs text-gray-500">The video will be automatically transcribed and analyzed in one step.</p>
                                  {selectedVideoFile && <p className="text-xs text-gray-400 mt-2 font-semibold">Selected: {selectedVideoFile.name}</p>}
                                </div>
                                 <input ref={fileInputRef} id="video-upload" type="file" accept="video/mp4, video/quicktime, video/webm" onChange={(e) => handleVideoUpload(e.target.files ? e.target.files[0] : null)} className="hidden" disabled={isLoading}/>

                                <div className="bg-dark p-3 rounded-md border border-gray-600 min-h-[100px]">
                                    <p className="text-sm font-medium text-gray-400">Generated Transcript:</p>
                                    {loadingText === 'Transcribing...'
                                        ? <Loader text="Transcribing video..." />
                                        : <p className="text-gray-300 whitespace-pre-wrap text-sm mt-2">{videoTranscript || "Transcript will appear here after video processing."}</p>}
                                </div>
                             </div>
                         )}
                         
                         <div className="relative">
                            <label htmlFor="campaign-name" className="block text-sm font-medium text-gray-400 mb-1">Campaign Name (Optional)</label>
                            <input 
                                id="campaign-name" 
                                type="text" 
                                value={campaignName}
                                onChange={handleCampaignNameChange}
                                placeholder="e.g., Q3 Sneaker Launch"
                                className="w-full p-2 border border-gray-600 rounded-md bg-dark text-gray-300 focus:ring-2 focus:ring-primary focus:border-primary transition disabled:opacity-50"
                                disabled={isLoading}
                                autoComplete="off"
                            />
                             {campaignSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-dark border border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
                                    {campaignSuggestions.map(suggestion => (
                                        <button key={suggestion} onClick={() => selectCampaign(suggestion)} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700">
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            )}
                         </div>

                        <div className="flex items-center justify-center p-0.5 bg-primary text-white font-bold rounded-md hover:bg-primary-dark disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-lg shadow-lg shadow-primary/20">
                            <button
                                onClick={() => handleScan()}
                                disabled={isScanDisabled()}
                                className="w-full px-6 py-3 flex-grow flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader size="sm" />
                                        <span>{loadingText}</span>
                                    </>
                                ) : (
                                    <span>{getButtonText()}</span>
                                )}
                            </button>
                             {analysisType === 'text' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (isScanDisabled()) return;
                                        handleScan({ isQuickScan: true });
                                    }}
                                    disabled={isScanDisabled()}
                                    className="flex items-center pl-4 pr-3 self-stretch cursor-pointer group"
                                    title="Quick Scan (Ctrl+Enter)"
                                >
                                    <div className="h-full border-l border-white/30 transition-colors group-hover:border-white/50"></div>
                                    <div className="ml-3 p-1 rounded-full transition-colors group-hover:bg-black/20">
                                        <SparklesIcon />
                                    </div>
                                </button>
                            )}
                        </div>
                     </div>
                  </div>
                </>
              )}
               {error && <div className="mt-4 bg-red-900/50 border border-danger text-red-300 px-4 py-3 rounded-lg" role="alert"><p className="font-bold">Error</p><p>{error}</p></div>}
          </div>
          
          <div className="bg-secondary-dark p-6 rounded-lg border border-gray-700 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><HistoryIcon /> Greenlight Log</h2>
              <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-400">Filter by status:</span>
                  <div className="flex space-x-1 p-1 bg-dark rounded-md">
                       <button onClick={() => setHistoryFilter('all')} className={`px-2 py-1 text-xs rounded ${historyFilter === 'all' ? 'bg-primary text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                           All ({getStatusCount('all')})
                      </button>
                      {(Object.keys(statusDisplayConfig) as ReportStatus[]).map(status => {
                          const count = getStatusCount(status);
                          if (count === 0) return null;
                          return (
                              <button key={status} onClick={() => setHistoryFilter(status)} className={`px-2 py-1 text-xs rounded ${historyFilter === status ? `${statusDisplayConfig[status].color} !text-white` : statusDisplayConfig[status].filterColor}`}>
                                  {statusDisplayConfig[status].tag} ({count})
                              </button>
                          )
                      })}
                  </div>
              </div>
              <div className="space-y-3">
                  {campaignGroups.length > 0 ? (
                    campaignGroups.map(([campaign, reports]) => (
                        <div key={campaign} className="bg-dark rounded-md border border-gray-800">
                            <button 
                                onClick={() => setOpenCampaign(openCampaign === campaign ? null : campaign)}
                                className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-800 rounded-md transition-colors"
                            >
                                <span className="font-semibold text-white flex items-center gap-2 truncate">
                                    <FolderIcon /> 
                                    <span className="truncate">{campaign}</span>
                                </span>
                                <span className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs text-gray-400 bg-secondary-dark px-2 py-0.5 rounded-full">{reports.length} {reports.length === 1 ? 'scan' : 'scans'}</span>
                                    <ChevronDownIcon className={`transform transition-transform ${openCampaign === campaign ? 'rotate-180' : ''} w-5 h-5`} />
                                </span>
                            </button>
                            {openCampaign === campaign && (
                                <div className="p-3 border-t border-gray-700 space-y-3 animate-fade-in">
                                    {reports.map(r => (
                                        <div key={r.id} className={`p-3 bg-secondary-dark rounded-md hover:bg-gray-800 transition-colors group ${r.id === newReportId ? 'highlight-new' : ''}`}>
                                            <div className="flex justify-between items-start">
                                                <button onClick={() => viewHistoricReport(r)} className="text-left flex-grow truncate pr-2">
                                                    <p className="text-sm font-medium text-white truncate">{r.analysisType.charAt(0).toUpperCase() + r.analysisType.slice(1)} Post - {new Date(r.timestamp).toLocaleTimeString()}</p>
                                                    <p className="text-xs text-gray-400 truncate">{new Date(r.timestamp).toLocaleDateString()}</p>
                                                    {r.userName && <p className="text-xs text-gray-500 truncate mt-1">Run by: {r.userName}</p>}
                                                </button>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusDisplayConfig[r.status || 'pending'].color}`}>{statusDisplayConfig[r.status || 'pending'].tag}</span>
                                                    <div className="relative">
                                                        <button onClick={() => setActiveActionMenu(activeActionMenu === r.id ? null : r.id)} className="text-gray-500 hover:text-white transition-colors">
                                                            <EllipsisHorizontalIcon />
                                                        </button>
                                                        {activeActionMenu === r.id && (
                                                            <div className="absolute right-0 mt-2 w-48 bg-dark border border-gray-700 rounded-md shadow-lg z-10 animate-fade-in">
                                                                <button onClick={() => viewHistoricReport(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">View Report</button>
                                                                <button onClick={() => handleDownloadPdf(r)} disabled={isGeneratingPdf} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-50">
                                                                    {isGeneratingPdf && activeActionMenu === r.id ? 'Generating...' : 'Download Certificate'}
                                                                </button>
                                                                <button onClick={() => handleShareReport(r)} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">{shareConfirmation && activeActionMenu === r.id ? shareConfirmation : 'Share Certificate'}</button>
                                                                <button onClick={() => deleteReport(r.id)} className="block w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/20">Delete Report</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                  ) : <p className="text-center text-gray-500 text-sm py-4">No reports match the current filter.</p>}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
