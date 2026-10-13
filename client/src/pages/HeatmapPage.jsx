import React, { useEffect, useState, useRef } from 'react';
import {
  Flame,
  MousePointer2,
  Layers,
  Sliders,
  Maximize2,
  ExternalLink,
  RefreshCw,
  Info,
  Sparkles,
} from 'lucide-react';
import { fetchHeatmap, fetchTrackedPages } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import { formatDate } from '../utils/formatters';

export default function HeatmapPage() {
  const [pages, setPages] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState('');
  const [heatmapData, setHeatmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Heatmap configuration controls
  const [viewMode, setViewMode] = useState('density'); // 'density' | 'points' | 'both'
  const [radius, setRadius] = useState(28);
  const [opacity, setOpacity] = useState(0.75);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Load list of tracked pages
  const loadPages = async () => {
    try {
      const res = await fetchTrackedPages();
      const pageList = res.pages || [];
      setPages(pageList);

      if (pageList.length > 0 && !selectedUrl) {
        setSelectedUrl(pageList[0].page_url);
      } else if (!selectedUrl) {
        setSelectedUrl('http://localhost:5000/tracker/demo.html');
      }
    } catch (err) {
      console.error('Failed to load tracked pages:', err);
      if (!selectedUrl) {
        setSelectedUrl('http://localhost:5000/tracker/demo.html');
      }
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  // Fetch heatmap clicks when selectedUrl changes
  const loadHeatmapData = async (url) => {
    if (!url) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchHeatmap(url);
      setHeatmapData(data);
    } catch (err) {
      setError(err.message || 'Failed to load heatmap clicks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUrl) {
      loadHeatmapData(selectedUrl);
    }
  }, [selectedUrl]);

  // Render HTML5 Canvas Density Heatmap
  useEffect(() => {
    if (!heatmapData || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;

    // Set canvas dimensions to match container scroll bounds
    const width = container.scrollWidth || 1200;
    const height = Math.max(container.scrollHeight || 1400, 1200);

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    if (viewMode === 'points') return; // Only rendering SVG/DOM points in points mode

    const clicks = heatmapData.clicks || [];
    if (clicks.length === 0) return;

    // Step 1: Draw alpha radial gradients (greyscale intensity)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = width;
    shadowCanvas.height = height;
    const sCtx = shadowCanvas.getContext('2d');

    clicks.forEach((c) => {
      if (typeof c.x !== 'number' || typeof c.y !== 'number') return;

      const rad = radius;
      const grad = sCtx.createRadialGradient(c.x, c.y, 0, c.x, c.y, rad);
      grad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      sCtx.fillStyle = grad;
      sCtx.beginPath();
      sCtx.arc(c.x, c.y, rad, 0, Math.PI * 2);
      sCtx.fill();
    });

    // Step 2: Colorize using a thermal color ramp
    // Create a 256x1 gradient palette
    const paletteCanvas = document.createElement('canvas');
    paletteCanvas.width = 256;
    paletteCanvas.height = 1;
    const pCtx = paletteCanvas.getContext('2d');

    const colorGrad = pCtx.createLinearGradient(0, 0, 256, 1);
    colorGrad.addColorStop(0.0, 'rgba(0, 0, 255, 0)');       // Transparent blue
    colorGrad.addColorStop(0.2, 'rgba(0, 160, 255, 0.5)');   // Cyan
    colorGrad.addColorStop(0.45, 'rgba(0, 255, 128, 0.7)');  // Green
    colorGrad.addColorStop(0.7, 'rgba(255, 220, 0, 0.85)');  // Yellow
    colorGrad.addColorStop(0.9, 'rgba(255, 80, 0, 0.95)');   // Orange
    colorGrad.addColorStop(1.0, 'rgba(255, 0, 0, 1.0)');     // Red

    pCtx.fillStyle = colorGrad;
    pCtx.fillRect(0, 0, 256, 1);
    const paletteData = pCtx.getImageData(0, 0, 256, 1).data;

    // Step 3: Map alpha values from shadowCanvas through palette
    const imgData = sCtx.getImageData(0, 0, width, height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha > 0) {
        const palIndex = alpha * 4;
        data[i] = paletteData[palIndex];         // R
        data[i + 1] = paletteData[palIndex + 1]; // G
        data[i + 2] = paletteData[palIndex + 2]; // B
        data[i + 3] = Math.round(alpha * opacity); // A
      }
    }

    ctx.putImageData(imgData, 0, 0);
  }, [heatmapData, viewMode, radius, opacity]);

  const clicks = heatmapData?.clicks || [];
  const totalClicks = heatmapData?.total_clicks ?? 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Controls Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* URL Selector */}
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>Tracked Target URL</span>
              <span className="text-[10px] text-slate-400 font-normal">
                ({pages.length} recorded {pages.length === 1 ? 'page' : 'pages'})
              </span>
            </label>
            <div className="flex gap-2">
              <select
                value={selectedUrl}
                onChange={(e) => setSelectedUrl(e.target.value)}
                className="bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-800 outline-none flex-1"
              >
                {pages.map((p) => (
                  <option key={p.page_url} value={p.page_url}>
                    {p.page_url} ({p.total_clicks} clicks / {p.total_views} views)
                  </option>
                ))}
                {!pages.some((p) => p.page_url === selectedUrl) && selectedUrl && (
                  <option value={selectedUrl}>{selectedUrl}</option>
                )}
              </select>

              <button
                onClick={() => {
                  loadPages();
                  loadHeatmapData(selectedUrl);
                }}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition flex items-center gap-1 text-xs font-semibold shrink-0"
                title="Refresh Heatmap Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Stats Badges */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Clicks</span>
              <span className="text-base font-bold text-slate-900 font-mono">{totalClicks}</span>
            </div>

            {heatmapData?.bounds && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Bounds</span>
                <span className="text-xs font-medium text-slate-700 font-mono">
                  {heatmapData.bounds.minX}-{heatmapData.bounds.maxX}x, {heatmapData.bounds.minY}-{heatmapData.bounds.maxY}y
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Visualization Settings Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('density')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'density'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Density Heatmap
            </button>
            <button
              onClick={() => setViewMode('points')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'points'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Click Markers
            </button>
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                viewMode === 'both'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both Combined
            </button>
          </div>

          {/* Sliders */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Radius:</span>
              <input
                type="range"
                min="14"
                max="60"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-24 accent-indigo-600 cursor-pointer"
              />
              <span className="font-mono text-slate-700 w-8">{radius}px</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Opacity:</span>
              <input
                type="range"
                min="0.2"
                max="1.0"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-24 accent-indigo-600 cursor-pointer"
              />
              <span className="font-mono text-slate-700 w-8">{Math.round(opacity * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadHeatmapData(selectedUrl)} />}

      {/* Heatmap Visualization Canvas Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Heatmap header banner */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-800">
              Interactive Page Representation: Aura Store Layout
            </span>
            <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
              (Document-Relative Coordinates Overlay)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={selectedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold text-[11px]"
            >
              <span>Open Target Page</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            <span>Calculating click density map...</span>
          </div>
        ) : totalClicks === 0 ? (
          <div className="p-12">
            <EmptyState
              title="No Click Events on Selected Page"
              description={`No user clicks have been tracked for "${selectedUrl}" yet. Open the demo page and click anywhere to populate the heatmap.`}
              actionLabel="Launch Demo Page"
              onAction={() => window.open(selectedUrl, '_blank')}
            />
          </div>
        ) : (
          /* Scaled / Scrollable Viewport with overlaid Canvas and markers */
          <div className="overflow-x-auto overflow-y-auto max-h-[850px] bg-slate-100 p-4">
            <div
              ref={containerRef}
              className="relative mx-auto bg-slate-50 rounded-xl shadow-md border border-slate-300 overflow-hidden select-none"
              style={{ width: '1280px', minHeight: '1350px' }}
            >
              {/* Underlying High-Fidelity Aura Store Layout Mock */}
              {/* This matches the exact DOM layout, heights, and positions of demo.html */}
              <div className="pointer-events-none opacity-85 text-slate-800">
                {/* Announcement bar */}
                <div className="bg-indigo-600 text-white text-xs font-medium py-2 px-4 text-center">
                  🎉 Special Launch Sale: Get 20% off all orders with code CAUSAL20
                </div>

                {/* Navbar */}
                <div className="bg-white border-b border-slate-200 h-16 px-8 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                      A
                    </div>
                    <span className="text-xl font-bold text-slate-900">AuraStore</span>
                  </div>
                  <div className="flex items-center gap-8 text-sm font-semibold text-slate-700">
                    <span>Featured</span>
                    <span>Audio</span>
                    <span>Wearables</span>
                    <span>Accessories</span>
                    <span className="text-rose-600">Hot Deals</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-64 bg-slate-100 rounded-lg px-4 py-1.5 text-xs text-slate-400">
                      Search audio, watches...
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                      ❤️
                    </div>
                    <div className="w-20 bg-indigo-50 text-indigo-700 rounded-lg px-3 py-1.5 text-xs font-bold flex items-center justify-center">
                      🛒 Cart (0)
                    </div>
                  </div>
                </div>

                {/* Hero Section */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white py-16 px-8 grid grid-cols-2 gap-12 items-center">
                  <div className="space-y-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                      ✨ Next-Generation Sound
                    </span>
                    <h1 className="text-5xl font-extrabold leading-tight">
                      Spatial Clarity, <br />
                      <span className="text-sky-300">Pure Immersion.</span>
                    </h1>
                    <p className="text-indigo-100 text-sm max-w-lg">
                      Engineered with bespoke acoustic drivers and active noise cancellation.
                    </p>
                    <div className="flex gap-4 pt-2">
                      <div className="bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl shadow-lg">
                        Shop New Arrivals &rarr;
                      </div>
                      <div className="bg-white/10 text-white font-semibold px-6 py-3 rounded-xl border border-white/20">
                        Explore Features
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-80 h-80 rounded-3xl bg-indigo-500/20 border border-white/20 p-6 flex flex-col justify-between text-center">
                      <div className="text-xs uppercase font-bold text-indigo-300">Featured Flagship</div>
                      <div className="text-6xl text-white my-auto">🎧</div>
                      <div className="text-xl font-bold">Aura Pro Wireless ($299.00)</div>
                      <div className="bg-white text-slate-900 font-bold py-2 rounded-lg text-xs mt-2">
                        Quick Buy
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Pills */}
                <div className="px-8 pt-10 pb-4 flex items-center justify-between border-b border-slate-200">
                  <div className="flex gap-2">
                    <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold">All Products</span>
                    <span className="bg-white text-slate-600 border border-slate-200 px-4 py-1.5 rounded-full text-xs">Audio</span>
                    <span className="bg-white text-slate-600 border border-slate-200 px-4 py-1.5 rounded-full text-xs">Wearables</span>
                    <span className="bg-white text-slate-600 border border-slate-200 px-4 py-1.5 rounded-full text-xs">Accessories</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Showing 6 items</span>
                </div>

                {/* Products Grid */}
                <div className="px-8 py-6 grid grid-cols-3 gap-8">
                  {/* Card 1 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="bg-slate-100 rounded-xl h-44 flex items-center justify-center text-5xl">
                      🎧
                    </div>
                    <h3 className="font-bold text-sm">Aura Pro Noise Cancelling Headphones</h3>
                    <p className="text-slate-500 text-xs">40-hour battery life with memory foam.</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-base">$299.00</span>
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                        Add to Cart
                      </span>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="bg-slate-100 rounded-xl h-44 flex items-center justify-center text-5xl">
                      ⌚
                    </div>
                    <h3 className="font-bold text-sm">Aura Chrono Smartwatch Series 5</h3>
                    <p className="text-slate-500 text-xs">ECG monitoring & AMOLED display.</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-base">$349.00</span>
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                        Add to Cart
                      </span>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="bg-slate-100 rounded-xl h-44 flex items-center justify-center text-5xl">
                      🔊
                    </div>
                    <h3 className="font-bold text-sm">Aura SoundCore Hi-Res Bluetooth Speaker</h3>
                    <p className="text-slate-500 text-xs">360-degree room filling audio.</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-base">$179.00</span>
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                        Add to Cart
                      </span>
                    </div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="bg-slate-100 rounded-xl h-44 flex items-center justify-center text-5xl">
                      ⚡
                    </div>
                    <h3 className="font-bold text-sm">MagCharge 3-in-1 Fast Wireless Stand</h3>
                    <p className="text-slate-500 text-xs">Simultaneously charge 3 devices.</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-base">$89.00</span>
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                        Add to Cart
                      </span>
                    </div>
                  </div>

                  {/* Card 5 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="bg-slate-100 rounded-xl h-44 flex items-center justify-center text-5xl">
                      ⌨️
                    </div>
                    <h3 className="font-bold text-sm">Aura Flow Mechanical Wireless Keyboard</h3>
                    <p className="text-slate-500 text-xs">Hot-swappable tactile switches.</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-base">$149.00</span>
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                        Add to Cart
                      </span>
                    </div>
                  </div>

                  {/* Card 6 */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                    <div className="bg-slate-100 rounded-xl h-44 flex items-center justify-center text-5xl">
                      🛡️
                    </div>
                    <h3 className="font-bold text-sm">Aura Shield Kevlar Sleeve & Organizer</h3>
                    <p className="text-slate-500 text-xs">Water-repellent protective carrying sleeve.</p>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="font-bold text-base">$59.00</span>
                      <span className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl">
                        Add to Cart
                      </span>
                    </div>
                  </div>
                </div>

                {/* Newsletter Box */}
                <div className="bg-indigo-50 border-t border-b border-indigo-100 py-10 px-8 text-center mt-6">
                  <h3 className="text-lg font-bold text-slate-900">Get early access to future drops</h3>
                  <div className="mt-3 flex justify-center gap-2 max-w-sm mx-auto">
                    <div className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs text-slate-400 flex-1">
                      Enter email address...
                    </div>
                    <div className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-lg text-xs">
                      Subscribe
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-white py-6 text-center text-xs text-slate-400">
                  © 2026 AuraStore Demo Layout
                </div>
              </div>

              {/* Canvas Overlay for Density Heatmap */}
              <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none z-10"
                style={{ display: viewMode === 'points' ? 'none' : 'block' }}
              />

              {/* Interactive Click Points Overlay */}
              {(viewMode === 'points' || viewMode === 'both') && (
                <div className="absolute inset-0 z-20 pointer-events-auto">
                  {clicks.map((c, idx) => {
                    if (typeof c.x !== 'number' || typeof c.y !== 'number') return null;

                    return (
                      <div
                        key={idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        style={{ left: `${c.x}px`, top: `${c.y}px` }}
                        onMouseEnter={() => setHoveredPoint(c)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Outer pulse */}
                        <div className="w-5 h-5 rounded-full bg-rose-500/30 animate-ping absolute inset-0"></div>
                        {/* Core marker */}
                        <div className="w-4 h-4 rounded-full bg-rose-600 ring-2 ring-white shadow-md flex items-center justify-center text-[9px] text-white font-bold">
                          •
                        </div>

                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-slate-900/95 text-white text-[11px] font-mono px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap pointer-events-none z-30">
                          <div>
                            Coordinates: <span className="text-amber-400 font-bold">({c.x}, {c.y})</span>
                          </div>
                          {c.session_id && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[200px]">
                              {c.session_id}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400">
                            {formatDate(c.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Floating Hover Indicator Banner */}
      {hoveredPoint && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-700 font-mono text-xs flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="font-bold text-slate-200">Active Hotspot:</span>
          </div>
          <div>
            x: <span className="text-amber-400 font-bold">{hoveredPoint.x}px</span>, y:{' '}
            <span className="text-amber-400 font-bold">{hoveredPoint.y}px</span>
          </div>
          {hoveredPoint.session_id && (
            <div className="text-slate-400 text-[11px]">
              Session: {hoveredPoint.session_id.substring(0, 14)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
