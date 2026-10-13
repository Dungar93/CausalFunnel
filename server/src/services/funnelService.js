import Event from '../models/Event.js';

/**
 * Computes multi-stage e-commerce conversion funnel metrics
 * tailored for CausalFunnel behavior analysis.
 */
export async function getFunnelMetrics() {
  // Aggregate sessions with their event types and coordinate hotspots
  const sessionJourneys = await Event.aggregate([
    {
      $group: {
        _id: '$session_id',
        events: {
          $push: {
            event_type: '$event_type',
            page_url: '$page_url',
            coordinates: '$coordinates',
          },
        },
        total_events: { $sum: 1 },
      },
    },
  ]);

  const totalVisitors = sessionJourneys.length;

  // Classify each session into funnel steps
  let stage1Visitors = totalVisitors;
  let stage2ProductExploration = 0;
  let stage3CartIntent = 0;
  let stage4CheckoutReview = 0;

  sessionJourneys.forEach((session) => {
    const events = session.events;

    // Stage 2: Engaged Browsing (more than 1 event or interacted with catalog/products)
    const hasEngaged = events.length >= 2;
    if (hasEngaged) stage2ProductExploration++;

    // Stage 3: Cart Intent (clicked Add to Cart - coordinate clusters around product CTA buttons: y between 550 and 700)
    const hasCartClick = events.some((e) => {
      if (e.event_type !== 'click' || !e.coordinates) return false;
      const { x, y } = e.coordinates;
      // Product Add-to-cart coordinate zones or cart header
      const isProductAddCart = y >= 550 && y <= 700;
      const isHeroQuickBuy = y >= 320 && y <= 400 && x >= 650;
      return isProductAddCart || isHeroQuickBuy;
    });

    if (hasCartClick) stage3CartIntent++;

    // Stage 4: High Intent / Cart or Checkout Review (clicked cart icon at top right x >= 1200 or multiple add to carts)
    const hasCheckoutOrCartReview = events.some((e) => {
      if (e.event_type !== 'click' || !e.coordinates) return false;
      const { x, y } = e.coordinates;
      return x >= 1200 && y <= 80;
    });

    if (hasCartClick && hasCheckoutOrCartReview) stage4CheckoutReview++;
  });

  const stages = [
    {
      id: 'visitors',
      name: '1. Store Visitors',
      description: 'Landed on Aura Store',
      count: stage1Visitors,
      conversionRate: 100,
      dropoffRate: 0,
    },
    {
      id: 'exploration',
      name: '2. Product Exploration',
      description: 'Navigated categories & explored products',
      count: stage2ProductExploration,
      conversionRate: totalVisitors > 0 ? Math.round((stage2ProductExploration / totalVisitors) * 100) : 0,
      dropoffRate: totalVisitors > 0 ? Math.round(((totalVisitors - stage2ProductExploration) / totalVisitors) * 100) : 0,
    },
    {
      id: 'cart_intent',
      name: '3. Add-to-Cart Intent',
      description: 'Clicked "Add to Cart" or "Quick Buy"',
      count: stage3CartIntent,
      conversionRate: totalVisitors > 0 ? Math.round((stage3CartIntent / totalVisitors) * 100) : 0,
      dropoffRate:
        stage2ProductExploration > 0
          ? Math.round(((stage2ProductExploration - stage3CartIntent) / stage2ProductExploration) * 100)
          : 0,
    },
    {
      id: 'checkout_review',
      name: '4. Cart Review & Checkout',
      description: 'Inspected shopping cart drawer / checkout',
      count: stage4CheckoutReview,
      conversionRate: totalVisitors > 0 ? Math.round((stage4CheckoutReview / totalVisitors) * 100) : 0,
      dropoffRate:
        stage3CartIntent > 0
          ? Math.round(((stage3CartIntent - stage4CheckoutReview) / stage3CartIntent) * 100)
          : 0,
    },
  ];

  return {
    totalSessions: totalVisitors,
    overallConversionRate: totalVisitors > 0 ? ((stage4CheckoutReview / totalVisitors) * 100).toFixed(1) : '0.0',
    stages,
  };
}
