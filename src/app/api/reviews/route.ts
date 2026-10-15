import { NextResponse } from 'next/server';
import { getApprovedTestimonialsAction, submitReviewAction } from '@/app/actions/reviewActions';

/**
 * GET /api/reviews
 * Returns the latest approved testimonials.
 */
export async function GET() {
  try {
    const reviews = await getApprovedTestimonialsAction();
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 * Submits a new review.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitReviewAction(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
