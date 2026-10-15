'use server';

import { supabaseAdmin } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { testimonials as staticTestimonials } from '@/lib/mock-data';

/**
 * Moderation Flag:
 * - When `true`: New & edited reviews are automatically approved and appear immediately on the storefront.
 * - When `false`: New reviews are saved with status 'pending' awaiting moderation,
 *   and edits by non-admin users go back to 'pending'.
 */
const AUTO_APPROVE_REVIEWS = true;

export interface SubmitReviewInput {
  product_id?: string;
  reviewer_name: string;
  rating: number;
  title?: string;
  body: string;
  location?: string;
  user_id?: string;
  user_email?: string;
}

export interface ReviewItem {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  name: string;
  location: string;
  rating: number;
  title?: string;
  comment: string;
  date?: string;
  is_static?: boolean;
}

/**
 * Helper to determine current user authentication and admin status on the server.
 */
export async function getReviewAuthContext() {
  try {
    const cookieStore = await cookies();
    const adminSession = cookieStore.get('admin_session')?.value === 'true';

    let user: { id: string; email?: string } | null = null;
    let isAdmin = adminSession;

    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        user = {
          id: data.user.id,
          email: data.user.email,
        };

        const userEmail = data.user.email?.toLowerCase() ?? '';
        const ADMIN_EMAILS = [
          'joshuamathewj2@gmail.com',
          ...(process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []),
          ...(process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) ?? []),
        ];

        if (ADMIN_EMAILS.includes(userEmail)) {
          isAdmin = true;
        } else {
          const userRole = data.user.user_metadata?.role || '';
          if (userRole.toLowerCase() === 'admin') {
            isAdmin = true;
          } else {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', data.user.id)
              .single();
            if (profile?.role?.toLowerCase() === 'admin') {
              isAdmin = true;
            }
          }
        }
      }
    } catch {
      // Supabase auth client unavailable (e.g. anonymous visitor)
    }

    return { user, isAdmin };
  } catch (err) {
    console.error('Error getting review auth context:', err);
    return { user: null, isAdmin: false };
  }
}

/**
 * Submits a customer review to the database.
 * Automatically attaches authenticated user details if logged in.
 * If public.reviews table is not yet created, automatically stores in inquiries
 * so no reviews are ever lost.
 */
export async function submitReviewAction(reviewData: SubmitReviewInput) {
  try {
    const reviewerName = (reviewData.reviewer_name || '').trim();
    const body = (reviewData.body || '').trim();
    const rating = Math.max(1, Math.min(5, Math.round(Number(reviewData.rating) || 5)));
    const title = (reviewData.title || '').trim();
    const location = (reviewData.location || 'Chennai').trim();
    const productId = reviewData.product_id || 'general';

    if (!reviewerName || !body || rating < 1) {
      return { success: false, error: 'Please enter your name, rating, and review text.' };
    }

    // Determine current user session if not supplied explicitly
    let userId = reviewData.user_id || null;
    let userEmail = reviewData.user_email || null;

    if (!userId || !userEmail) {
      const auth = await getReviewAuthContext();
      if (auth.user) {
        if (!userId) userId = auth.user.id;
        if (!userEmail) userEmail = auth.user.email || null;
      }
    }

    const reviewStatus = AUTO_APPROVE_REVIEWS ? 'approved' : 'pending';

    // 1. Attempt primary write to 'reviews' table
    let savedToPrimary = false;
    let insertedId = '';

    try {
      const { data: inserted, error: revErr } = await supabaseAdmin
        .from('reviews')
        .insert([
          {
            product_id: productId,
            reviewer_name: reviewerName,
            rating,
            title: title || null,
            body,
            location,
            status: reviewStatus,
            user_id: userId,
            user_email: userEmail,
          },
        ])
        .select('id')
        .single();

      if (!revErr && inserted) {
        savedToPrimary = true;
        insertedId = inserted.id;
      }
    } catch {
      savedToPrimary = false;
    }

    // 2. If 'reviews' table does not exist or errored, seamlessly fallback to 'inquiries'
    if (!savedToPrimary) {
      const { data: inqData, error: inqErr } = await supabaseAdmin
        .from('inquiries')
        .insert([
          {
            customer_name: reviewerName,
            customer_phone: 'REVIEW',
            customer_address: location,
            status: reviewStatus,
            notes: JSON.stringify({
              is_review: true,
              product_id: productId,
              rating,
              title,
              body,
              location,
              user_id: userId,
              user_email: userEmail,
            }),
          },
        ])
        .select('id')
        .single();

      if (inqErr) {
        console.error('Fallback review storage failed:', inqErr);
        return { success: false, error: 'Unable to save review. Please try again.' };
      }
      if (inqData) {
        insertedId = inqData.id;
      }
    }

    // Purge cached home page and product page so new review appears
    revalidatePath('/');
    if (productId && productId !== 'general') {
      revalidatePath(`/product/${productId}`);
    }

    return {
      success: true,
      instant: AUTO_APPROVE_REVIEWS,
      status: reviewStatus,
      review: {
        id: insertedId,
        user_id: userId,
        user_email: userEmail,
        name: reviewerName,
        location,
        rating,
        title,
        comment: body,
        date: new Date().toISOString(),
        is_static: false,
      },
    };
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    return { success: false, error: error.message || 'Failed to submit review' };
  }
}

/**
 * Updates an existing review.
 * Server-enforces permissions: caller must be an admin OR the review owner.
 * If moderation is on, non-admin edits are set back to 'pending'.
 */
export async function updateReviewAction(
  reviewId: string,
  updateData: {
    reviewer_name?: string;
    rating?: number;
    title?: string;
    body?: string;
    location?: string;
  }
) {
  try {
    const auth = await getReviewAuthContext();

    const reviewerName = (updateData.reviewer_name || '').trim();
    const body = (updateData.body || '').trim();
    const rating = Math.max(1, Math.min(5, Math.round(Number(updateData.rating) || 5)));
    const title = (updateData.title || '').trim();
    const location = (updateData.location || 'Chennai').trim();

    if (!reviewerName || !body || rating < 1) {
      return { success: false, error: 'Please enter your name, rating, and review text.' };
    }

    // Check primary 'reviews' table first
    let foundInPrimary = false;
    let existingReview: any = null;

    try {
      const { data: revData } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();
      if (revData) {
        foundInPrimary = true;
        existingReview = revData;
      }
    } catch {
      foundInPrimary = false;
    }

    // Check fallback 'inquiries' if not found
    let foundInFallback = false;
    let fallbackNotes: any = null;

    if (!foundInPrimary) {
      const { data: inqData } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', reviewId)
        .eq('customer_phone', 'REVIEW')
        .single();

      if (inqData) {
        foundInFallback = true;
        try {
          fallbackNotes = JSON.parse(inqData.notes || '{}');
        } catch {
          fallbackNotes = {};
        }
      }
    }

    if (!foundInPrimary && !foundInFallback) {
      return { success: false, error: 'Review not found or static fixtures cannot be modified.' };
    }

    // Verify ownership permissions
    const ownerId = foundInPrimary ? existingReview.user_id : fallbackNotes?.user_id;
    const ownerEmail = foundInPrimary ? existingReview.user_email : fallbackNotes?.user_email;

    const isOwner =
      auth.user &&
      ((ownerId && auth.user.id === ownerId) ||
        (ownerEmail && auth.user.email && auth.user.email.toLowerCase() === ownerEmail.toLowerCase()));

    if (!auth.isAdmin && !isOwner) {
      return { success: false, error: 'Forbidden: You do not have permission to edit this review.' };
    }

    // Determine moderation status:
    // If admin is editing, it stays approved.
    // If regular user is editing: if AUTO_APPROVE_REVIEWS is false, it goes back to 'pending'; if true, remains 'approved'.
    const newStatus = auth.isAdmin || AUTO_APPROVE_REVIEWS ? 'approved' : 'pending';

    if (foundInPrimary) {
      const { error: updErr } = await supabaseAdmin
        .from('reviews')
        .update({
          reviewer_name: reviewerName,
          rating,
          title: title || null,
          body,
          location,
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId);

      if (updErr) {
        return { success: false, error: updErr.message || 'Failed to update review' };
      }
    } else {
      const updatedNotes = {
        ...fallbackNotes,
        rating,
        title,
        body,
        location,
      };

      const { error: updErr } = await supabaseAdmin
        .from('inquiries')
        .update({
          customer_name: reviewerName,
          customer_address: location,
          status: newStatus,
          notes: JSON.stringify(updatedNotes),
        })
        .eq('id', reviewId);

      if (updErr) {
        return { success: false, error: updErr.message || 'Failed to update review' };
      }
    }

    revalidatePath('/');
    return {
      success: true,
      status: newStatus,
      review: {
        id: reviewId,
        user_id: ownerId,
        user_email: ownerEmail,
        name: reviewerName,
        location,
        rating,
        title,
        comment: body,
        date: new Date().toISOString(),
        is_static: false,
      },
    };
  } catch (err: any) {
    console.error('Error updating review:', err);
    return { success: false, error: err.message || 'Failed to update review' };
  }
}

/**
 * Deletes a review.
 * Server-enforces permissions: caller must be an admin OR the review owner.
 */
export async function deleteReviewAction(reviewId: string) {
  try {
    const auth = await getReviewAuthContext();

    // Check primary 'reviews' table
    let foundInPrimary = false;
    let existingReview: any = null;

    try {
      const { data: revData } = await supabaseAdmin
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();
      if (revData) {
        foundInPrimary = true;
        existingReview = revData;
      }
    } catch {
      foundInPrimary = false;
    }

    let foundInFallback = false;
    let fallbackNotes: any = null;

    if (!foundInPrimary) {
      const { data: inqData } = await supabaseAdmin
        .from('inquiries')
        .select('*')
        .eq('id', reviewId)
        .eq('customer_phone', 'REVIEW')
        .single();

      if (inqData) {
        foundInFallback = true;
        try {
          fallbackNotes = JSON.parse(inqData.notes || '{}');
        } catch {
          fallbackNotes = {};
        }
      }
    }

    if (!foundInPrimary && !foundInFallback) {
      return { success: false, error: 'Review not found or static fixtures cannot be deleted.' };
    }

    // Verify ownership permissions
    const ownerId = foundInPrimary ? existingReview.user_id : fallbackNotes?.user_id;
    const ownerEmail = foundInPrimary ? existingReview.user_email : fallbackNotes?.user_email;

    const isOwner =
      auth.user &&
      ((ownerId && auth.user.id === ownerId) ||
        (ownerEmail && auth.user.email && auth.user.email.toLowerCase() === ownerEmail.toLowerCase()));

    if (!auth.isAdmin && !isOwner) {
      return { success: false, error: 'Forbidden: You do not have permission to delete this review.' };
    }

    if (foundInPrimary) {
      const { error: delErr } = await supabaseAdmin
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      if (delErr) {
        return { success: false, error: delErr.message || 'Failed to delete review' };
      }
    } else {
      const { error: delErr } = await supabaseAdmin
        .from('inquiries')
        .delete()
        .eq('id', reviewId);
      if (delErr) {
        return { success: false, error: delErr.message || 'Failed to delete review' };
      }
    }

    revalidatePath('/');
    return { success: true, id: reviewId };
  } catch (err: any) {
    console.error('Error deleting review:', err);
    return { success: false, error: err.message || 'Failed to delete review' };
  }
}

/**
 * Fetches all approved testimonials for the storefront carousel.
 * Loads from DB (newest first), merged with curated static testimonials.
 */
export async function getApprovedTestimonialsAction(): Promise<ReviewItem[]> {
  const dbReviews: ReviewItem[] = [];

  try {
    // 1. Try fetching from 'reviews' table
    const { data: primaryData, error: primaryErr } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!primaryErr && primaryData && primaryData.length > 0) {
      primaryData.forEach((r: any) => {
        dbReviews.push({
          id: r.id,
          user_id: r.user_id || null,
          user_email: r.user_email || null,
          name: r.reviewer_name,
          location: r.location || 'Chennai',
          rating: Number(r.rating) || 5,
          title: r.title || '',
          comment: r.body || '',
          date: r.created_at,
          is_static: false,
        });
      });
    } else {
      // 2. Fallback: fetch reviews stored in inquiries table
      const { data: fallbackData } = await supabaseAdmin
        .from('inquiries')
        .select('id, customer_name, customer_address, notes, created_at')
        .eq('customer_phone', 'REVIEW')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50);

      if (fallbackData && fallbackData.length > 0) {
        fallbackData.forEach((row: any) => {
          let parsed: any = {};
          try {
            parsed = JSON.parse(row.notes || '{}');
          } catch {
            // non-json
          }

          if (parsed.is_review) {
            dbReviews.push({
              id: row.id,
              user_id: parsed.user_id || null,
              user_email: parsed.user_email || null,
              name: row.customer_name || 'Verified Customer',
              location: parsed.location || row.customer_address || 'Chennai',
              rating: Number(parsed.rating) || 5,
              title: parsed.title || '',
              comment: parsed.body || '',
              date: row.created_at,
              is_static: false,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch DB reviews, falling back to static:', err);
  }

  // Deduplicate and merge: DB reviews first (newest), followed by static testimonials
  const existingComments = new Set(dbReviews.map(r => r.comment.trim().toLowerCase()));
  const filteredStatic = staticTestimonials.filter(
    s => !existingComments.has(s.comment.trim().toLowerCase())
  );

  const staticItems: ReviewItem[] = filteredStatic.map(s => ({
    ...s,
    is_static: true,
  }));

  return [...dbReviews, ...staticItems];
}

/**
 * Fetches reviews for a specific product.
 */
export async function getReviewsAction(productId: string) {
  try {
    const { data: primaryData, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (!error && primaryData && primaryData.length > 0) {
      return { success: true, data: primaryData };
    }
  } catch {
    // fallback
  }

  return { success: true, data: [] };
}
