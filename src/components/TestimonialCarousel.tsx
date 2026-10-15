'use client';

import { useState, useMemo } from 'react';
import { useUserStore } from '@/store/userStore';
import { ReviewItem } from '@/app/actions/reviewActions';

interface TestimonialCarouselProps {
  initialReviews: ReviewItem[];
  initialIsAdmin?: boolean;
  serverUserId?: string | null;
  serverUserEmail?: string | null;
}

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const iconClass = size === 'lg' ? 'w-8 h-8' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${iconClass} ${star <= rating ? 'text-amber-400' : 'text-gray-200'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onSelect(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
            className="cursor-pointer transition-transform hover:scale-110 p-0.5"
          >
            <svg
              className={`w-9 h-9 transition-colors duration-150 ${
                star <= (hovered || rating) ? 'text-amber-400' : 'text-gray-200'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
      {(hovered || rating) > 0 && (
        <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
          {labels[hovered || rating]}
        </span>
      )}
    </div>
  );
}

export default function TestimonialCarousel({
  initialReviews,
  initialIsAdmin = false,
  serverUserId = null,
  serverUserEmail = null,
}: TestimonialCarouselProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const { user: clientUser, profile } = useUserStore();

  const isAdmin = initialIsAdmin || profile?.role === 'admin';
  const currentUserId = clientUser?.id || serverUserId;
  const currentUserEmail = clientUser?.email || serverUserEmail;

  // Modal States
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [deleteConfirmReview, setDeleteConfirmReview] = useState<ReviewItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  // Whether user can edit/delete a specific review
  const canModifyReview = (item: ReviewItem) => {
    if (item.is_static) return false; // Seeded system fixtures are immutable
    if (isAdmin) return true;
    if (currentUserId && item.user_id && currentUserId === item.user_id) return true;
    if (
      currentUserEmail &&
      item.user_email &&
      currentUserEmail.toLowerCase() === item.user_email.toLowerCase()
    )
      return true;
    return false;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormName(profile?.full_name || clientUser?.user_metadata?.full_name || '');
    setFormRating(5);
    setFormTitle('');
    setFormBody('');
    setFormError('');
    setIsNewModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: ReviewItem) => {
    setEditingReview(item);
    setFormName(item.name);
    setFormRating(item.rating);
    setFormTitle(item.title || '');
    setFormBody(item.comment);
    setFormError('');
  };

  // Submit Handler for Create & Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || formRating === 0 || !formBody.trim()) {
      setFormError('Please enter your name, select a star rating, and write your review.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      if (editingReview) {
        // Edit existing review via PATCH /api/reviews/[id]
        const res = await fetch(`/api/reviews/${editingReview.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewer_name: formName.trim(),
            rating: formRating,
            title: formTitle.trim(),
            body: formBody.trim(),
            location: editingReview.location,
          }),
        });

        const data = await res.json();
        setIsSubmitting(false);

        if (!res.ok || !data.success) {
          setFormError(data.error || 'Failed to update review.');
          return;
        }

        // If moderation sent review back to 'pending' (non-admin and AUTO_APPROVE = false)
        if (data.status === 'pending') {
          setReviews((prev) => prev.filter((r) => r.id !== editingReview.id));
          showToast('Review updated! It will appear on the storefront after approval.', 'success');
        } else {
          // Immediately update in carousel state
          setReviews((prev) =>
            prev.map((r) =>
              r.id === editingReview.id
                ? {
                    ...r,
                    name: formName.trim(),
                    rating: formRating,
                    title: formTitle.trim(),
                    comment: formBody.trim(),
                  }
                : r
            )
          );
          showToast('Review updated successfully!', 'success');
        }

        setEditingReview(null);
      } else {
        // Create new review via POST /api/reviews
        const res = await fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewer_name: formName.trim(),
            rating: formRating,
            title: formTitle.trim(),
            body: formBody.trim(),
            location: 'Chennai',
            user_id: currentUserId || undefined,
            user_email: currentUserEmail || undefined,
          }),
        });

        const data = await res.json();
        setIsSubmitting(false);

        if (!res.ok || !data.success) {
          setFormError(data.error || 'Failed to submit review.');
          return;
        }

        if (data.review && data.instant) {
          // Insert newest review right at the start of DB reviews
          setReviews((prev) => [data.review, ...prev]);
          showToast('Thank you! Your review is now live on our website.', 'success');
        } else {
          showToast('Thank you! Your review will appear after approval.', 'success');
        }

        setIsNewModalOpen(false);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Network error occurred. Please try again.');
    }
  };

  // Confirm Delete Handler
  const handleConfirmDelete = async () => {
    if (!deleteConfirmReview) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/reviews/${deleteConfirmReview.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      setIsDeleting(false);

      if (!res.ok || !data.success) {
        showToast(data.error || 'Failed to delete review.', 'error');
        setDeleteConfirmReview(null);
        return;
      }

      // Immediately remove from carousel state
      setReviews((prev) => prev.filter((r) => r.id !== deleteConfirmReview.id));
      showToast('Review deleted successfully.', 'success');
      setDeleteConfirmReview(null);
    } catch (err: any) {
      setIsDeleting(false);
      showToast(err.message || 'Network error occurred.', 'error');
      setDeleteConfirmReview(null);
    }
  };

  // Pause marquee when any modal or dialog is open
  const isModalActive = isNewModalOpen || !!editingReview || !!deleteConfirmReview;

  // Infinite marquee items: guarantees smooth looping for any number of reviews
  const marqueeItems = useMemo(() => {
    if (reviews.length === 0) return [];
    let base = [...reviews];
    while (base.length < 8) {
      base = [...base, ...reviews];
    }
    return [...base, ...base];
  }, [reviews]);

  return (
    <div className="relative">
      {/* Centered Write a Review Button under subtitle */}
      <div className="mt-6 mb-8 flex justify-center">
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2.5 bg-white text-gray-900 border border-gray-200 hover:border-sky-400 hover:text-primary px-7 py-3.5 rounded-full font-bold text-sm transition-all duration-300 shadow-sm hover:shadow-md group cursor-pointer"
        >
          <svg
            className="w-4 h-4 text-amber-400 group-hover:scale-125 transition-transform"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          Write a Review
        </button>
      </div>

      {/* Marquee Carousel or Empty State */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 px-4 max-w-md mx-auto bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <p className="text-gray-500 text-sm font-medium">
            No customer reviews yet. Be the first to share your experience!
          </p>
        </div>
      ) : (
        <div className="relative w-full before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-16 md:before:w-32 before:bg-gradient-to-r before:from-white before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-16 md:after:w-32 after:bg-gradient-to-l after:from-white after:to-transparent">
          <div
            className="flex gap-6 w-max animate-marquee pause-marquee py-4"
            style={{ animationPlayState: isModalActive ? 'paused' : undefined }}
          >
            {marqueeItems.map((t, i) => {
              const canEditOrDelete = canModifyReview(t);

              return (
                <div
                  key={`${t.id}-${i}`}
                  className="relative w-[320px] md:w-[400px] shrink-0 bg-white rounded-2xl p-6 md:p-8 border border-gray-200 hover:border-primary/20 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Action buttons (Edit & Delete) in top-right corner for review owner or admin */}
                  {canEditOrDelete && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(t);
                        }}
                        aria-label="Edit review"
                        title="Edit review"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmReview(t);
                        }}
                        aria-label="Delete review"
                        title="Delete review"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  )}

                  {/* Top: Star Rating & Title */}
                  <div>
                    <div className="flex items-center justify-between mb-3 pr-14">
                      <StarRating rating={t.rating} />
                    </div>

                    {t.title && (
                      <h4 className="font-bold text-gray-900 text-sm md:text-base leading-snug mb-2">
                        {t.title}
                      </h4>
                    )}

                    <p className="text-gray-700 text-sm md:text-base leading-relaxed mb-6 font-medium">
                      &ldquo;{t.comment}&rdquo;
                    </p>
                  </div>

                  {/* Bottom: Reviewer Profile */}
                  <div className="flex items-center gap-3.5 pt-2 border-t border-gray-100">
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base border border-primary/20 shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{t.name}</p>
                      <p className="text-xs text-gray-500 font-medium truncate">{t.location}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── REVIEW MODAL (Create & Edit) ────────────────────────────────── */}
      {(isNewModalOpen || editingReview) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) {
              setIsNewModalOpen(false);
              setEditingReview(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-6 sm:px-7 py-5 border-b border-gray-100">
              <div>
                <h3 className="text-lg sm:text-xl font-extrabold text-gray-900">
                  {editingReview ? 'Edit Your Review' : 'Share Your Experience'}
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5">
                  Abirami Agency Parryware
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewModalOpen(false);
                  setEditingReview(null);
                }}
                disabled={isSubmitting}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 sm:px-7 py-6">
              <form onSubmit={handleSubmitForm} className="space-y-4">
                {/* Rating Picker */}
                <div className="flex flex-col items-center py-1">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Overall Rating <span className="text-red-500">*</span>
                  </p>
                  <StarPicker rating={formRating} onSelect={setFormRating} />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Headline / Title <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Excellent Parryware fittings and fast delivery!"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Review Details <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formBody}
                    onChange={(e) => setFormBody(e.target.value)}
                    placeholder="Tell us about the product quality, showroom assistance, delivery speed..."
                    rows={4}
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition resize-none"
                  />
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-primary hover:bg-primary-dark disabled:opacity-60 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Saving...</span>
                      </>
                    ) : editingReview ? (
                      'Save Changes'
                    ) : (
                      'Submit Review'
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setIsNewModalOpen(false);
                      setEditingReview(null);
                    }}
                    className="px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRMATION MODAL ─────────────────────────────────────── */}
      {deleteConfirmReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setDeleteConfirmReview(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Review?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Delete this review? This can&apos;t be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteConfirmReview(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── FLOATING TOAST NOTIFICATION ──────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-semibold text-white ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
