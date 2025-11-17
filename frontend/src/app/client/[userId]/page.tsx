'use client';

import { useState } from 'react';
import { Card, Button, Badge, Rating } from 'flowbite-react';
import { ChevronLeft, ChevronRight, Star, ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Mock data for recommended grocery items
const mockRecommendations = [
  {
    id: 1,
    name: 'Organic Avocados',
    description: 'Fresh ripe Hass avocados, perfect for toast, salads, and guacamole',
    price: 5.99,
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=500&h=400&fit=crop',
    rating: 4.7,
    reviews: 234,
    category: 'Produce',
    preparationTime: 'Ready to eat',
    trending: true,
    discount: 15
  },
  {
    id: 2,
    name: 'Grass-Fed Ground Beef',
    description: '1 lb package of premium grass-fed ground beef, 85% lean',
    price: 12.99,
    image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&h=400&fit=crop',
    rating: 4.8,
    reviews: 456,
    category: 'Meat',
    preparationTime: 'Cook before eating',
    trending: true,
    discount: null
  },
  {
    id: 3,
    name: 'Fresh Atlantic Salmon',
    description: 'Wild-caught salmon fillet, rich in omega-3, 1 lb',
    price: 18.99,
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=500&h=400&fit=crop',
    rating: 4.9,
    reviews: 312,
    category: 'Seafood',
    preparationTime: 'Cook before eating',
    trending: false,
    discount: 10
  },
  {
    id: 4,
    name: 'Organic Blueberries',
    description: 'Fresh organic blueberries, 16 oz container, perfect for smoothies',
    price: 6.49,
    image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=500&h=400&fit=crop',
    rating: 4.6,
    reviews: 189,
    category: 'Produce',
    preparationTime: 'Ready to eat',
    trending: true,
    discount: null
  },
  {
    id: 5,
    name: 'Extra Virgin Olive Oil',
    description: 'Cold-pressed Italian extra virgin olive oil, 500ml bottle',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&h=400&fit=crop',
    rating: 4.8,
    reviews: 567,
    category: 'Pantry',
    preparationTime: 'Ready to use',
    trending: false,
    discount: 20
  },
  {
    id: 6,
    name: 'Organic Free-Range Eggs',
    description: 'Cage-free organic eggs, 12 count, rich and nutritious',
    price: 7.99,
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=500&h=400&fit=crop',
    rating: 4.9,
    reviews: 423,
    category: 'Dairy',
    preparationTime: 'Cook before eating',
    trending: true,
    discount: null
  },
  {
    id: 7,
    name: 'Greek Yogurt',
    description: 'Creamy full-fat Greek yogurt, high protein, 32 oz container',
    price: 5.49,
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&h=400&fit=crop',
    rating: 4.7,
    reviews: 298,
    category: 'Dairy',
    preparationTime: 'Ready to eat',
    trending: false,
    discount: null
  },
  {
    id: 8,
    name: 'Organic Quinoa',
    description: 'Pre-washed organic tri-color quinoa, 2 lb bag, gluten-free',
    price: 9.99,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&h=400&fit=crop',
    rating: 4.5,
    reviews: 201,
    category: 'Pantry',
    preparationTime: 'Cook before eating',
    trending: false,
    discount: 15
  },
  {
    id: 9,
    name: 'Fresh Baby Spinach',
    description: 'Organic baby spinach leaves, 16 oz bag, pre-washed',
    price: 4.99,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&h=400&fit=crop',
    rating: 4.6,
    reviews: 178,
    category: 'Produce',
    preparationTime: 'Ready to eat',
    trending: true,
    discount: null
  },

  {
    id: 10,
    name: 'Sourdough Bread',
    description: 'Artisan sourdough bread, freshly baked, 24 oz loaf',
    price: 6.99,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=500&h=400&fit=crop',
    rating: 4.9,
    reviews: 389,
    category: 'Bakery',
    preparationTime: 'Ready to eat',
    trending: false,
    discount: null
  },
];

export default function ClientPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6;
  const totalPages = Math.ceil(mockRecommendations.length / itemsPerPage);

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
    return mockRecommendations.slice(startIndex, startIndex + itemsPerPage);
  };
  const router = useRouter();

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

        {/* Carousel Section */}
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

        {/* Additional Info Section */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Recommendations updated based on your preferences
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
