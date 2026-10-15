import { NextResponse } from 'next/server';
import { updateReviewAction, deleteReviewAction } from '@/app/actions/reviewActions';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/reviews/[id]
 * Updates an existing review.
 * Server verifies that the caller is either an admin or the original author of the review.
 */
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const result = await updateReviewAction(id, body);

    if (!result.success) {
      const statusCode = result.error?.includes('Forbidden')
        ? 403
        : result.error?.includes('not found')
        ? 404
        : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('PATCH /api/reviews/[id] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reviews/[id]
 * Deletes an existing review.
 * Server verifies that the caller is either an admin or the original author of the review.
 */
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Review ID is required' }, { status: 400 });
    }

    const result = await deleteReviewAction(id);

    if (!result.success) {
      const statusCode = result.error?.includes('Forbidden')
        ? 403
        : result.error?.includes('not found')
        ? 404
        : 400;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('DELETE /api/reviews/[id] error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
