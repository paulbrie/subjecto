/**
 * Visual debugging utility for Subject instances
 * Provides a real-time UI for inspecting and interacting with Subjects
 */

import { Subject } from './subject'

interface DebugOptions {
    /**
     * Maximum number of history entries to keep
     * @default 50
     */
    maxHistory?: number
    /**
     * Enable dark mode
     * @default false
     */
    darkMode?: boolean
    /**
     * Title for the debug panel
     * @default Subject name or "Subject Debug"
     */
    title?: string
    /**
     * Enable value editor
     * @default true
     */
    editable?: boolean
    /**
     * Enable collapsible sections
     * @default true
     */
    collapsible?: boolean
}

interface HistoryEntry {
    timestamp: Date
    value: unknown
    count: number
}

/**
 * Creates a visual debugging UI for a Subject instance
 *
 * @param subject - The Subject instance to debug
 * @param container - DOM element to render the debug UI into
 * @param options - Configuration options
 * @returns Cleanup function to remove the debug UI
 *
 * @example
 * ```typescript
 * import { Subject } from 'subjecto'
 * import { debugSubject } from 'subjecto/debug'
 *
 * const counter = new Subject(0, { name: 'counter' })
 * const cleanup = debugSubject(counter, document.getElementById('debug'))
 *
 * // Later: cleanup()
 * ```
 */
export function debugSubject<T>(
    subject: Subject<T>,
    container: HTMLElement,
    options: DebugOptions = {}
): () => void {
    const {
        maxHistory = 50,
        darkMode = false,
        title = subject.options.name || 'Subject Debug',
        collapsible = true,
    } = options

    const history: HistoryEntry[] = []
    let isPaused = false
    let viewMode: 'list' | 'graph' = 'graph' // Default to graph view
    let timeWindow: 30 | 60 | 180 = 30 // seconds
    let graphDataPoints: Array<{ screenX: number; screenY: number; value: number; entry: HistoryEntry }> = []

    // Create UI structure
    const wrapper = document.createElement('div')
    wrapper.className = `subjecto-debug ${darkMode ? 'dark' : 'light'}`
    wrapper.innerHTML = `
        <div class="debug-header">
            <h3 class="debug-title">${title} <span class="debug-type"></span></h3>
            <div class="debug-actions">
                <button class="btn btn-sm" data-action="pause">⏸ Pause</button>
                <button class="btn btn-sm" data-action="clear">🗑 Clear</button>
                <button class="btn btn-sm" data-action="copy">📋 Copy</button>
            </div>
        </div>

        <div class="debug-section">
            <div class="section-header ${collapsible ? 'collapsible' : ''}" data-section="history">
                <span class="section-title">📜 History</span>
                <span class="history-count badge">0</span>
                <button class="btn btn-sm view-toggle" data-action="toggle-view">📋 List</button>
                <span class="collapse-icon">▼</span>
            </div>
            <div class="section-content" data-section="history">
                <div class="graph-controls" style="display: none;">
                    <span class="graph-label">Time window:</span>
                    <button class="btn btn-sm time-window-btn active" data-window="30">30s</button>
                    <button class="btn btn-sm time-window-btn" data-window="60">60s</button>
                    <button class="btn btn-sm time-window-btn" data-window="180">3m</button>
                </div>
                <div class="graph-container" style="position: relative;">
                    <canvas class="history-graph" width="600" height="200" style="display: none;"></canvas>
                    <div class="graph-tooltip" style="display: none;"></div>
                </div>
                <div class="history-list"></div>
            </div>
        </div>

        <div class="debug-section">
            <div class="section-header ${collapsible ? 'collapsible' : ''}" data-section="subscribers">
                <span class="section-title">👥 Subscribers</span>
                <span class="collapse-icon">▼</span>
            </div>
            <div class="section-content" data-section="subscribers">
                <div class="subscribers-list"></div>
            </div>
        </div>
    `

    // Inject styles
    injectStyles()

    // Add to container
    container.appendChild(wrapper)

    // Get DOM references
    const debugTypeEl = wrapper.querySelector('.debug-type') as HTMLElement
    const historyListEl = wrapper.querySelector('.history-list') as HTMLElement
    const historyGraphEl = wrapper.querySelector('.history-graph') as HTMLCanvasElement
    const graphControlsEl = wrapper.querySelector('.graph-controls') as HTMLElement
    const historyCountEl = wrapper.querySelector('.history-count') as HTMLElement
    const subscribersListEl = wrapper.querySelector('.subscribers-list') as HTMLElement
    const pauseBtn = wrapper.querySelector('[data-action="pause"]') as HTMLButtonElement
    const viewToggleBtn = wrapper.querySelector('[data-action="toggle-view"]') as HTMLButtonElement
    const tooltipEl = wrapper.querySelector('.graph-tooltip') as HTMLElement

    // Update UI function
    function updateUI() {
        if (isPaused) return

        const value = subject.getValue()
        const valueType = getValueType(value)

        // Update type in header
        debugTypeEl.textContent = `(${valueType})`

        // Update subscribers list
        updateSubscribersList()
    }

    // Add to history
    function addToHistory() {
        if (isPaused) return

        const entry: HistoryEntry = {
            timestamp: new Date(),
            value: subject.getValue(),
            count: subject.count,
        }

        history.unshift(entry)
        if (history.length > maxHistory) {
            history.pop()
        }

        updateHistoryUI()
    }

    // Update history UI
    function updateHistoryUI() {
        historyCountEl.textContent = history.length.toString()

        if (viewMode === 'graph') {
            historyListEl.style.display = 'none'
            historyGraphEl.style.display = 'block'
            graphControlsEl.style.display = 'flex'
            drawGraph()
        } else {
            historyListEl.style.display = 'block'
            historyGraphEl.style.display = 'none'
            graphControlsEl.style.display = 'none'
            historyListEl.innerHTML = history
                .map(
                    (entry, index) => `
                <div class="history-item ${index === 0 ? 'latest' : ''}">
                    <div class="history-header">
                        <span class="history-time">${formatTime(entry.timestamp)}</span>
                        <span class="history-count badge">#${entry.count}</span>
                    </div>
                    <code class="history-value">${formatValue(entry.value)}</code>
                </div>
            `
                )
                .join('')
        }
    }

    // Draw history graph
    function drawGraph() {
        if (!historyGraphEl || history.length === 0) return

        const ctx = historyGraphEl.getContext('2d')
        if (!ctx) return

        // Clear stored data points for hit detection
        graphDataPoints = []

        // Get colors based on theme
        const isDark = darkMode
        const bgColor = isDark ? '#0d1117' : '#ffffff'
        const gridColor = isDark ? '#30363d' : '#e1e4e8'
        const textColor = isDark ? '#c9d1d9' : '#24292e'
        const lineColor = isDark ? '#58a6ff' : '#0969da'
        const pointColor = isDark ? '#1f6feb' : '#0969da'
        const latestPointColor = isDark ? '#2ea043' : '#2ea44f'

        // Set canvas size to match container
        const canvas = historyGraphEl
        const rect = canvas.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        canvas.width = rect.width * dpr
        canvas.height = rect.height * dpr
        ctx.scale(dpr, dpr)

        const width = rect.width
        const height = rect.height
        const padding = { top: 20, right: 20, bottom: 30, left: 50 }
        const graphWidth = width - padding.left - padding.right
        const graphHeight = height - padding.top - padding.bottom

        // Clear canvas
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, width, height)

        // Filter history by time window
        const now = Date.now()
        const windowMs = timeWindow * 1000
        const filteredHistory = history.filter(entry =>
            now - entry.timestamp.getTime() <= windowMs
        )

        if (filteredHistory.length === 0) {
            ctx.fillStyle = textColor
            ctx.font = '14px -apple-system, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText(`No data in last ${timeWindow}s`, width / 2, height / 2)
            return
        }

        // Extract numeric values or count changes
        const dataPoints: Array<{ x: number; y: number; entry: HistoryEntry }> = []

        for (let i = filteredHistory.length - 1; i >= 0; i--) {
            const entry = filteredHistory[i]
            let numValue: number | null = null

            if (typeof entry.value === 'number') {
                numValue = entry.value
            } else if (typeof entry.value === 'boolean') {
                numValue = entry.value ? 1 : 0
            } else if (Array.isArray(entry.value)) {
                numValue = entry.value.length
            } else if (typeof entry.value === 'object' && entry.value !== null) {
                numValue = Object.keys(entry.value).length
            }

            if (numValue !== null) {
                dataPoints.push({
                    x: entry.timestamp.getTime(),
                    y: numValue,
                    entry
                })
            }
        }

        if (dataPoints.length === 0) {
            ctx.fillStyle = textColor
            ctx.font = '14px -apple-system, sans-serif'
            ctx.textAlign = 'center'
            ctx.fillText('No numeric data to display', width / 2, height / 2)
            return
        }

        // Calculate scales
        const xMin = Math.min(...dataPoints.map(p => p.x))
        const xMax = Math.max(...dataPoints.map(p => p.x))
        const yMin = Math.min(...dataPoints.map(p => p.y))
        const yMax = Math.max(...dataPoints.map(p => p.y))
        const yRange = yMax - yMin || 1
        const yPadding = yRange * 0.1

        const xScale = (x: number) => padding.left + ((x - xMin) / (xMax - xMin || 1)) * graphWidth
        const yScale = (y: number) => padding.top + graphHeight - ((y - yMin + yPadding) / (yRange + 2 * yPadding)) * graphHeight

        // Draw grid lines
        ctx.strokeStyle = gridColor
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])

        // Horizontal grid lines (5 lines)
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (graphHeight / 4) * i
            ctx.beginPath()
            ctx.moveTo(padding.left, y)
            ctx.lineTo(width - padding.right, y)
            ctx.stroke()

            // Y-axis labels
            const value = yMax - (yRange / 4) * i
            ctx.fillStyle = textColor
            ctx.font = '11px -apple-system, monospace'
            ctx.textAlign = 'right'
            ctx.fillText(value.toFixed(2), padding.left - 5, y + 4)
        }

        // Vertical grid lines (time ticks)
        const numTicks = 6
        const timeRange = (xMax - xMin) / 1000 // in seconds
        const tickInterval = Math.ceil(timeRange / (numTicks - 1))

        for (let i = 0; i < numTicks; i++) {
            const secondsAgo = timeRange - (i * tickInterval)
            const timestamp = now - (secondsAgo * 1000)

            // Only draw if within data range
            if (timestamp >= xMin && timestamp <= xMax) {
                const x = xScale(timestamp)

                ctx.strokeStyle = gridColor
                ctx.beginPath()
                ctx.moveTo(x, padding.top)
                ctx.lineTo(x, height - padding.bottom)
                ctx.stroke()

                // X-axis labels (time ticks)
                ctx.fillStyle = textColor
                ctx.font = '10px -apple-system, monospace'
                ctx.textAlign = 'center'
                const label = secondsAgo > 0 ? `-${Math.round(secondsAgo)}s` : 'now'
                ctx.fillText(label, x, height - padding.bottom + 15)
            }
        }

        ctx.setLineDash([])

        // Draw line
        ctx.strokeStyle = lineColor
        ctx.lineWidth = 2
        ctx.beginPath()
        dataPoints.forEach((point, i) => {
            const x = xScale(point.x)
            const y = yScale(point.y)
            if (i === 0) {
                ctx.moveTo(x, y)
            } else {
                ctx.lineTo(x, y)
            }
        })
        ctx.stroke()

        // Draw points
        dataPoints.forEach((point, i) => {
            const x = xScale(point.x)
            const y = yScale(point.y)
            const isLatest = i === dataPoints.length - 1

            // Store screen coordinates for hit detection
            graphDataPoints.push({
                screenX: x,
                screenY: y,
                value: point.y,
                entry: point.entry
            })

            ctx.fillStyle = isLatest ? latestPointColor : pointColor
            ctx.beginPath()
            ctx.arc(x, y, isLatest ? 5 : 3, 0, Math.PI * 2)
            ctx.fill()

            // Draw value label for latest point
            if (isLatest) {
                ctx.fillStyle = textColor
                ctx.font = 'bold 12px -apple-system, monospace'
                ctx.textAlign = 'left'
                ctx.fillText(point.y.toString(), x + 8, y + 4)
            }
        })

        // Draw axes
        ctx.strokeStyle = textColor
        ctx.lineWidth = 1
        // Y-axis
        ctx.beginPath()
        ctx.moveTo(padding.left, padding.top)
        ctx.lineTo(padding.left, height - padding.bottom)
        ctx.stroke()
        // X-axis
        ctx.beginPath()
        ctx.moveTo(padding.left, height - padding.bottom)
        ctx.lineTo(width - padding.right, height - padding.bottom)
        ctx.stroke()
    }

    // Update subscribers list
    function updateSubscribersList() {
        const subscribers = Array.from(subject.subscribers.entries())

        if (subscribers.length === 0) {
            subscribersListEl.innerHTML = '<div class="empty-state">No active subscribers</div>'
            return
        }

        subscribersListEl.innerHTML = subscribers
            .map(
                ([id], index) => `
            <div class="subscriber-item">
                <span class="subscriber-id">Subscriber #${index + 1}</span>
                <code class="subscriber-symbol">${id.toString()}</code>
            </div>
        `
            )
            .join('')
    }

    // Event handlers
    function handlePause() {
        isPaused = !isPaused
        pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸ Pause'
        pauseBtn.classList.toggle('active', isPaused)
    }

    function handleClear() {
        history.length = 0
        updateHistoryUI()
    }

    function handleToggleView() {
        viewMode = viewMode === 'list' ? 'graph' : 'list'
        viewToggleBtn.textContent = viewMode === 'list' ? '📊 Graph' : '📋 List'
        updateHistoryUI()
    }

    function handleCopy() {
        const value = subject.getValue()
        const text = JSON.stringify(value, null, 2)
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Copied to clipboard!')
        })
    }

    function handleCollapse(sectionName: string) {
        const content = wrapper.querySelector(
            `.section-content[data-section="${sectionName}"]`
        ) as HTMLElement
        const header = wrapper.querySelector(
            `.section-header[data-section="${sectionName}"]`
        ) as HTMLElement
        const icon = header.querySelector('.collapse-icon') as HTMLElement

        if (content.style.display === 'none') {
            content.style.display = 'block'
            icon.textContent = '▼'
        } else {
            content.style.display = 'none'
            icon.textContent = '▶'
        }
    }

    function handleTimeWindowChange(window: 30 | 60 | 180) {
        timeWindow = window

        // Update button states
        wrapper.querySelectorAll('.time-window-btn').forEach(btn => {
            btn.classList.remove('active')
        })
        wrapper.querySelector(`[data-window="${window}"]`)?.classList.add('active')

        // Redraw graph immediately
        if (viewMode === 'graph') {
            drawGraph()
        }
    }

    // Show notification
    function showNotification(message: string, type: 'success' | 'error' = 'success') {
        const notification = document.createElement('div')
        notification.className = `debug-notification ${type}`
        notification.textContent = message
        wrapper.appendChild(notification)

        setTimeout(() => {
            notification.classList.add('fade-out')
            setTimeout(() => notification.remove(), 300)
        }, 2000)
    }

    // Attach event listeners
    wrapper.querySelector('[data-action="pause"]')?.addEventListener('click', handlePause)
    wrapper.querySelector('[data-action="clear"]')?.addEventListener('click', handleClear)
    wrapper.querySelector('[data-action="copy"]')?.addEventListener('click', handleCopy)
    wrapper.querySelector('[data-action="toggle-view"]')?.addEventListener('click', (e) => {
        e.stopPropagation()
        handleToggleView()
    })

    // Collapsible sections
    if (collapsible) {
        wrapper.querySelectorAll('.section-header.collapsible').forEach((header) => {
            header.addEventListener('click', (e) => {
                // Don't collapse if clicking on a button inside the header
                if ((e.target as HTMLElement).closest('button')) return

                const section = header.getAttribute('data-section')
                if (section) handleCollapse(section)
            })
        })
    }

    // Time window buttons
    wrapper.querySelectorAll('.time-window-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation()
            const window = parseInt((btn as HTMLElement).getAttribute('data-window') || '30') as 30 | 60 | 180
            handleTimeWindowChange(window)
        })
    })

    // Canvas hover tooltip
    historyGraphEl.addEventListener('mousemove', (e) => {
        if (viewMode !== 'graph' || graphDataPoints.length === 0) return

        const rect = historyGraphEl.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        // Find closest point within threshold
        const threshold = 10
        let closestPoint: typeof graphDataPoints[0] | null = null
        let minDistance = threshold

        for (const point of graphDataPoints) {
            const distance = Math.sqrt(
                Math.pow(point.screenX - mouseX, 2) +
                Math.pow(point.screenY - mouseY, 2)
            )
            if (distance < minDistance) {
                minDistance = distance
                closestPoint = point
            }
        }

        if (closestPoint) {
            // Show tooltip
            tooltipEl.style.display = 'block'
            tooltipEl.style.left = `${e.clientX - rect.left + 10}px`
            tooltipEl.style.top = `${e.clientY - rect.top - 30}px`
            tooltipEl.innerHTML = `
                <div class="tooltip-time">${formatTime(closestPoint.entry.timestamp)}</div>
                <div class="tooltip-value">Value: ${formatValue(closestPoint.entry.value)}</div>
                <div class="tooltip-count">#${closestPoint.entry.count}</div>
            `
            historyGraphEl.style.cursor = 'pointer'
        } else {
            tooltipEl.style.display = 'none'
            historyGraphEl.style.cursor = 'default'
        }
    })

    historyGraphEl.addEventListener('mouseout', () => {
        tooltipEl.style.display = 'none'
        historyGraphEl.style.cursor = 'default'
    })

    // Subscribe to subject changes
    const subscription = subject.subscribe(() => {
        updateUI()
        addToHistory()
    })

    // Initial render
    updateUI()
    addToHistory()

    // Cleanup function
    return () => {
        subscription.unsubscribe()
        wrapper.remove()
    }
}

// Helper functions
function formatValue(value: unknown): string {
    if (value === null) return 'null'
    if (value === undefined) return 'undefined'
    if (typeof value === 'string') return `"${value}"`
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2)
        } catch {
            return '[Circular]'
        }
    }
    return String(value)
}

function getValueType(value: unknown): string {
    if (value === null) return 'null'
    if (Array.isArray(value)) return 'array'
    return typeof value
}

function formatTime(date: Date): string {
    const time = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    })
    const ms = date.getMilliseconds().toString().padStart(3, '0')
    return `${time}.${ms}`
}

function injectStyles() {
    const styleId = 'subjecto-debug-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
        .subjecto-debug {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            border: 1px solid #e1e4e8;
            border-radius: 8px;
            padding: 16px;
            max-width: 100%;
            font-size: 14px;
            position: relative;
        }

        .subjecto-debug.light {
            background: #ffffff;
            color: #24292e;
        }

        .subjecto-debug.dark {
            background: #0d1117;
            color: #c9d1d9;
            border-color: #30363d;
        }

        .debug-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e1e4e8;
        }

        .dark .debug-header {
            border-bottom-color: #30363d;
        }

        .debug-title {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        }

        .debug-type {
            font-weight: 400;
            opacity: 0.6;
            font-size: 16px;
        }

        .debug-actions {
            display: flex;
            gap: 8px;
        }

        .btn {
            padding: 6px 12px;
            border: 1px solid #d1d5da;
            border-radius: 6px;
            background: #f6f8fa;
            color: #24292e;
            cursor: pointer;
            font-size: 12px;
            font-weight: 500;
            transition: all 0.2s;
        }

        .dark .btn {
            background: #21262d;
            color: #c9d1d9;
            border-color: #30363d;
        }

        .btn:hover {
            background: #e1e4e8;
        }

        .dark .btn:hover {
            background: #30363d;
        }

        .btn.active {
            background: #0969da;
            color: white;
            border-color: #0969da;
        }

        .btn-primary {
            background: #2ea44f;
            color: white;
            border-color: #2ea44f;
        }

        .btn-primary:hover {
            background: #2c974b;
        }

        .btn-sm {
            padding: 4px 8px;
            font-size: 11px;
        }

        .debug-section {
            margin-bottom: 16px;
        }

        .section-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f6f8fa;
            border-radius: 6px;
            font-weight: 600;
            margin-bottom: 8px;
        }

        .dark .section-header {
            background: #161b22;
        }

        .section-header.collapsible {
            cursor: pointer;
            user-select: none;
        }

        .section-header.collapsible:hover {
            background: #e1e4e8;
        }

        .dark .section-header.collapsible:hover {
            background: #21262d;
        }

        .section-title {
            flex: 1;
        }

        .collapse-icon {
            font-size: 10px;
            opacity: 0.6;
        }

        .section-content {
            padding: 8px;
        }

        .stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-bottom: 12px;
        }

        .stat {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .stat-label {
            font-size: 11px;
            text-transform: uppercase;
            opacity: 0.7;
            font-weight: 600;
        }

        .stat-value {
            font-size: 13px;
        }

        code {
            background: #f6f8fa;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
            font-size: 12px;
        }

        .dark code {
            background: #161b22;
        }

        .current-value {
            display: block;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 200px;
            overflow-y: auto;
            padding: 8px;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            background: #0969da;
            color: white;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }

        .history-list {
            max-height: 300px;
            overflow-y: auto;
        }

        .history-graph {
            width: 100%;
            height: 200px;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
        }

        .dark .history-graph {
            border-color: #30363d;
        }

        .graph-container {
            position: relative;
        }

        .graph-tooltip {
            position: absolute;
            background: #24292e;
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 11px;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
            white-space: nowrap;
        }

        .dark .graph-tooltip {
            background: #c9d1d9;
            color: #0d1117;
            box-shadow: 0 2px 8px rgba(255, 255, 255, 0.15);
        }

        .tooltip-time {
            font-family: 'SF Mono', Monaco, monospace;
            opacity: 0.8;
            font-size: 10px;
            margin-bottom: 4px;
        }

        .tooltip-value {
            font-weight: 600;
            margin-bottom: 2px;
            max-width: 300px;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .tooltip-count {
            font-size: 10px;
            opacity: 0.7;
        }

        .view-toggle {
            margin-left: auto;
            margin-right: 8px;
        }

        .graph-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: #f6f8fa;
            border-radius: 6px;
            margin-bottom: 12px;
        }

        .dark .graph-controls {
            background: #161b22;
        }

        .graph-label {
            font-size: 12px;
            font-weight: 600;
            color: #57606a;
        }

        .dark .graph-label {
            color: #8b949e;
        }

        .time-window-btn {
            padding: 4px 10px;
            font-size: 11px;
            min-width: 40px;
        }

        .time-window-btn.active {
            background: #0969da;
            color: white;
            border-color: #0969da;
        }

        .dark .time-window-btn.active {
            background: #58a6ff;
            border-color: #58a6ff;
        }

        .history-item {
            padding: 8px;
            margin-bottom: 8px;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .dark .history-item {
            border-color: #30363d;
        }

        .history-item.latest {
            border-color: #2ea44f;
            border-width: 2px;
        }

        .history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;
            font-size: 11px;
        }

        .history-time {
            opacity: 0.7;
            font-family: 'SF Mono', Monaco, monospace;
        }

        .history-value {
            display: block;
            font-size: 11px;
            white-space: pre-wrap;
            word-break: break-all;
        }

        .history-count {
            background: #6e7781;
        }

        .subscriber-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px;
            margin-bottom: 4px;
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            font-size: 12px;
        }

        .dark .subscriber-item {
            border-color: #30363d;
        }

        .subscriber-id {
            font-weight: 600;
        }

        .subscriber-symbol {
            opacity: 0.6;
            font-size: 10px;
        }

        .empty-state {
            text-align: center;
            padding: 24px;
            opacity: 0.5;
            font-style: italic;
        }

        .debug-notification {
            position: absolute;
            top: 16px;
            right: 16px;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        }

        .debug-notification.success {
            background: #2ea44f;
            color: white;
        }

        .debug-notification.error {
            background: #cf222e;
            color: white;
        }

        .debug-notification.fade-out {
            animation: fadeOut 0.3s ease;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        /* Scrollbar styles */
        .subjecto-debug ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        .subjecto-debug ::-webkit-scrollbar-track {
            background: transparent;
        }

        .subjecto-debug ::-webkit-scrollbar-thumb {
            background: #d1d5da;
            border-radius: 4px;
        }

        .dark .subjecto-debug ::-webkit-scrollbar-thumb {
            background: #30363d;
        }

        .subjecto-debug ::-webkit-scrollbar-thumb:hover {
            background: #959da5;
        }
    `

    document.head.appendChild(style)
}
