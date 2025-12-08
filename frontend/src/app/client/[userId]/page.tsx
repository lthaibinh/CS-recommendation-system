'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Rating } from 'flowbite-react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { axiosInstance } from '@/utils/axios';

// Types for API response
interface RecommendationResponse {
  ProductId: number;
  rating: number;
}

interface UserRecommendationsResponse {
  user_id: number;
  recommendations: RecommendationResponse[];
  count: number;
  active_model_version: string;
}

// Interface for display items
interface RecommendationItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  reviews: number;
  category: string;
  preparationTime: string;
  trending: boolean;
  discount: number | null;
}

// Helper function to generate placeholder data for products
const generateProductPlaceholder = (productId: number, rating: number, index: number): RecommendationItem => {
  // Use productId to generate consistent placeholder data
  const categories = ['Produce', 'Meat', 'Seafood', 'Dairy', 'Pantry', 'Bakery', 'Beverages', 'Snacks'];
  const category = categories[productId % categories.length];
  
  // Generate consistent placeholder images based on productId
  const imageIds = [
    '1523049673857-eb18f1d7b578', // Avocado
    '1603048588665-791ca8aea617', // Beef
    '1519708227418-c8fd9a32b7a2', // Salmon
    '1498557850523-fd3d118b962e', // Blueberries
    '1474979266404-7eaacbcd87c5', // Olive Oil
    '1582722872445-44dc5f7e3c8f', // Eggs
    '1488477181946-6428a0291777', // Yogurt
    '1586201375761-83865001e31c', // Quinoa
    '1576045057995-568f588f82fb', // Spinach
    '1549931319-a545dcf3bc73', // Bread
  ];
  const imageId = imageIds[productId % imageIds.length];
  
  // Generate price based on productId (consistent)
  const basePrice = 5.99 + (productId % 20) * 0.5;
  
  return {
    id: productId,
    name: `Product ${productId}`,
    description: `High-quality product ${productId} from our curated selection`,
    price: Math.round(basePrice * 100) / 100,
    image: `https://images.unsplash.com/photo-${imageId}?w=500&h=400&fit=crop`,
    rating: Math.min(5, Math.max(3.5, rating)), // Clamp rating between 3.5 and 5
    reviews: 100 + (productId % 500),
    category: category,
    preparationTime: index % 2 === 0 ? 'Ready to eat' : 'Cook before eating',
    trending: index < 3, // First 3 items are trending
    discount: index % 3 === 0 ? (10 + (index % 3) * 5) : null,
  };
};

export default function ClientPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 6;
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId ? parseInt(params.userId as string) : null;

  // Fetch recommendations from API
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!userId) {
        setError('User ID not found');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get<UserRecommendationsResponse>(
          `/recommendations/${userId}?num_items=100`
        );
        
        // Transform API response to display format
        const transformedRecommendations = response.data.recommendations.map((rec, index) =>
          generateProductPlaceholder(rec.ProductId, rec.rating, index)
        );
        
        setRecommendations(transformedRecommendations);
      } catch (err: any) {
        console.error('Error fetching recommendations:', err);
        setError(err.response?.data?.detail || err.message || 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId]);

  const totalPages = Math.ceil(recommendations.length / itemsPerPage);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === totalPages - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? totalPages - 1 : prevIndex - 1
    );
  };

  const getCurrentItems = () => {
    const startIndex = currentIndex * itemsPerPage;
    return recommendations.slice(startIndex, startIndex + itemsPerPage);
  };

  const calculateDiscountedPrice = (price: number, discount: number | null) => {
    if (!discount) return null;
    return (price * (1 - discount / 100)).toFixed(2);
  };

  const logout = () => {
    document.cookie = "role=; path=/; userId=;";
    router.push('/login');

  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <button onClick={logout} className="absolute top-4 right-10 text-sm text-gray-600 dark:text-gray-400 bg-blue-500 text-white px-4 py-2 rounded-md">Logout</button>
      <div className="container mx-auto px-24 py-12">
        {/* Header Section */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Recommendations For You
            </h1>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Personalized grocery picks based on your shopping preferences and purchase history
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading recommendations...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 text-xl mb-2">⚠️ Error</div>
              <p className="text-gray-600 dark:text-gray-400">{error}</p>
              <Button
                color="blue"
                className="mt-4"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  const fetchRecommendations = async () => {
                    if (!userId) return;
                    try {
                      const response = await axiosInstance.get<UserRecommendationsResponse>(
                        `/recommendations/${userId}?num_items=100`
                      );
                      const transformedRecommendations = response.data.recommendations.map((rec, index) =>
                        generateProductPlaceholder(rec.ProductId, rec.rating, index)
                      );
                      setRecommendations(transformedRecommendations);
                      setError(null);
                    } catch (err: any) {
                      setError(err.response?.data?.detail || err.message || 'Failed to fetch recommendations');
                    } finally {
                      setLoading(false);
                    }
                  };
                  fetchRecommendations();
                }}
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Carousel Section */}
        {!loading && !error && recommendations.length > 0 && (
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            aria-label="Previous recommendations"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800"
            aria-label="Next recommendations"
          >
            <ChevronRight className="w-6 h-6 text-gray-800 dark:text-white" />
          </button>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 2xl:grid-cols-6 gap-4 px-8">
            {getCurrentItems().map((item, index) => (
              <div
                key={item.id}
                className="transform transition-all duration-300 hover:scale-105"
              >

                <Card className="h-full overflow-hidden hover:shadow-2xl">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    {/* Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2">
                      <Badge color="failure" className="w-fit">
                        <div className="flex items-center gap-1">
                          #
                          <span>{currentIndex * itemsPerPage + index + 1}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-5">

                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">
                      {item.name}
                    </h3>






                    {/* Price and CTA Section */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col">
                        {item.discount ? (
                          <>
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              ${item.price.toFixed(2)}
                            </span>
                            <span className=" font-bold text-green-600 dark:text-green-400">
                              ${calculateDiscountedPrice(item.price, item.discount)}
                            </span>
                          </>
                        ) : (
                          <span className=" font-bold text-gray-900 dark:text-white">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <Button
                        color="blue"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add
                      </Button>
                    </div>
                  </div>

                  <span className="font-bold text-gray-900 dark:text-white text-right">ProductId: {item.id}</span>
                </Card>
             

              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-3 rounded-full transition-all duration-300 focus:outline-none ${index === currentIndex
                  ? 'w-8 bg-blue-600 dark:bg-blue-400'
                  : 'w-3 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                  }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        </div>
        )}

        {/* Empty State */}
        {!loading && !error && recommendations.length === 0 && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No recommendations available at this time.
              </p>
            </div>
          </div>
        )}

        {/* Additional Info Section */}
        {!loading && !error && recommendations.length > 0 && (
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Recommendations updated based on your preferences
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
