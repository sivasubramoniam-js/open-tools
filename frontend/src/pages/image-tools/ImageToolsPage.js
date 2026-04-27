import React, { useState, useRef } from 'react';
import { 
  Upload, Download, Wand2, 
  Crop, FileType, Filter, ShieldCheck, 
  Trash2, QrCode
} from 'lucide-react';
import './ImageToolsPage.css';

const categories = [
  {
    id: 'ai-tools',
    label: 'AI & Smart Tools',
    icon: <Wand2 size={18} />,
    tools: [
      { id: 'remove-bg', label: 'Background Remover', desc: 'Auto-remove backgrounds using neural networks.' },
      { id: 'ocr', label: 'Image to Text (OCR)', desc: 'Extract text from any photo or document.' },
      { id: 'upscale', label: 'AI Upscaler', desc: 'Enhance and upscale images with Lanczos resampling.' }
    ]
  },
  {
    id: 'conversion',
    label: 'Format Conversion',
    icon: <FileType size={18} />,
    tools: [
      { id: 'convert', label: 'General Converter', desc: 'Convert between PNG, JPG, WebP, AVIF, and PDF.' },
      { id: 'base64', label: 'Base64 Encoder', desc: 'Get the Base64 data string for any image.' },
      { id: 'qr', label: 'QR Generator', desc: 'Create a QR code with custom colors and logo.' }
    ]
  },
  {
    id: 'edit',
    label: 'Resize & Transform',
    icon: <Crop size={18} />,
    tools: [
      { id: 'resize', label: 'Image Resizer', desc: 'Resize by pixels or percentage.' },
      { id: 'rotate', label: 'Rotate Image', desc: 'Rotate by 90-degree steps.' },
      { id: 'flip', label: 'Flip Image', desc: 'Reflect image horizontally or vertically.' }
    ]
  },
  {
    id: 'filters',
    label: 'Filters & Beauty',
    icon: <Filter size={18} />,
    tools: [
      { id: 'grayscale', label: 'Grayscale', desc: 'Classic black & white.' },
      { id: 'sepia', label: 'Sepia', desc: 'Vintage warm tones.' },
      { id: 'invert', label: 'Invert Colors', desc: 'Negative image effect.' },
      { id: 'blur', label: 'Gaussian Blur', desc: 'Smooth blur effect.' }
    ]
  },
  {
    id: 'privacy',
    label: 'Privacy & Data',
    icon: <ShieldCheck size={18} />,
    tools: [
      { id: 'strip-metadata', label: 'Metadata Stripper', desc: 'Wipe all EXIF and GPS data.' }
    ]
  }
];

function ImageToolsPage() {
  const [activeTool, setActiveTool] = useState(categories[0].tools[0]);
  const [file, setFile] = useState(null);
  const [qrLogo, setQrLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resultText, setResultText] = useState('');
  const [settings, setSettings] = useState({
    targetFormat: 'PNG',
    width: '',
    height: '',
    percentage: '',
    degrees: '90',
    direction: 'horizontal',
    qrText: 'https://opentools.io',
    qrFill: '#000000',
    qrBack: '#ffffff'
  });
  
  const fileInputRef = useRef(null);
  const qrLogoRef = useRef(null);

  const needsFile = activeTool.id !== 'qr';

  const resetState = () => {
      setFile(null);
      setQrLogo(null);
      setPreview(null);
      setDownloadUrl('');
      setResultText('');
      setError('');
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setError('');
      setResultText('');
      setDownloadUrl('');
    }
  };

  const handleLogoSelect = (e) => {
     if (e.target.files[0]) {
         setQrLogo(e.target.files[0]);
     }
  };

  const runBackendTool = async () => {
    if (needsFile && !file) {
        setError('Please select an image first.');
        return;
    }
    
    setLoading(true);
    setError('');
    
    const formData = new FormData();
    if (file) formData.append('image', file);
    
    if (activeTool.id === 'convert') formData.append('target', settings.targetFormat);
    if (activeTool.id === 'resize') {
        formData.append('width', settings.width);
        formData.append('height', settings.height);
        formData.append('percentage', settings.percentage);
    }
    if (activeTool.id === 'rotate') formData.append('degrees', settings.degrees);
    if (activeTool.id === 'flip') formData.append('direction', settings.direction);
    
    if (activeTool.id === 'qr') {
        formData.append('text', settings.qrText);
        formData.append('fill_color', settings.qrFill);
        formData.append('back_color', settings.qrBack);
        if (qrLogo) formData.append('logo', qrLogo);
    }

    try {
      const response = await fetch(`http://localhost:8001/api/image-tools/${activeTool.id}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else if (data.text) {
        setResultText(data.text);
        setPreview(null);
        setDownloadUrl('');
      } else if (data.image) {
        setPreview(data.image);
        setDownloadUrl(data.download_url);
      }
    } catch (err) {
      setError('Connection to local server failed. Ensure the Flask backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const downloadResult = () => {
    if (!downloadUrl) return;

    // Preserve original filename logic
    let baseName = 'opentools_result';
    if (file && file.name) {
      baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    } else if (activeTool.id === 'qr') {
      baseName = `qr_code_${Date.now()}`;
    }

    // Extension logic
    let ext = 'png';
    if (activeTool.id === 'convert') {
      ext = settings.targetFormat.toLowerCase();
    } else if (file && file.name) {
      ext = file.name.split('.').pop().toLowerCase() || 'png';
    }

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${baseName}_${activeTool.id}.${ext}`;
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
            <div className="canvas-area" onClick={() => needsFile && !file && fileInputRef.current.click()}>
              {preview ? (
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <img src={preview} alt="Preview" className="image-preview" />
                  {loading && <div className="loading-overlay"><div className="spinner" /></div>}
                </div>
              ) : resultText ? (
                <div style={{ padding: '2rem', width:'100%' }}>
                   <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
                     <span style={{fontWeight:700, color:'var(--primary)'}}>Operation Result:</span>
                     <button className="v2-tag" onClick={() => navigator.clipboard.writeText(resultText)}>Copy All</button>
                   </div>
                   <textarea 
                    readOnly 
                    value={resultText} 
                    style={{width:'100%', height:'300px', background:'rgba(0,0,0,0.2)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1rem', color:'var(--text-primary)', fontFamily:'monospace'}} 
                   />
                </div>
              ) : (
                <div className="file-upload-overlay">
                  {activeTool.id === 'qr' ? (
                     <>
                       <QrCode size={64} className="upload-icon" />
                       <div className="upload-text">QR Config Mode</div>
                       <div className="upload-hint">Customize in sidebar and generate</div>
                     </>
                  ) : (
                    <>
                      <Upload className="upload-icon" size={64} />
                      <div className="upload-text">Click to upload image</div>
                      <div className="upload-hint">PNG, JPG, HEIC, WEBP supported</div>
                      <input type="file" hidden ref={fileInputRef} onChange={handleFileSelect} accept="image/*" />
                    </>
                  )}
                </div>
              )}
              {error && <div style={{ color: 'var(--accent)', marginTop: '1rem', fontWeight: 600 }}>{error}</div>}
            </div>

            <div className="settings-panel">
              <h4 style={{ marginBottom: '1.5rem' }}>Configuration</h4>
              
              {activeTool.id === 'convert' && (
                <div className="setting-group">
                  <label className="setting-label">Target Format</label>
                  <select className="setting-input" value={settings.targetFormat} onChange={(e) => setSettings({...settings, targetFormat: e.target.value})}>
                    <option value="PNG">PNG Image</option>
                    <option value="JPG">JPG Image</option>
                    <option value="WEBP">WebP</option>
                    <option value="AVIF">AVIF</option>
                    <option value="PDF">PDF Document</option>
                  </select>
                </div>
              )}

              {activeTool.id === 'qr' && (
                <>
                  <div className="setting-group">
                    <label className="setting-label">QR Content</label>
                    <input className="setting-input" value={settings.qrText} onChange={(e) => setSettings({...settings, qrText: e.target.value})} placeholder="Link or Text" />
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">Colors</label>
                    <div style={{display:'flex', gap:'10px'}}>
                        <input type="color" className="color-picker" value={settings.qrFill} onChange={(e) => setSettings({...settings, qrFill: e.target.value})} title="Frontend Color" />
                        <input type="color" className="color-picker" value={settings.qrBack} onChange={(e) => setSettings({...settings, qrBack: e.target.value})} title="Background Color" />
                    </div>
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">Center Logo (Optional)</label>
                    <button className="v2-tag" style={{width:'100%', justifyContent:'center', padding:'10px'}} onClick={() => qrLogoRef.current.click()}>
                        {qrLogo ? qrLogo.name : 'Upload Logo'}
                    </button>
                    <input type="file" hidden ref={qrLogoRef} onChange={handleLogoSelect} accept="image/*" />
                  </div>
                </>
              )}

              {activeTool.id === 'resize' && (
                <>
                  <div className="setting-group">
                    <label className="setting-label">Width (px)</label>
                    <input className="setting-input" type="number" value={settings.width} onChange={(e) => setSettings({...settings, width: e.target.value})} />
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">Height (px)</label>
                    <input className="setting-input" type="number" value={settings.height} onChange={(e) => setSettings({...settings, height: e.target.value})} />
                  </div>
                  <div className="setting-group">
                    <label className="setting-label">Or resize by %</label>
                    <input className="setting-input" type="number" value={settings.percentage} onChange={(e) => setSettings({...settings, percentage: e.target.value})} />
                  </div>
                </>
              )}

              {activeTool.id === 'rotate' && (
                <div className="setting-group">
                  <label className="setting-label">Rotation Degrees</label>
                  <select className="setting-input" value={settings.degrees} onChange={(e) => setSettings({...settings, degrees: e.target.value})}>
                    <option value="90">90° CW</option>
                    <option value="180">180°</option>
                    <option value="270">270° CCW</option>
                  </select>
                </div>
              )}

              {activeTool.id === 'flip' && (
                <div className="setting-group">
                  <label className="setting-label">Direction</label>
                  <select className="setting-input" value={settings.direction} onChange={(e) => setSettings({...settings, direction: e.target.value})}>
                    <option value="horizontal">Horizontal (Mirror)</option>
                    <option value="vertical">Vertical</option>
                  </select>
                </div>
              )}

              <button className="action-btn" disabled={loading} onClick={runBackendTool}>
                {loading ? 'Processing...' : 'Process Tool'}
              </button>

              {(preview || downloadUrl) && !loading && (
                <button className="action-btn" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }} onClick={downloadResult}>
                  <Download size={18} /> Download
                </button>
              )}

              {(file || resultText || activeTool.id === 'qr') && (
                <button className="action-btn" style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent)' }} onClick={resetState}>
                  <Trash2 size={18} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ImageToolsPage;
