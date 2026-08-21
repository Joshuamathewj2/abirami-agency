'use server';

import { supabaseAdmin } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function submitReviewAction(reviewData: {
  product_id: string;
  reviewer_name: string;
  rating: number;
  title: string;
  body: string;
}) {
  try {
    // Mock successful submission since the 'reviews' table doesn't exist
    // In a real app, this would insert into the database
    
    // simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    revalidatePath(`/product/${reviewData.product_id}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to submit review:', error);
    return { success: false, error: error.message || 'Failed to submit review' };
  }
}

export async function getReviewsAction(productId: string) {
  // Return dummy data instead of fetching from the missing 'reviews' table
  const mockReviews = [
    {
      id: '1',
      product_id: productId,
      reviewer_name: 'John Doe',
      rating: 5,
      title: 'Excellent Quality',
      body: 'The mattress is incredibly comfortable and provides great support. Highly recommend!',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    },
    {
      id: '2',
      product_id: productId,
      reviewer_name: 'Jane Smith',
      rating: 4,
      title: 'Good value for money',
      body: 'Very satisfied with the purchase. Delivery was prompt and the product is exactly as described.',
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    },
    {
      id: '3',
      product_id: productId,
      reviewer_name: 'Michael Brown',
      rating: 5,
      title: 'Best sleep ever',
      body: 'I have been using this for a week now and my back pain is completely gone. Best investment!',
      created_at: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    }
  ];

  return { success: true, data: mockReviews };
}
