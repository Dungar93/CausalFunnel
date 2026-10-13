import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SessionsPage from '../pages/SessionsPage';
import HeatmapPage from '../pages/HeatmapPage';
import UserJourneyDrawer from '../components/UserJourneyDrawer';
import * as api from '../services/api';

vi.mock('../services/api');

describe('SessionsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading skeleton initially and then renders sessions and metrics', async () => {
    api.fetchSessions.mockResolvedValueOnce({
      sessions: [
        {
          session_id: 'sess_test_101',
          total_events: 5,
          page_views: 2,
          clicks: 3,
          first_activity: '2026-10-14T00:00:00Z',
          last_activity: '2026-10-14T00:05:00Z',
        },
      ],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1, hasNext: false, hasPrev: false },
    });

    api.fetchStatsSummary.mockResolvedValueOnce({
      stats: {
        total_sessions: 1,
        total_events: 5,
        total_page_views: 2,
        total_clicks: 3,
      },
    });

    render(
      <BrowserRouter>
        <SessionsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Total Sessions/i)).toBeInTheDocument();
      expect(screen.getByText('sess_test_101')).toBeInTheDocument();
      expect(screen.getByText('View Journey')).toBeInTheDocument();
    });
  });

  it('renders an empty state when no sessions are recorded', async () => {
    api.fetchSessions.mockResolvedValueOnce({
      sessions: [],
      pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    });

    api.fetchStatsSummary.mockResolvedValueOnce({
      stats: { total_sessions: 0, total_events: 0, total_page_views: 0, total_clicks: 0 },
    });

    render(
      <BrowserRouter>
        <SessionsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Sessions Recorded Yet/i)).toBeInTheDocument();
    });
  });

  it('renders error alert when API call fails', async () => {
    api.fetchSessions.mockRejectedValueOnce(new Error('Network error: server unreachable'));
    api.fetchStatsSummary.mockResolvedValueOnce({ stats: null });

    render(
      <BrowserRouter>
        <SessionsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error Loading Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Network error: server unreachable/i)).toBeInTheDocument();
    });
  });
});

describe('UserJourneyDrawer Component', () => {
  it('renders chronological event list with click coordinates and page views', async () => {
    const mockSession = {
      session_id: 'sess_journey_1',
      total_events: 2,
      page_views: 1,
      clicks: 1,
      first_activity: '2026-10-14T00:00:00Z',
      last_activity: '2026-10-14T00:02:00Z',
    };

    api.fetchSessionEvents.mockResolvedValueOnce({
      events: [
        {
          event_type: 'page_view',
          page_url: 'http://localhost:5000/tracker/demo.html',
          timestamp: '2026-10-14T00:00:00Z',
          viewport: { width: 1440, height: 900 },
        },
        {
          event_type: 'click',
          page_url: 'http://localhost:5000/tracker/demo.html',
          timestamp: '2026-10-14T00:02:00Z',
          coordinates: { x: 450, y: 320 },
          viewport: { width: 1440, height: 900 },
        },
      ],
    });

    render(<UserJourneyDrawer session={mockSession} onClose={() => {}} />);

    expect(screen.getByText('sess_journey_1')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Page View')).toBeInTheDocument();
      expect(screen.getByText('Click Event')).toBeInTheDocument();
      expect(screen.getByText('450 px')).toBeInTheDocument();
      expect(screen.getByText('320 px')).toBeInTheDocument();
    });
  });
});

describe('HeatmapPage Component', () => {
  it('loads tracked pages and displays click count and markers', async () => {
    api.fetchTrackedPages.mockResolvedValueOnce({
      pages: [
        {
          page_url: 'http://localhost:5000/tracker/demo.html',
          total_clicks: 2,
          total_views: 1,
        },
      ],
    });

    api.fetchHeatmap.mockResolvedValueOnce({
      page_url: 'http://localhost:5000/tracker/demo.html',
      total_clicks: 2,
      clicks: [
        { x: 300, y: 500, timestamp: '2026-10-14T00:01:00Z', session_id: 's1' },
        { x: 400, y: 600, timestamp: '2026-10-14T00:02:00Z', session_id: 's2' },
      ],
      bounds: { minX: 300, maxX: 400, minY: 500, maxY: 600 },
    });

    render(
      <BrowserRouter>
        <HeatmapPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Tracked Target URL/i)).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // total clicks
    });
  });

  it('renders empty state when page has 0 clicks', async () => {
    api.fetchTrackedPages.mockResolvedValueOnce({
      pages: [{ page_url: 'http://example.com/noclicks', total_clicks: 0, total_views: 1 }],
    });

    api.fetchHeatmap.mockResolvedValueOnce({
      page_url: 'http://example.com/noclicks',
      total_clicks: 0,
      clicks: [],
      bounds: null,
    });

    render(
      <BrowserRouter>
        <HeatmapPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No Click Events on Selected Page/i)).toBeInTheDocument();
    });
  });
});
