import React, { useState, useRef } from 'react';
import { 
  Upload, Download, FileText, Layers, Trash2
} from 'lucide-react';
import '../image-tools/ImageToolsPage.css'; // Reusing CSS

const categories = [
  {
    id: 'pdf-management',
    label: 'PDF Management',
    icon: <Layers size={18} />,
    tools: [
      { id: 'merge', label: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.' },
      { id: 'split', label: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.' },
      { id: 'compress', label: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.' },
      { id: 'organize', label: 'Organize PDF', desc: 'Sort pages of your PDF file however you like.' },
      { id: 'rotate', label: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them.' },
      { id: 'repair', label: 'Repair PDF', desc: 'Repair a damaged PDF and recover data from corrupt PDF.' }
    ]
  },
  {
    id: 'convert-from',
    label: 'Convert from PDF',
    icon: <FileText size={18} />,
    tools: [
      { id: 'pdf_to_word', label: 'PDF to Word', desc: 'Convert your PDF files into easy to edit DOC and DOCX documents.' },
      { id: 'pdf_to_powerpoint', label: 'PDF to PPT', desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.' },
      { id: 'pdf_to_excel', label: 'PDF to Excel', desc: 'Pull data straight from PDFs into Excel spreadsheets.' },
      { id: 'pdf_to_jpg', label: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract images.' },
      { id: 'pdf_to_pdfa', label: 'PDF to PDF/A', desc: 'Transform your PDF to PDF/A for long-term archiving.' }
    ]
  },
  {
    id: 'convert-to',
    label: 'Convert to PDF',
    icon: <FileText size={18} />,
    tools: [
      { id: 'word_to_pdf', label: 'Word to PDF', desc: 'Make DOC and DOCX files easy to read by converting them to PDF.' },
      { id: 'powerpoint_to_pdf', label: 'PPT to PDF', desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.' },
      { id: 'excel_to_pdf', label: 'Excel to PDF', desc: 'Make EXCEL spreadsheets easy to read by converting them to PDF.' },
      { id: 'jpg_to_pdf', label: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds.' },
      { id: 'html_to_pdf', label: 'HTML to PDF', desc: 'Convert webpages in HTML to PDF.' },
      { id: 'scan_to_pdf', label: 'Scan to PDF', desc: 'Capture document scans from your mobile device.' }
    ]
  },
  {
    id: 'security-signing',
    label: 'Security & Sign',
    icon: <Layers size={18} />,
    tools: [
      { id: 'protect', label: 'Protect PDF', desc: 'Protect PDF files with a password.' },
      { id: 'unlock', label: 'Unlock PDF', desc: 'Remove PDF password security.' },
      { id: 'sign', label: 'Sign PDF', desc: 'Sign yourself or request electronic signatures from others.' },
      { id: 'watermark', label: 'Watermark', desc: 'Stamp an image or text over your PDF in seconds.' },
      { id: 'redact', label: 'Redact PDF', desc: 'Permanently remove sensitive information from a PDF.' }
    ]
  },
  {
    id: 'editor-advanced',
    label: 'Edit & Advanced',
    icon: <FileText size={18} />,
    tools: [
      { id: 'edit', label: 'Edit PDF', desc: 'Add text, images, shapes or freehand annotations.' },
      { id: 'ocr', label: 'OCR PDF', desc: 'Easily convert scanned PDF into searchable and selectable documents.' },
      { id: 'crop', label: 'Crop PDF', desc: 'Crop margins of PDF documents or select specific areas.' },
      { id: 'page_numbers', label: 'Page Numbers', desc: 'Add page numbers into PDFs with ease.' },
      { id: 'compare', label: 'Compare PDF', desc: 'Show a side-by-side document comparison.' },
      { id: 'summarize', label: 'AI Summarizer', desc: 'Quickly generate concise summaries from articles.' },
      { id: 'translate', label: 'Translate PDF', desc: 'Easily translate PDF files powered by AI.' }
    ]
  }
];

function PdfToolsPage() {
  const [activeTool, setActiveTool] = useState(categories[0].tools[0]);
  const [files, setFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [targetExt, setTargetExt] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState({
    degrees: '90',
    password: '',
    pages_order: '0',
    margin: '10',
    html_text: '<h1>Hello World</h1><p>Convert me to a crisp PDF!</p>',
    watermark_text: 'CONFIDENTIAL',
    redact_text: 'Secret'
  });
  
  const fileInputRef = useRef(null);

  const resetState = () => {
      setFiles([]);
      setDownloadUrl('');
      setError('');
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      setError('');
      setDownloadUrl('');
    }
  };

  const runBackendTool = async () => {
    if (activeTool.id === 'merge' && files.length < 2) {
        setError('Please select at least two PDF files to merge.');
        return;
    }
    if (activeTool.id !== 'html_to_pdf' && files.length === 0) {
        setError('Please select a file first.');
        return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (activeTool.id === 'rotate') formData.append('degrees', settings.degrees);
    if (activeTool.id === 'protect' || activeTool.id === 'unlock') formData.append('password', settings.password);
    if (activeTool.id === 'organize') formData.append('pages_order', settings.pages_order);
    if (activeTool.id === 'crop') formData.append('margin', settings.margin);
    if (activeTool.id === 'html_to_pdf') formData.append('html_text', settings.html_text);
    if (activeTool.id === 'watermark') formData.append('watermark_text', settings.watermark_text);
    if (activeTool.id === 'redact') formData.append('redact_text', settings.redact_text);

    try {
      const response = await fetch(`http://localhost:8001/api/pdf-tools/${activeTool.id}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        if (data.download_url) {
          setDownloadUrl(data.download_url);
          if (data.target_ext) setTargetExt(data.target_ext);
        }
      } else {
        setError(data.error || 'Failed to process PDF.');
      }
    } catch (err) {
      setError('Connection to local server failed. Ensure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!downloadUrl) return;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `opentools_${activeTool.id}_result.${targetExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="v2-container image-tools-page">
      <aside className="tools-sidebar">
        {categories.map(cat => (
          <div className="category-group" key={cat.id}>
            <div className="category-header">{cat.label}</div>
            {cat.tools.map(tool => (
              <div 
                className={`tool-item ${activeTool.id === tool.id ? 'active' : ''}`}
                key={tool.id}
                onClick={() => { setActiveTool(tool); resetState(); }}
              >
                {activeTool.id === tool.id ? <div style={{width: 4}} /> : cat.icon}
                <span>{tool.label}</span>
              </div>
            ))}
          </div>
        ))}
      </aside>

      <main className="tools-main">
        <div className="tool-container">
          <div className="tool-header">
            <h1 className="tool-title gradient-text">{activeTool.label}</h1>
            <p className="tool-desc">{activeTool.desc}</p>
          </div>

          <div className="editor-grid">
            <div className="canvas-area" onClick={() => files.length === 0 && activeTool.id !== 'html_to_pdf' && fileInputRef.current.click()}>
              {activeTool.id === 'html_to_pdf' ? (
                <div style={{ padding: '20px', width: '100%', height:'100%', textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Raw HTML Input:</h3>
                  <textarea 
                    value={settings.html_text}
                    onChange={(e) => setSettings({...settings, html_text: e.target.value})}
                    style={{ flex: 1, width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '1rem', borderRadius: '8px', fontFamily: 'monospace' }}
                  />
                  {loading && <div className="loading-overlay"><div className="spinner" /></div>}
                </div>
              ) : files.length > 0 ? (
                <div style={{ padding: '20px', width: '100%', textAlign: 'left' }}>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>Selected Files:</h3>
                  <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {files.map((file, index) => (
                      <li key={index} style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{file.name}</span>
                        <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </li>
                    ))}
                  </ul>
                  <button 
                    className="action-btn" 
                    style={{ marginTop: '1rem', width: 'auto', display: 'inline-flex', padding: '0.5rem 1rem' }}
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}
                  >
                    + Add More
                  </button>
                  {loading && <div className="loading-overlay"><div className="spinner" /></div>}
                </div>
              ) : (
                <div className="file-upload-overlay">
                  <Upload className="upload-icon" size={64} />
                  <div className="upload-text">Click to upload PDFs</div>
                  <div className="upload-hint">Upload multiple PDFs for merging</div>
                  <input type="file" hidden multiple ref={fileInputRef} onChange={handleFileSelect} accept="application/pdf" />
                </div>
              )}
              {error && <div style={{ color: 'var(--accent)', marginTop: '1rem', fontWeight: 600 }}>{error}</div>}
            </div>

            <div className="settings-panel">
              <h4 style={{ marginBottom: '1.5rem' }}>Configuration</h4>

              {activeTool.id === 'rotate' && (
                <div className="setting-group" style={{ marginBottom: '1rem' }}>
                  <label className="setting-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Rotation Degrees</label>
                  <select value={settings.degrees} onChange={(e) => setSettings({...settings, degrees: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }}>
                    <option value="90">90° CW</option>
                    <option value="180">180°</option>
                    <option value="270">270° CCW</option>
                  </select>
                </div>
              )}

              {(activeTool.id === 'protect' || activeTool.id === 'unlock') && (
                <div className="setting-group" style={{ marginBottom: '1rem' }}>
                  <label className="setting-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Files Password</label>
                  <input type="password" placeholder="Enter password" value={settings.password} onChange={(e) => setSettings({...settings, password: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                </div>
              )}

              {activeTool.id === 'organize' && (
                <div className="setting-group" style={{ marginBottom: '1rem' }}>
                  <label className="setting-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Pages Order (0-indexed, comma separated)</label>
                  <input type="text" placeholder="e.g. 0,2,1" value={settings.pages_order} onChange={(e) => setSettings({...settings, pages_order: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                </div>
              )}

              {activeTool.id === 'crop' && (
                <div className="setting-group" style={{ marginBottom: '1rem' }}>
                  <label className="setting-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Crop Margin (pixels)</label>
                  <input type="number" placeholder="10" value={settings.margin} onChange={(e) => setSettings({...settings, margin: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                </div>
              )}

              {activeTool.id === 'watermark' && (
                <div className="setting-group" style={{ marginBottom: '1rem' }}>
                  <label className="setting-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Watermark Text</label>
                  <input type="text" placeholder="CONFIDENTIAL" value={settings.watermark_text} onChange={(e) => setSettings({...settings, watermark_text: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                </div>
              )}

              {activeTool.id === 'redact' && (
                <div className="setting-group" style={{ marginBottom: '1rem' }}>
                  <label className="setting-label" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Text to Redact</label>
                  <input type="text" placeholder="Confidential string to hide" value={settings.redact_text} onChange={(e) => setSettings({...settings, redact_text: e.target.value})} style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '8px' }} />
                </div>
              )}

              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Tool selected: {activeTool.label}. Files will be processed locally if possible or on your private server instance.
              </p>

              <button className="action-btn" disabled={loading || (files.length === 0 && activeTool.id !== 'html_to_pdf')} onClick={runBackendTool}>
                {loading ? 'Processing...' : 'Process PDF'}
              </button>

              {downloadUrl && !loading && (
                <button className="action-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={downloadResult}>
                  <Download size={18} /> Download Result
                </button>
              )}

              {files.length > 0 && (
                <button className="action-btn" style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)' }} onClick={resetState}>
                  <Trash2 size={18} /> Clear Files
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PdfToolsPage;
