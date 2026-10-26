import { createContext, useContext, useState, type ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { testimonials as initialReviews } from "../data/products";

export interface Review {
  id: string;
  productId?: string;
  userId?: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

function toReview(doc: Record<string, unknown>): Review {
  return {
    id: String(doc._id || doc.id || ""),
    productId: doc.productId as string,
    userId: doc.userId as string | undefined,
    userName: doc.userName as string,
    rating: doc.rating as number,
    comment: doc.comment as string,
    date: doc.date as string,
  };
}

interface ReviewContextType {
  reviews: Review[];
  isLoading: boolean;
  fetchReviews: (productId?: string) => Promise<void>;
  addReview: (productId: string, data: { rating: number; comment: string }) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
}

const ReviewContext = createContext<ReviewContextType | undefined>(undefined);

export function ReviewProvider({ children }: { children: ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const fetchReviews = async (productId?: string) => {
    try {
      setIsLoading(true);
      const url = productId ? `/api/reviews?productId=${productId}` : "/api/reviews";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setReviews(data.map(toReview));
      } else {
        setReviews(initialReviews);
      }
    } catch (err) {
      console.warn("ReviewContext: Backend server offline, falling back to static reviews", err);
      setReviews(initialReviews);
    } finally {
      setIsLoading(false);
    }
  };

  const addReview = async (productId: string, data: { rating: number; comment: string }) => {
    const token = getToken();
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ productId, ...data }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Failed to submit review");
    }
    const doc = await res.json();
    setReviews(prev => [toReview(doc), ...prev]);
  };

  const deleteReview = async (id: string) => {
    const token = getToken();
    const res = await fetch(`/api/reviews/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete review");
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  return (
    <ReviewContext.Provider value={{ reviews, isLoading, fetchReviews, addReview, deleteReview }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewContext);
  if (context === undefined) {
    throw new Error("useReviews must be used within a ReviewProvider");
  }
  return context;
}
