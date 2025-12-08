'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Badge, Rating } from 'flowbite-react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Clock, TrendingUp, Trash2, Plus } from 'lucide-react';
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

// Interface for cart items
interface CartItem extends RecommendationItem {
  quantity: number;
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
  const [notification, setNotification] = useState<{ message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
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

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const addToCart = (item: RecommendationItem) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.id === item.id);
      
      if (existingItem) {
        // If item already exists, increase quantity
        return prevCart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // If item doesn't exist, add it with quantity 1
        return [...prevCart, { ...item, quantity: 1 }];
      }
    });
    showNotification('Đã thêm vào giỏ hàng', 'success');
  };

  const removeFromCart = (itemId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    showNotification('Đã xóa khỏi giỏ hàng', 'info');
  };

  const updateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.discount 
        ? parseFloat(calculateDiscountedPrice(item.price, item.discount) || '0')
        : item.price;
      return total + price * item.quantity;
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      showNotification('Giỏ hàng của bạn đang trống', 'error');
      return;
    }
    
    // Simulate checkout process
    showNotification('Đặt hàng thành công', 'success');
    
    // Clear cart after successful checkout
    setTimeout(() => {
      setCart([]);
    }, 1000);
  };

  const handleDislike = async (productId: number) => {
    try {
      // Show notification message
      showNotification('Cảm ơn bạn đã phản hồi', 'success');
      
      // Here you can add the actual API call when ready
      // await axiosInstance.post(`/recommendations/${userId}/dislike`, { productId });
    } catch (error) {
      console.error('Error disliking product:', error);
      showNotification('Có lỗi xảy ra khi xử lý yêu cầu', 'error');
    }
  };

  const logout = () => {
    // Delete cookies by setting them to expire in the past
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "userId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 transition-all duration-300 ease-in-out transform animate-pulse">
          <div className={`${
            notification.type === 'success' 
              ? 'bg-green-500 dark:bg-green-600' 
              : notification.type === 'error'
              ? 'bg-red-500 dark:bg-red-600'
              : 'bg-blue-500 dark:bg-blue-600'
          } text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px]`}>
            {notification.type === 'success' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {notification.type === 'info' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}
      <button onClick={logout} className="absolute top-4 right-10 text-sm text-gray-600 dark:text-gray-400 bg-blue-500 text-white px-4 py-2 rounded-md z-10">Logout</button>
      <div className="container mx-auto px-6 py-8">
        {/* Main Layout - Two Columns */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Recommendations */}
          <div className="flex-1 lg:w-2/3">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 px-2 lg:px-4">
            {getCurrentItems().map((item, index) => (
              <div
                key={item.id}
                className="transform transition-all duration-300 hover:scale-105"
              >

                <Card className="h-full overflow-hidden hover:shadow-2xl">
                  {/* Image Section */}
                  <div className="relative h-48 overflow-hidden group">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                    />
                    {/* Badges Overlay */}
                    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                      <Badge color="failure" className="w-fit">
                        <div className="flex items-center gap-1">
                          #
                          <span>{currentIndex * itemsPerPage + index + 1}</span>
                        </div>
                      </Badge>
                    </div>
                    {/* Dislike Overlay - appears on hover */}
                    <div className="absolute inset-0 bg-black/40 dark:bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
                      <button
                        onClick={() => handleDislike(item.id)}
                        className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/50"
                        aria-label="Dislike this product"
                      >
<svg fill="#fd0808" height="64px" width="64px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 492.308 492.308"  stroke="#fd0808"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M363.731,32.481v53.418h-44.664l-98.096-29.034L59.942,56.462c-23.048,0-41.808,18.755-41.808,41.812 c0,10.406,3.96,19.816,10.273,27.141c-13.227,7.028-22.359,20.788-22.359,36.782c0,12.89,5.987,24.29,15.185,31.966 c-9.197,7.675-15.185,19.075-15.185,31.962c0,11.483,4.662,21.892,12.18,29.456C7.239,263.121,0,275.749,0,290.053 c0,23.058,18.76,41.813,41.808,41.813l114.904,0.063c-10.51,28.942-12.99,58.5-13.067,79.452 c-0.048,12.899,4.961,25.053,14.096,34.221c9.135,9.173,21.279,14.226,34.192,14.226c26.615,0,48.269-21.654,48.269-48.269v-3.457 c12.644-81.447,82.048-103.827,91.933-106.615h31.596v31.317h128.577V32.481H363.731z M363.731,281.793h-32.894l-2.365,0.289 c-0.923,0.226-92.837,24.043-107.856,123.803l-0.106,5.673c0,15.76-12.817,28.577-28.577,28.577 c-7.635,0-14.827-2.995-20.24-8.433c-5.413-5.433-8.385-12.625-8.356-20.255c0.077-22.375,3.087-55.317,17-85.202l6.519-13.99 l-145.038-0.082c-12.202,0-22.125-9.923-22.125-22.12c0-12.192,9.923-22.115,22.125-22.115h6.038h44.933v-19.692H47.856 c-12.192,0-22.115-9.923-22.115-22.12c0-12.192,9.923-22.115,22.115-22.115h55.01h6.048v-19.692h-6.048h-55.01 c-12.192,0-22.115-9.923-22.115-22.12c0-12.192,9.923-22.115,22.115-22.115h12.087h40.913v-19.692H59.942 c-12.192,0-22.115-9.923-22.115-22.115c0-12.197,9.923-22.12,22.115-22.12H216.75l98.096,29.034l48.885,0.336V281.793z M472.615,313.111h-89.192V52.173h89.192V313.111z"></path> </g> </g> </g></svg>                      </button>
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
                        onClick={() => addToCart(item)}
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
              <div className="mt-8 text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Recommendations updated based on your preferences
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Cart */}
          <div className="w-full lg:w-[400px] lg:sticky lg:top-6 h-fit">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 h-[calc(100vh-100px)] mt-[50px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Giỏ hàng
                  </h2>
                  {cart.length > 0 && (
                    <Badge color="blue" className="ml-1">
                      {cart.length}
                    </Badge>
                  )}
                </div>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Giỏ hàng trống
                  </p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Thêm sản phẩm từ danh sách
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Cart Items List */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                    {cart.map((item) => {
                      const itemPrice = item.discount 
                        ? parseFloat(calculateDiscountedPrice(item.price, item.discount) || '0')
                        : item.price;
                      
                      return (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {/* Product Image and Info Row */}
                          <div className="flex items-start gap-3 mb-2">
                            {/* Product Image */}
                            <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Product Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate mb-1">
                                {item.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                {item.discount && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 line-through">
                                    ${item.price.toFixed(2)}
                                  </span>
                                )}
                                <span className="font-bold text-sm text-green-600 dark:text-green-400">
                                  ${itemPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                              aria-label="Remove from cart"
                            >
                              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </button>
                          </div>

                          {/* Quantity Controls and Total Row */}
                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <svg className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                </svg>
                              </button>
                              <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
                              </button>
                            </div>

                            {/* Item Total */}
                            <div className="text-right">
                              <p className="font-bold text-sm text-gray-900 dark:text-white">
                                ${(itemPrice * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Cart Summary */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-base font-semibold text-gray-900 dark:text-white">
                        Tổng cộng:
                      </span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      color="blue"
                      size="lg"
                      className="w-full flex items-center justify-center gap-2 py-2.5"
                      onClick={handleCheckout}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Thanh toán
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
