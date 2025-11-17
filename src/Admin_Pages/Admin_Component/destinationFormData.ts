export interface DestinationFormData {
    id: number | string | null;
    name: string;
    type: string;
    contact: string;
    country: string;
    city: string;
    latitude: number | null;
    longitude: number | null;
    openingTime: string;
    closingTime: string;
    description: string;
    images: string[];
    imageFiles?: File[];
}

export const emptyDestinationInitialData: DestinationFormData = {
    id: null,
    name: '',
    type: '',
    contact: '',
    country: '',
    city: '',
    latitude: null,
    longitude: null,
    openingTime: '09:00',
    closingTime: '17:00',
    description: '',
    images: [],
    imageFiles: [],
};

export const mockEditDestinationData: DestinationFormData = {
    id: 1,
    name: 'France: Hands-On Cooking Class with Pâtisserie Chef Noémie',
    type: 'Food',
    contact: '+33123456789',
    country: 'France',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522,
    openingTime: '09:30',
    closingTime: '16:00',
    description: "A 3-day immersive culinary experience in Paris focusing on classic French pastry techniques, led by renowned chef Noémie. Includes market visits and final tasting.",
    images: [
        'https://via.placeholder.com/150/FF5733/FFFFFF?text=FrenchDish',
        'https://via.placeholder.com/150/33FF57/FFFFFF?text=NoemieChef',
    ],
};

export const mockViewDestinationData: DestinationFormData = {
    id: 101,
    name: 'Japan: Kyoto Ancient Temples & Matcha Ceremony',
    type: 'Culture',
    contact: '0901234567',
    country: 'Japan',
    city: 'Kyoto',
    latitude: 35.0116,
    longitude: 135.7681,
    openingTime: '08:00',
    closingTime: '18:00',
    description: "A serene journey through Kyoto's historic temples, tranquil gardens, and an authentic matcha tea ceremony. Experience the rich culture and spiritual heritage of Japan.",
    images: [
        'https://via.placeholder.com/150/3498DB/FFFFFF?text=KyotoTemple',
        'https://via.placeholder.com/150/2ECC71/FFFFFF?text=Matcha',
    ],
};
